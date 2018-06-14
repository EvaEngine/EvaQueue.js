export interface MessageInterface {
  queueName?: string;
  messageId?: string;
  messageHash?: string;
  content?: object;
  priority?: number;
  delay?: number;
  traceId?: string;
  parentId?: string;
  enqueueAt?: number;
  ack?: string;
}

export interface CommandMessageInterface {
  command: string;

  getCommand(): string;

  toCommand(): string;
}

export interface ProducerInterface<C> {
  client: C;
  logger: LoggerInterface;
  name: string;

  getClient(): C;

  produce(message: MessageInterface): Promise<MessageInterface>;
}

export interface ConsumerInterface<C> {
  client: C;
  logger: LoggerInterface;
  name: string;

  getClient(): C;

  consuming(callback: any, maxProcessing: number): void;

  receiving(callback: () => {}, maxProcessing: number): void;
}

export interface ConfigInterface {
  connection: object;
  defaultQueueName: string;
}

export interface LoggerInterface {
  debug(message?: any, ...optionalParams: any[]): void;

  info(message?: any, ...optionalParams: any[]): void;

  warn(message?: any, ...optionalParams: any[]): void;

  error(message?: any, ...optionalParams: any[]): void;
}

export interface MessageQueueAdapterInterface {
  producer: ProducerInterface<any>;
  consumer: ConsumerInterface<any>;

  getProducer(queueName?: string): ProducerInterface<any>;

  getConsumer(queueName?: string): ConsumerInterface<any>;
}

export enum Partterns {
  'PRODUCER_CONSUMER',
  'PUBLISHER_SUBSCRIBER',
}
