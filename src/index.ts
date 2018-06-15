import camelCase from 'lodash/camelCase';
import assert from 'assert';
import {
  Constructor,
  ConsumerInterface,
  LoggerInterface,
  MessageQueueAdapterInterface, MessageTopicAdapterInterface,
  ProducerInterface, PublisherInterface, SubscriberInterface,
} from './interfaces';

abstract class BaseMessageQueue {
  config: any;
  logger: LoggerInterface;
  instances: Map<string, MessageQueueAdapterInterface | MessageTopicAdapterInterface>;
  static adapters: Map<string, Constructor> = new Map<string, Constructor>();

  static registerAdapter(adapterName: string, adapterClass: Constructor) {
    if (this.adapters.has(adapterName) === false) {
      this.adapters.set(adapterName, adapterClass);
    }
  }

  constructor(config: any, logger: LoggerInterface) {
    this.config = config;
    this.logger = logger;
    this.instances = new Map<string, any>();
    if (this.config.defaultInstance) {
      const [adapter, configKey] = this.config.defaultInstance.split('_');
      const method = camelCase(`factory_${adapter}`);
      (this as any)[method](configKey);
    }
  }

  getAdapter(instanceKey?: string) {
    return this.instances.get(instanceKey || this.config.defaultInstance);
  }

  factoryAdapter(name: string, configKey: string, adapterClass: Constructor) {
    const instance = new adapterClass(
      this.config[name][configKey],
      this.logger,
    );
    const instanceKey = `${name}_${configKey}`;
    if (this.instances.has(instanceKey) === false) {
      this.instances.set(instanceKey, instance);
    }
    return instance;
  }
}

export default class MessageQueue extends BaseMessageQueue {
  /**
   * @returns {MnsMessageQueue}
   */
  factoryMns(configKey = 'default') {
    const name = 'mns';
    const mnsAdapter = require('./mns_adapter').default;
    MessageQueue.registerAdapter(name, mnsAdapter);
    return this.factoryAdapter(name, configKey, mnsAdapter);
  }

  /**
   * @returns {KafkaMessageQueue}
   */
  factoryKafka(configKey = 'default') {
    const name = 'kafka';
    const kafkaAdapter = require('./kafka_adapter').default;
    MessageQueue.registerAdapter(name, kafkaAdapter);
    return this.factoryAdapter(name, configKey, kafkaAdapter);
  }

  getProducer(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): ProducerInterface<any> {
    assert(this.instances.has(instanceKey), 'MQ Adapter not inited');
    return (this.instances.get(instanceKey) as MessageQueueAdapterInterface).getProducer(queueName);
  }

  getConsumer(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): ConsumerInterface<any> {
    assert(this.instances.has(instanceKey), 'MQ Adapter not inited');
    return (this.instances.get(instanceKey) as MessageQueueAdapterInterface).getConsumer(queueName);
  }
}

export class MessageTopic extends BaseMessageQueue {
  /**
   * @returns {MnsMessageQueue}
   */
  factoryMns(configKey = 'default') {
    const name = 'mns';
    const mnsAdapter = require('./mns_adapter').MnsMessageTopic;
    MessageQueue.registerAdapter(name, mnsAdapter);
    return this.factoryAdapter(name, configKey, mnsAdapter);
  }

  /**
   * @returns {KafkaMessageQueue}
   */
  factoryKafka(configKey = 'default') {
    const name = 'kafka';
    const kafkaAdapter = require('./kafka_adapter');
    MessageQueue.registerAdapter(name, kafkaAdapter);
    return this.factoryAdapter(name, configKey, kafkaAdapter);
  }

  getPublisher(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): PublisherInterface<any> {
    assert(this.instances.has(instanceKey), 'MQ Adapter not inited');
    return (this.instances.get(instanceKey) as MessageTopicAdapterInterface)
      .getPublisher(queueName);
  }

  getSubcriber(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): SubscriberInterface<any> {
    assert(this.instances.has(instanceKey), 'MQ Adapter not inited');
    return (this.instances.get(instanceKey) as MessageTopicAdapterInterface)
      .getSubscriber(queueName);
  }
}
