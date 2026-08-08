import assert from 'node:assert';
import type {
  Constructor,
  ConsumerInterface,
  LoggerInterface,
  MessageQueueAdapterInterface,
  MessageTopicAdapterInterface,
  ProducerInterface,
  PublisherInterface,
  SubscriberInterface,
} from './interfaces.js';

abstract class BaseMessageQueue {
  config: Record<string, any>;
  logger: LoggerInterface;
  instances: Map<string, MessageQueueAdapterInterface | MessageTopicAdapterInterface>;
  static adapters: Map<string, Constructor> = new Map<string, Constructor>();

  static registerAdapter(adapterName: string, adapterClass: Constructor) {
    if (this.adapters.has(adapterName) === false) {
      this.adapters.set(adapterName, adapterClass);
    }
  }

  constructor(config: Record<string, any>, logger: LoggerInterface) {
    this.config = config;
    this.logger = logger;
    this.instances = new Map<string, any>();
  }

  getAdapter(instanceKey?: string) {
    return this.instances.get(instanceKey || this.config.defaultInstance);
  }

  factoryAdapter(name: string, configKey: string, adapterClass: Constructor) {
    const instanceKey = `${name}_${configKey}`;
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey);
    }
    const instance = new adapterClass(this.config[name][configKey], this.logger);
    this.instances.set(instanceKey, instance);
    return instance;
  }

  protected async ensureInstance(instanceKey?: string): Promise<void> {
    if (typeof instanceKey !== 'string' || this.instances.has(instanceKey)) {
      return;
    }
    const lastSeparator = instanceKey.lastIndexOf('_');
    const name = lastSeparator === -1 ? instanceKey : instanceKey.slice(0, lastSeparator);
    const configKey = lastSeparator === -1 ? 'default' : instanceKey.slice(lastSeparator + 1);
    if (name === 'kafka') {
      await this.factoryKafka(configKey);
    } else if (name === 'mns') {
      await this.factoryMns(configKey);
    } else if (name === 'nats') {
      await this.factoryNats(configKey);
    }
  }

  protected abstract factoryMns(configKey?: string): any;

  protected abstract factoryKafka(configKey?: string): any;

  protected abstract factoryNats(configKey?: string): any;
}

export default class MessageQueue extends BaseMessageQueue {
  async factoryMns(configKey = 'default') {
    const name = 'mns';
    const { default: mnsAdapter } = await import('./mns_adapter.js');
    MessageQueue.registerAdapter(name, mnsAdapter);
    return this.factoryAdapter(name, configKey, mnsAdapter);
  }

  async factoryKafka(configKey = 'default') {
    const name = 'kafka';
    const { default: kafkaAdapter } = await import('./kafka_adapter.js');
    MessageQueue.registerAdapter(name, kafkaAdapter);
    return this.factoryAdapter(name, configKey, kafkaAdapter);
  }

  async factoryNats(configKey = 'default') {
    const name = 'nats';
    const { default: natsAdapter } = await import('./nats_adapter.js');
    MessageQueue.registerAdapter(name, natsAdapter);
    return this.factoryAdapter(name, configKey, natsAdapter);
  }

  async getProducer(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): Promise<ProducerInterface<any>> {
    await this.ensureInstance(instanceKey);
    assert(this.instances.has(instanceKey), `Instance key ${instanceKey} incorrect`);
    return (
      this.instances.get(instanceKey) as MessageQueueAdapterInterface
    ).getProducer(queueName);
  }

  async getConsumer(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): Promise<ConsumerInterface<any>> {
    await this.ensureInstance(instanceKey);
    assert(this.instances.has(instanceKey), `Instance key ${instanceKey} incorrect`);
    return (
      this.instances.get(instanceKey) as MessageQueueAdapterInterface
    ).getConsumer(queueName);
  }
}

export class MessageTopic extends BaseMessageQueue {
  async factoryMns(configKey = 'default') {
    const name = 'mns';
    const { MnsMessageTopic: mnsAdapter } = await import('./mns_adapter.js');
    MessageTopic.registerAdapter(name, mnsAdapter);
    return this.factoryAdapter(name, configKey, mnsAdapter);
  }

  async factoryKafka(configKey = 'default') {
    const name = 'kafka';
    const { KafkaMessageTopic: kafkaAdapter } = await import('./kafka_adapter.js');
    MessageTopic.registerAdapter(name, kafkaAdapter);
    return this.factoryAdapter(name, configKey, kafkaAdapter);
  }

  async factoryNats(configKey = 'default') {
    const name = 'nats';
    const { NatsMessageTopic: natsAdapter } = await import('./nats_adapter.js');
    MessageTopic.registerAdapter(name, natsAdapter);
    return this.factoryAdapter(name, configKey, natsAdapter);
  }

  getPublisher(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): PublisherInterface<any> {
    assert(this.instances.has(instanceKey), 'MQ Adapter not inited');
    return (
      this.instances.get(instanceKey) as MessageTopicAdapterInterface
    ).getPublisher(queueName);
  }

  getSubscriber(
    instanceKey: string = this.config.defaultInstance,
    queueName?: string,
  ): SubscriberInterface<any> {
    assert(this.instances.has(instanceKey), 'MQ Adapter not inited');
    return (
      this.instances.get(instanceKey) as MessageTopicAdapterInterface
    ).getSubscriber(queueName);
  }
}
