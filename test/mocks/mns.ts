import type {
  MessageTopicAdapterInterface,
  PublisherInterface,
  SubscriberInterface,
  LoggerInterface,
  MessageInterface,
} from '../../src/interfaces.js';

export class MockPublisher implements PublisherInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockPublisher';

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

export class MockSubscriber implements SubscriberInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockSubscriber';

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

export class MockTopicAdapter implements MessageTopicAdapterInterface {
  publisher: PublisherInterface<any>;
  subscriber: SubscriberInterface<any>;
  logger: LoggerInterface;

  constructor(_config: any, logger: LoggerInterface) {
    this.logger = logger;
    this.publisher = new MockPublisher({ logger });
    this.subscriber = new MockSubscriber({ logger });
  }

  getPublisher(_queueName?: string): PublisherInterface<any> {
    return this.publisher;
  }

  getSubscriber(_queueName?: string): SubscriberInterface<any> {
    return this.subscriber;
  }
}