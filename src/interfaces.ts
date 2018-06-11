export interface MessageInterface {
  messageId?: string;
  messageHash?: string;
  content: object;
  priority?: number;
  delay?: number;
  traceId?: string;
  parentId?: string;
  enqueueAt?: number;
  ack?: string;
}

export interface ProducerInterface {
  mq: any;
  logger: LoggerInterface;

  // constructor(input: {
  //   mq: any,
  //   logger: LoggerInterface,
  // }): any;

  produce(message: MessageInterface): Promise<MessageInterface>;
}

export interface ConsumerInterface {
  mq: any;
  logger: LoggerInterface;
  processing: number;

  // constructor(input: {
  //   mq: any,
  //   logger: LoggerInterface,
  // }): void;

  consume(msg: MessageInterface, callback: (v: MessageInterface) => {}): Promise<void>;

  consuming(callback: () => {}, maxProcessing: number): void;

  receive(): Promise<MessageInterface>;

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
  producer: ProducerInterface;
  consumer: ConsumerInterface;

  // factory(injectClass: any, config: any, queueName?: string): any;

  getProducer(queueName?: string): ProducerInterface;

  getConsumer(queueName?: string): ConsumerInterface;
}

export enum Partterns {
  'PRODUCER_CONSUMER',
  'PUBLISHER_SUBSCRIBER',
}
