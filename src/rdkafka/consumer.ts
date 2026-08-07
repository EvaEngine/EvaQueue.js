import * as Kafka from 'node-rdkafka';

import type {
  RDTopicPartitionInterface,
  RDKafkaMetadataInterface,
  RDKafkaMessageInterface,
  RDKafkaConsumerConfigInterface,
} from './interfaces.js';
import {
  ConnectingError,
  DisconnectError,
  ConnectionDeadError,
  ConsumerRuntimeError,
  MetadataError,
  SeekError,
} from './errors.js';

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
        console.log('Consumer rebalanced at : ');
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

    this.consumer = new Kafka.KafkaConsumer(conf as any, topicConf);

    // this.setGracefulDeath();
  }

  abstract gracefulDead(): Promise<boolean>;

  disconnect() {
    return new Promise<void>((resolve, reject) => {
      this.consumer.disconnect((err: any, _data: any) => {
        if (err) {
          reject(new DisconnectError(err.message));
        } else {
          console.log('Consumer disconnect success');
          resolve();
        }
      });
    });
  }

  // rebalancing is managed internally by librdkafka by default
  async connect(metadataOptions: any = {}) {
    return new Promise<void>((resolve, reject) => {
      this.consumer.connect(metadataOptions, (err: any, _data) => {
        if (err) {
          reject(new ConnectingError(err.message));
        } else {
          resolve();
        }
      });
    });
  }

  private setGracefulDeath() {
    const gracefulDeath = async () => {
      this.dead = true;
      await this.gracefulDead();
      await this.disconnect();
      process.exit(0);
    };
    process.on('SIGINT', () => { void gracefulDeath(); });
    process.on('SIGQUIT', () => { void gracefulDeath(); });
    process.on('SIGTERM', () => { void gracefulDeath(); });
  }

  subscribe(topics: string[]) {
    this.topics = [...new Set([...topics, ...this.topics])];
    // synchronously
    this.consumer.subscribe(this.topics);
    // refresh offset
    void this.initOffsetStroe();
  }

  unsubscribe() {
    this.topics.length = 0;
    this.consumer.unsubscribe();
  }

  getMetadata(metadataOptions: any): Promise<RDKafkaMetadataInterface> {
    return new Promise<RDKafkaMetadataInterface>((resolve, reject) => {
      this.consumer.getMetadata(metadataOptions, (err: any, data) => {
        if (err) {
          reject(new MetadataError(err.message));
        } else {
          resolve(data);
        }
      });
    });
  }

  seek(toppar: RDTopicPartitionInterface, timeout: number) {
    return new Promise<void>((resolve, reject) => {
      this.consumer.seek(toppar, timeout, (err: any) => {
        if (err) {
          reject(new SeekError(err.message));
        } else {
          resolve();
        }
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
export default class RDKafkaConsumer extends KafkaBasicConsumer {
  constructor(conf: RDKafkaConsumerConfigInterface, topicConf: any = {}) {
    ifNotExistedAndSet(conf, 'enable.auto.commit', true as any);
    ifNotExistedAndSet(conf, 'enable.auto.offset.store', true as any);
    ifNotExistedAndSet(conf, 'auto.commit.interval.ms', 500);

    super(conf, topicConf);
  }

  gracefulDead(): Promise<boolean> {
    return Promise.resolve(true);
  }

  subscribe(topics: string[]) {
    this.topics = [...new Set([...topics, ...this.topics])];
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
      this.consumer
        .consume(size, (err: any, messages) => {
          if (this.dead) {
            reject(new ConnectionDeadError('Connection has been dead or is dying'));
            return;
          }
          if (err) {
            reject(new ConsumerRuntimeError(err.message));
            return;
          }
          void (async () => {
            try {
              await Promise.all(messages.map(async (message) => {
                try {
                  await Promise.resolve(cb(message as unknown as RDKafkaMessageInterface));
                } catch {
                  success = false;
                }
              }));
            } catch (_e) {
              reject(new ConsumerRuntimeError(String(_e)));
              return;
            }
            resolve(success);
          })();
        });
    });
  }
}
