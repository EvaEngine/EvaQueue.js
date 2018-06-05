import Message from './message';
import { toCamelCase } from './utils/case_converter';
import {
  ConfigInterface,
  ConsumerInterface,
  LoggerInterface,
  MessageInterface,
  MessageQueueAdapterInterface,
  ProducerInterface,
} from './interfaces';

export interface MnsConfigInterface extends ConfigInterface {
  connection: {
    accountId: string,
    keyId: string,
    keySecret: string
    region: string,
    networkType: string,
  };
  defaultQueueName: string;
}

export class MnsMessage extends Message {
  static factory(mnsMessage: object): MnsMessage {
    const {
      message: {
        messageId,
        messageBodyMD5,
        messageBody,
        enqueueTime,
        receiptHandle,
        priority,
      },
    } = toCamelCase(mnsMessage);

    return new MnsMessage({
      messageId,
      priority,
      messageHash: messageBodyMD5,
      enqueueAt: enqueueTime / 1000,
      ack: receiptHandle,
      content: messageBody,
    });
  }
}

export class MnsProducer implements ProducerInterface {
  mq: any;
  logger: LoggerInterface;

  constructor(input: { mq: any, logger: LoggerInterface }) {
    this.mq = input.mq;
    this.logger = input.logger;
  }

  /**
   * @param {Message} message
   * @returns {Promise<Message>}
   */
  async produce(message: Message): Promise<Message> {
    await this.mq.sendP(message.toString());
    return message;
  }
}

export class MnsConsumer implements ConsumerInterface {
  mq: any;
  logger: LoggerInterface;
  processing: 0;

  paused: Boolean = false;
  stopped: Boolean = false;

  constructor(input: { mq: any, logger: LoggerInterface }) {
    this.mq = input.mq;
    this.logger = input.logger;
  }

  async consume(message: MessageInterface, callback: (v: MessageInterface) => {}) {
    await this.mq.deleteP(message.ack);
    await callback(message);
  }

  async receive(): Promise<MessageInterface> {
    const mnsMessage = await this.mq.recvP();
    return MnsMessage.factory(mnsMessage);
  }

  async pause() {
    await this.mq.notifyStopP();
    this.paused = true;
  }

  async stop() {
    await this.pause();
    this.stopped = true;
  }

  private getReceiver(
    callback: (err: Error, msg: MessageInterface) => {},
    maxProcessing: Number = 3,
    autoConsume: Boolean = false,
  ) {
    this.processing = 0;
    const receiver = (err: Error, mnsMessage: object) => {
      (async () => {
        this.processing += 1;
        this.logger.info('[Consume started] consumer processing:', this.processing);
        if (this.processing >= maxProcessing) {
          await this.pause();
        }
        try {
          await callback(err, mnsMessage ? MnsMessage.factory(mnsMessage) : null);
        } finally {
          this.processing -= 1;
          this.logger.info('[Consume ended] consumer processing:', this.processing);
          if (this.processing < maxProcessing && this.paused
            && !this.stopped) {
            this.paused = false;
            this.mq.notifyRecv(receiver);
          }
        }
      })();
      return autoConsume;
    };
    return receiver;
  }

  receiving(
    callback: (err: Error, msg: MessageInterface) => {},
    maxProcessing: Number = 3,
  ) {
    return this.mq.notifyRecv(this.getReceiver(callback, maxProcessing, false));
  }

  consuming(
    callback: (err: Error, msg: MessageInterface) => {},
    maxProcessing: Number = 3,
  ) {
    return this.mq.notifyRecv(this.getReceiver(callback, maxProcessing, true));
  }
}

export default class MnsMessageQueue implements MessageQueueAdapterInterface {
  producer: MnsProducer;
  consumer: MnsConsumer;
  mq: any;

  /**
   * @param injectClass
   * @param {MnsConfigInterface} config
   * @param {LoggerInterface} logger
   * @param {string} inputQueueName
   */
  constructor(
    injectClass: any,
    config: MnsConfigInterface,
    logger: LoggerInterface,
    inputQueueName?: string,
  ) {
    const {
      Account,
      Region,
      MQ,
    } = injectClass;
    const {
      connection: {
        accountId,
        keyId,
        keySecret,
        region,
        networkType,
      },
      defaultQueueName,
    } = config;

    const queueName = inputQueueName || defaultQueueName;
    const account = new Account(accountId, keyId, keySecret);
    account.setGA(false);
    const mq = new MQ(
      queueName,
      account,
      new Region(region, networkType),
    );

    this.mq = mq;
    this.producer = new MnsProducer({ mq, logger });
    this.consumer = new MnsConsumer({ mq, logger });
  }

  getProducer(): MnsProducer {
    return this.producer;
  }

  getConsumer(): MnsConsumer {
    return this.consumer;
  }
}
