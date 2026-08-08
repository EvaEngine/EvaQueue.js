import * as Kafka from '@confluentinc/kafka-javascript';
import type {
  RDKafkaMessageInterface,
  RDKafkaProducerConfigInterface,
} from './interfaces.js';
import {
  ConnectingError,
  DisconnectError,
  ConnectionDeadError,
  ProducerFlushError,
  ProducerRuntimeError,
} from './errors.js';

// const ERROR_CODES = Kafka.CODES.ERRORS;
const FLUSH_TIMEOUT = 1000; // ms
export abstract class KafkaBasicProducer {
  public client: Kafka.Producer;
  protected dead: boolean;
  protected flushing: boolean;
  private flushPromise: Promise<void> | null = null;

  constructor(conf: RDKafkaProducerConfigInterface, topicConf: any = {}) {
    this.dead = false;
    this.flushing = false;
    this.client = new Kafka.Producer(conf as any, topicConf);
  }

  abstract gracefulDead(): Promise<boolean>;

  disconnect() {
    return new Promise<void>((resolve, reject) => {
      this.client.disconnect((err: any, _data: any) => {
        if (err) {
          reject(new DisconnectError(err.message));
        } else {
          resolve();
        }
      });
    });
  }

  async flush(timeout: number) {
    if (this.flushPromise) {
      return this.flushPromise;
    }
    this.flushing = true;
    this.flushPromise = new Promise<void>((resolve, reject) => {
      this.client.flush(timeout, (err: any) => {
        this.flushing = false;
        this.flushPromise = null;
        if (err) {
          reject(new ProducerFlushError(err.message));
        } else {
          resolve();
        }
      });
    });
    return this.flushPromise;
  }

  connect(metadataOptions: any = {}) {
    return new Promise((resolve, reject) => {
      this.client.connect(metadataOptions, (err: any, data) => {
        if (err) {
          reject(new ConnectingError(err.message));
        } else {
          resolve(data);
        }
      });
    });
  }
}

export default class RDKafkaProducer extends KafkaBasicProducer {
  async gracefulDead() {
    await this.flush(FLUSH_TIMEOUT);
    return true;
  }

  async produce(rdMsg: RDKafkaMessageInterface) {
    const {
      topic,
      partition,
      value,
      key,
      timestamp,
    } = rdMsg;
    return new Promise<void>((resolve, reject) => {
      if (this.dead) {
        reject(new ConnectionDeadError('Connection has been dead or is dying'));
        return;
      }
      try {
        // synchronously
        this.client
          .produce(topic ?? '', partition ?? -1, value, key, timestamp ?? Date.now());
        resolve();
      } catch (err) {
        reject(new ProducerRuntimeError((err as Error).message));
      }
    });
  }
}
