export type Constructor = (new (...args: Array<any>) => any);

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
  // TODO: server Message ID
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

  receive(): Promise<MessageInterface>;

  commit(message: MessageInterface): void;

  consume(): Promise<MessageInterface>;

  receiving(callback: () => {}, maxProcessing: number): void;

  consuming(callback: any, maxProcessing: number): void;

  gracefulExit(): void;

  enableGracefulExit(): void;
}

export interface PublisherInterface<C> {
  client: C;
  logger: LoggerInterface;
  name: string;

  getClient(): C;

  publish(message: MessageInterface): Promise<MessageInterface>;
}

export interface SubscriberInterface<C> {
  client: C;
  logger: LoggerInterface;
  name: string;

  getClient(): C;

  subscribing(callback: any, maxProcessing: number): void;

  gracefulExit(): void;

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

export interface MessageTopicAdapterInterface {
  publisher: PublisherInterface<any>;
  subscriber: SubscriberInterface<any>;

  getPublisher(queueName?: string): PublisherInterface<any>;

  getSubscriber(queueName?: string): SubscriberInterface<any>;
}
