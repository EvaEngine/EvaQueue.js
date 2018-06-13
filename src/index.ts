import camelCase from 'lodash/camelCase';
import assert from 'assert';
import {
  ConsumerInterface,
  LoggerInterface,
  MessageQueueAdapterInterface,
  ProducerInterface,
} from './interfaces';

const adapters = {};
export default class MessageQueue {
  config: any;
  logger: LoggerInterface;
  adapter: MessageQueueAdapterInterface;

  static registerAdapter(adapterName: string, adapaterClass: any) {
    Object.assign(adapters, {
      [adapterName]: adapaterClass,
    });
  }

  constructor(config: any, logger: LoggerInterface) {
    this.config = config;
    this.logger = logger;
    if (this.config.adapter) {
      const method = camelCase(`factory_${this.config.adapter}`);
      (this as any)[method]();
    }
  }

  getAdapter() {
    return this.adapter;
  }

  factoryAdapter(name: string, adapterClass: any) {
    return new adapterClass({
      config: this.config[name],
      logger: this.logger,
    });
  }

  /**
   * @returns {MnsMessageQueue}
   */
  factoryMns() {
    const name = 'mns';
    const mnsAdapter = require('./mns_adapter').default;
    MessageQueue.registerAdapter(name, mnsAdapter);
    return this.adapter = new mnsAdapter(
      this.config[name],
      this.logger,
    );
  }

  /**
   * @returns {KafkaMessageQueue}
   */
  factoryKafka() {
    const name = 'kafka';
    const kafkaAdapter = require('./kafka_adapter').default;
    MessageQueue.registerAdapter(name, kafkaAdapter);
    return this.adapter = new kafkaAdapter(
      this.config[name],
      this.logger,
    );
  }

  getProducer(...args: any[]): ProducerInterface<any> {
    assert(this.adapter, 'MQ Adapter not inited');
    return this.adapter.getProducer(...args);
  }

  getConsumer(...args: any[]): ConsumerInterface<any> {
    assert(this.adapter, 'MQ Adapter not inited');
    return this.adapter.getConsumer(...args);
  }
}
