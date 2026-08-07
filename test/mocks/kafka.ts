import type {
  MessageQueueAdapterInterface,
  ProducerInterface,
  ConsumerInterface,
  LoggerInterface,
  MessageInterface,
} from '../../src/interfaces.js';

export class MockProducer implements ProducerInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockProducer';

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

export class MockConsumer implements ConsumerInterface<any> {
  client: any = {};
  logger: LoggerInterface;
  name: string = 'MockConsumer';

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

export class MockQueueAdapter implements MessageQueueAdapterInterface {
  producer: ProducerInterface<any>;
  consumer: ConsumerInterface<any>;
  logger: LoggerInterface;

  constructor(_config: any, logger: LoggerInterface) {
    this.logger = logger;
    this.producer = new MockProducer({ logger });
    this.consumer = new MockConsumer({ logger });
  }

  getProducer(_queueName?: string): ProducerInterface<any> {
    return this.producer;
  }

  getConsumer(_queueName?: string): ConsumerInterface<any> {
    return this.consumer;
  }
}