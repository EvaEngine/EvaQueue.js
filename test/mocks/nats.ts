import type {
  MessageQueueAdapterInterface,
  MessageTopicAdapterInterface,
  ProducerInterface,
  ConsumerInterface,
  PublisherInterface,
  SubscriberInterface,
  LoggerInterface,
  MessageInterface,
} from '../../src/interfaces.js';

export class MockNatsProducer implements ProducerInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockNatsProducer';

  constructor(input: { logger: LoggerInterface }) {
    this.logger = input.logger;
  }

  getClient() {
    return this.client;
  }

  async produce(message: MessageInterface): Promise<MessageInterface> {
    return message;
  }
}

export class MockNatsConsumer implements ConsumerInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockNatsConsumer';

  constructor(input: { logger: LoggerInterface }) {
    this.logger = input.logger;
  }

  getClient() {
    return this.client;
  }

  async receive(): Promise<MessageInterface> {
    return {};
  }

  commit(_message: MessageInterface): void {
    // no-op
  }

  async consume(): Promise<MessageInterface> {
    return {};
  }

  receiving(
    _callback: (err: Error | null, msg: MessageInterface) => void,
    _maxProcessing: number,
  ): void {
    // no-op
  }

  consuming(
    _callback: (err: Error | null, msg: MessageInterface) => void,
    _maxProcessing: number,
  ): void {
    // no-op
  }

  gracefulExit(): void {
    // no-op
  }

  enableGracefulExit(): void {
    // no-op
  }
}

export class MockNatsQueueAdapter implements MessageQueueAdapterInterface {
  producer: ProducerInterface<any>;
  consumer: ConsumerInterface<any>;
  logger: LoggerInterface;

  constructor(_config: any, logger: LoggerInterface) {
    this.logger = logger;
    this.producer = new MockNatsProducer({ logger });
    this.consumer = new MockNatsConsumer({ logger });
  }

  getProducer(_queueName?: string): ProducerInterface<any> {
    return this.producer;
  }

  getConsumer(_queueName?: string): ConsumerInterface<any> {
    return this.consumer;
  }
}

export class MockNatsPublisher implements PublisherInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockNatsPublisher';

  constructor(input: { logger: LoggerInterface }) {
    this.logger = input.logger;
  }

  getClient() {
    return this.client;
  }

  async publish(message: MessageInterface): Promise<MessageInterface> {
    return message;
  }
}

export class MockNatsSubscriber implements SubscriberInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockNatsSubscriber';

  constructor(input: { logger: LoggerInterface }) {
    this.logger = input.logger;
  }

  getClient() {
    return this.client;
  }

  subscribing(_callback: any, _maxProcessing: number): void {
    // no-op
  }

  gracefulExit(): void {
    // no-op
  }
}

export class MockNatsTopicAdapter implements MessageTopicAdapterInterface {
  publisher: PublisherInterface<any>;
  subscriber: SubscriberInterface<any>;
  logger: LoggerInterface;

  constructor(_config: any, logger: LoggerInterface) {
    this.logger = logger;
    this.publisher = new MockNatsPublisher({ logger });
    this.subscriber = new MockNatsSubscriber({ logger });
  }

  getPublisher(_queueName?: string): PublisherInterface<any> {
    return this.publisher;
  }

  getSubscriber(_queueName?: string): SubscriberInterface<any> {
    return this.subscriber;
  }
}