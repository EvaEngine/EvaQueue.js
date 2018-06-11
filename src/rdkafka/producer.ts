import * as Kafka from 'node-rdkafka';
import {
  RDKafkaProducerConfigInterface,
} from './interfaces';
import {
  ConnectingError,
  DisconnectError,
  ConnectionNotReadyError,
  ConnectionDeadError,
  ProducerFlushError,
  ProducerRuntimeError,
} from './errors';

const ERROR_CODES = Kafka.CODES.ERRORS;
const FLUSH_TIMEOUT = 1000; // ms
export abstract class KafkaBasicProducer {
  public client: Kafka.Producer;
  protected dead: boolean;
  protected flushing: boolean;

  constructor(conf: RDKafkaProducerConfigInterface, topicConf: any = {}) {
    this.dead = false;
    this.flushing = false;
    this.client = new Kafka.Producer(conf, topicConf);

    this.setGracefulDeath();
  }

  abstract async gracefulDead(): Promise<boolean>;

  disconnect() {
    return new Promise((resolve, reject) => {
      return this.client.disconnect((err, data) => {
        if (err) {
          reject(new DisconnectError(err.message));
        }
        console.log('Producer disconnect success');
        resolve(data);
      });
    });
  }

  async flush(timeout: number) {
    if (this.flushing) {
      return;
    }
    this.flushing = true;
    return new Promise((resolve, reject) => {
      return this.client.flush(timeout, (err: Error) => {
        this.flushing = false;
        if (err) {
          reject(new ProducerFlushError(err.message));
        }
        resolve();
      });
    });
  }

  connect(metadataOptions: any = {}) {
    return new Promise((resolve, reject) => {
      this.client.connect(metadataOptions, (err, data) => {
        if (err) {
          reject(new ConnectingError(err.message));
        }
        resolve(data);
      });
    });
  }

  private setGracefulDeath() {
    const gracefulDeath = async () => {
      console.log('Producer graceul death begin');

      this.dead = true;
      await this.gracefulDead();
      await this.disconnect();

      console.log('Producer graceul death success');
      process.exit(0);
    };
    process.on('SIGINT', gracefulDeath);
    process.on('SIGQUIT', gracefulDeath);
    process.on('SIGTERM', gracefulDeath);
  }
}

export default class RDKafkaProducer extends KafkaBasicProducer {
  async gracefulDead() {
    await this.flush(FLUSH_TIMEOUT);
    return true;
  }

  async produce(
    topic: string,
    partition: number,
    message: string,
    key?: string,
    timestamp?: string,
    opaque?: string,
  ) {
    return new Promise((resolve, reject) => {
      if (this.dead) {
        reject(new ConnectionDeadError('Connection has been dead or is dying'));
      }
      try {
        // synchronously
        this.client
          .produce(topic, partition, Buffer.from(message), key, timestamp || Date.now(), opaque);
        resolve();
      } catch (err) {
        // flush all queued messages
        // if (err.code === ERROR_CODES.ERR__QUEUE_FULL) {
        //   return this.flush(FLUSH_TIMEOUT)
        //     .then(() => {
        //       resolve();
        //     });
        // }
        reject(new ProducerRuntimeError(err.message));
      }
    });
  }
}
