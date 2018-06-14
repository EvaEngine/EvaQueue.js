import AliMNS from 'ali-mns';
import Message, { CommandMessage } from './message';
import { toCamelCase } from './utils/case_converter';
import {
  ConfigInterface,
  ConsumerInterface,
  LoggerInterface,
  MessageInterface,
  MessageQueueAdapterInterface,
  ProducerInterface,
} from './interfaces';
import { Constructor } from 'ava';

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

export interface MnsRawMessageInterface {
  message: {
    messageId: string,
    messageBodyMD5: string,
    messageBody: string,
    enqueueTime: string,
    receiptHandle: string,
    priority: number,
  };
}

export class MnsCommandMessage extends CommandMessage {
  toRawMessage(): string {
    return JSON.stringify(this);
  }
}

export class MnsMessage extends Message {
  toRawMessage(): string {
    return JSON.stringify(this);
  }

  static factory(mnsMessage: MnsRawMessageInterface): MnsMessage | MnsCommandMessage {
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

    const { content, ...msg } = JSON.parse(messageBody);

    return new (
      msg.command ? MnsCommandMessage : MnsMessage as Constructor
    )(content, Object.assign(msg, {
      messageId,
      priority,
      messageHash: messageBodyMD5,
      enqueueAt: Math.floor(enqueueTime / 1000),
      ack: receiptHandle,
    }));
  }
}

export class MnsProducer implements ProducerInterface<AliMNS.MQ> {
  client: AliMNS.MQ;
  logger: LoggerInterface;
  name: string;

  constructor(input: { client: AliMNS.MQ, logger: LoggerInterface }) {
    this.client = input.client;
    this.logger = input.logger;
    this.name = process.env.PRODUCER_NAME || `PMns-${require('os').hostname()}-${process.pid}`;
  }

  getClient() {
    return this.client;
  }

  /**
   * @param {Message} message
   * @returns {Promise<Message>}
   */
  async produce(message: Message | CommandMessage): Promise<Message> {
    if (message instanceof CommandMessage) {
      await this.client.sendP(
        message instanceof MnsCommandMessage ?
          message.toRawMessage() :
          message.downCasting(MnsCommandMessage).toRawMessage(),
      );
    } else {
      await this.client.sendP(
        message instanceof MnsMessage ?
          message.toRawMessage() :
          message.downCasting(MnsMessage).toRawMessage(),
      );
    }
    return message;
  }
}

export class MnsConsumer implements ConsumerInterface<AliMNS.MQ> {
  name: string;
  client: AliMNS.MQ;
  logger: LoggerInterface;
  processing: 0;

  paused: Boolean = false;
  stopped: Boolean = false;

  constructor(input: { client: AliMNS.MQ, logger: LoggerInterface }) {
    this.client = input.client;
    this.logger = input.logger;
    this.name = process.env.CONSUMER_NAME || `CMns-${require('os').hostname()}-${process.pid}`;
  }

  getClient() {
    return this.client;
  }

  async consume(message: MessageInterface, callback: (v: MessageInterface) => {}) {
    await this.client.deleteP(message.ack);
    await callback(message);
  }

  async receive(): Promise<MessageInterface> {
    const mnsMessage = await this.client.recvP();
    return MnsMessage.factory(mnsMessage);
  }

  async pause() {
    await this.client.notifyStopP();
    this.paused = true;
  }

  async stop() {
    await this.pause();
    this.stopped = true;
  }

  private getReceiver(
    callback: (err: Error, msg: Message | CommandMessage) => {},
    maxProcessing: Number = 3,
    autoConsume: Boolean = false,
  ) {
    this.processing = 0;
    const receiver = (err: Error, mnsRawMessage: MnsRawMessageInterface) => {
      (async () => {
        this.processing += 1;
        this.logger.info('[%s started] consumer processing:', this.name, this.processing);
        if (this.processing >= maxProcessing) {
          await this.pause();
        }
        try {
          await callback(
            err,
            mnsRawMessage ? MnsMessage.factory(mnsRawMessage) : null,
          );
        } finally {
          this.processing -= 1;
          this.logger.info('[%s ended] consumer processing:', this.name, this.processing);
          if (this.processing < maxProcessing && this.paused
            && !this.stopped) {
            this.paused = false;
            this.client.notifyRecv(receiver);
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
    return this.client.notifyRecv(this.getReceiver(callback, maxProcessing, false));
  }

  consuming(
    callback: (err: Error, msg: Message | CommandMessage) => {},
    maxProcessing: Number = 3,
  ) {
    return this.client.notifyRecv(this.getReceiver(callback, maxProcessing, true));
  }
}

export default class MnsMessageQueue implements MessageQueueAdapterInterface {
  producer: MnsProducer;
  consumer: MnsConsumer;

  /**
   * @param {MnsConfigInterface} config
   * @param {LoggerInterface} logger
   * @param {string} inputQueueName
   */
  constructor(
    config: MnsConfigInterface,
    logger: LoggerInterface,
    inputQueueName?: string,
  ) {
    const {
      Account,
      Region,
      MQ,
    } = AliMNS;
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
    const client = new MQ(
      queueName,
      account,
      new Region(region, networkType),
    );

    this.producer = new MnsProducer({ client, logger });
    this.consumer = new MnsConsumer({ client, logger });
  }

  getProducer(): MnsProducer {
    return this.producer;
  }

  getConsumer(): MnsConsumer {
    return this.consumer;
  }
}
