import * as _ from 'lodash';
import * as Kafka from 'node-rdkafka';

import {
  RDTopicPartitionInterface,
  RDKafkaMetadataInterface,
  RDKafkaMessageInterface,
  RDKafkaMessageErrorInterface,
  RDKafkaConsumerConfigInterface,
} from './interfaces';
import {
  ConnectingError,
  DisconnectError,
  ConnectionNotReadyError,
  ConnectionDeadError,
  ConsumerRuntimeError,
  MetadataError,
  SeekError,
} from './errors';

const SEEK_TIMEOUT = 1000;
const ERROR_CODES = Kafka.CODES.ERRORS;

const ifNotExistedAndSet = (conf: any, key: string, value: any) => {
  if (conf[key] === undefined) {
    conf[key] = value;
    return true;
  }
  return false;
};

export abstract class KafkaBasicConsumer {
  public consumer: Kafka.KafkaConsumer;
  protected dead: boolean;
  protected topics: string[];

  protected offsetStore: { [key: string]: { [key: number]: number } } = {};
  protected errOffsetStore: { [key: string]: { [key: number]: number } } = {};

  constructor(conf: RDKafkaConsumerConfigInterface, topicConf: any = {}) {
    this.dead = false;
    this.topics = [];

    ifNotExistedAndSet(conf, 'rebalance_cb', (err: any, assignment: any) => {
      if (err.code === ERROR_CODES.ERR__ASSIGN_PARTITIONS) {
        // Note: this can throw when you are disconnected. Take care and wrap it in
        // a try catch if that matters to you
        this.consumer.assign(assignment);
        console.log(`Consumer rebalanced at : `);
        for (const assign of assignment) {
          console.log(`   topic ${assign.topic}, partition: ${assign.partition}`);
        }
      } else if (err.code === ERROR_CODES.ERR__REVOKE_PARTITIONS) {
        // Same as above
        this.consumer.unassign();
      } else {
        // We had a real error
        console.error(err);
      }
    });

    this.consumer = new Kafka.KafkaConsumer(conf, topicConf);

    this.setGracefulDeath();
  }

  abstract async gracefulDead(): Promise<boolean>;

  disconnect() {
    return new Promise((resolve, reject) => {
      return this.consumer.disconnect((err, data) => {
        if (err) {
          reject(new DisconnectError(err.message));
        }
        console.log('Consumer disconnect success');
        resolve(data);
      });
    });
  }

  // rebalancing is managed internally by librdkafka by default
  async connect(metadataOptions: any = {}) {
    return new Promise((resolve, reject) => {
      this.consumer.connect(metadataOptions, (err, data) => {
        if (err) {
          reject(new ConnectingError(err.message));
        }

        resolve(data);
      });
    });
  }

  private setGracefulDeath() {
    const gracefulDeath = async () => {
      console.log('Consumer graceul death begin');

      this.dead = true;
      await this.gracefulDead();
      await this.disconnect();

      console.log('Consumer graceul death success');
      process.exit(0);
    };
    process.on('SIGINT', gracefulDeath);
    process.on('SIGQUIT', gracefulDeath);
    process.on('SIGTERM', gracefulDeath);
  }

  async subscribe(topics: string[]) {
    this.topics = _.uniq(_.concat(topics, this.topics));
    // synchronously
    this.consumer.subscribe(this.topics);
    // refresh offset
    await this.initOffsetStroe();
  }

  unsubscribe() {
    this.topics.length = 0;
    this.consumer.unsubscribe();
  }

  getMetadata(metadataOptions: any): Promise<RDKafkaMetadataInterface> {
    return new Promise((resolve, reject) => {
      this.consumer.getMetadata(metadataOptions, (err: Error, data: RDKafkaMetadataInterface) => {
        if (err) {
          reject(new MetadataError(err.message));
        }
        resolve(data);
      });
    });
  }

  seek(toppar: RDTopicPartitionInterface, timeout: number) {
    return new Promise((resolve, reject) => {
      this.consumer.seek(toppar, timeout, (err: Error) => {
        if (err) {
          reject(new SeekError(err.message));
        }
        resolve();
      });
    });
  }

  async initOffsetStroe() {
    const meta = await this.getMetadata({ timeout: 1000 });
    for (const topic of meta.topics) {
      if (this.topics.includes(topic.name)) {
        this.offsetStore[topic.name] = {};
        this.errOffsetStore[topic.name] = {};
        for (const p of topic.partitions) {
          this.offsetStore[topic.name][p.id] = -1;
          this.errOffsetStore[topic.name][p.id] = -1;
        }
      }
    }
  }

  async commits() {
    for (const topic in this.offsetStore) {
      for (const partition in this.offsetStore[topic]) {
        let offset = this.offsetStore[topic][partition];
        const errOffset = this.errOffsetStore[topic][partition];
        let isNeedSeekBack = false;

        if (errOffset >= 0) {
          offset = errOffset - 1;
          // clear errorOffset
          this.errOffsetStore[topic][partition] = -1;
          isNeedSeekBack = true;
        }

        if (offset < 0) {
          continue;
        }

        const toppar = {
          topic,
          partition: Number.parseInt(partition, 10),
          offset: offset + 1,
        };
        this.consumer.commitSync(toppar);
        if (isNeedSeekBack) {
          await this.seek(toppar, SEEK_TIMEOUT);
        }
        this.offsetStore[topic][partition] = -1;
      }
    }
  }
}

// `At Most Once` Consumer
export class RDKafkaConsumer extends KafkaBasicConsumer {
  constructor(conf: RDKafkaConsumerConfigInterface, topicConf: any = {}) {
    ifNotExistedAndSet(conf, 'enable.auto.commit', true);
    ifNotExistedAndSet(conf, 'enable.auto.offset.store', true);
    ifNotExistedAndSet(conf, 'auto.commit.interval.ms', 500);

    super(conf, topicConf);
  }

  async gracefulDead(): Promise<boolean> {
    return true;
  }

  async subscribe(topics: string[]) {
    this.topics = _.uniq(_.concat(topics, this.topics));
    // synchronously
    this.consumer.subscribe(this.topics);
  }

  async consume(
    cb: (message: RDKafkaMessageInterface) => any,
    size: number = 3,
  ): Promise<boolean> {
    let success = true;
    return new Promise<boolean>((resolve, reject) => {
      // This will keep going until it gets ERR__PARTITION_EOF or ERR__TIMED_OUT
      return this.consumer
        .consume(size, async (err: Error, messages: RDKafkaMessageInterface[]) => {
          if (this.dead) {
            reject(new ConnectionDeadError('Connection has been dead or is dying'));
          }
          if (err) {
            reject(new ConsumerRuntimeError(err.message));
          }
          try {
            await Promise.all(messages.map(async (message) => {
              try {
                await Promise.resolve(cb(message));
              } catch (e) {
                success = false;
              }
            }));
          } catch (e) {
            reject(new ConsumerRuntimeError(err.message));
          }
          return resolve(success);
        });
    });
  }
}
