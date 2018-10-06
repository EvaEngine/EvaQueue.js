import AliMNS from 'ali-mns';
import Message, { CommandMessage } from './message';
import { toCamelCase } from './utils/case_converter';
import {
  Constructor,
  ConfigInterface,
  ConsumerInterface,
  LoggerInterface,
  MessageInterface,
  MessageQueueAdapterInterface,
  MessageTopicAdapterInterface,
  ProducerInterface,
  PublisherInterface,
  SubscriberInterface,
} from './interfaces';
import Timer = NodeJS.Timer;
import Signals = NodeJS.Signals;

export interface MnsConfigInterface extends ConfigInterface {
  connection: {
    accountId: string,
    keyId: string,
    keySecret: string
    region: string,
    networkType: string,
    zone: string,
  };
  defaultTopicName: string;
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

  gracefulExit(
    signal?: Signals,
    systemProcess = process,
    delay: number = 1000,
    maxCheck: number = 3,
  ) {
    this.logger.info('[%s] received signal %s, start exiting', this.name, signal);
    let checkCount: number = 0;
    let handle: Timer;
    this.stop().then(() => {
      handle = setInterval(
        () => {
          if (this.processing < 1) {
            this.logger.info('[%s] received signal %s, exit by code 0', this.name, signal);
            clearInterval(handle);
            systemProcess.exit(0);
          }

          if (checkCount >= maxCheck) {
            this.logger.warn(
              '[%s] received signal %s, exit by timeout, still have %s unfinished messages',
              this.name,
              signal,
              this.processing,
            );
            clearInterval(handle);
            systemProcess.exit(1);
          }
          checkCount += 1;
        },
        delay,
      );
    }).catch((err) => {
      this.logger.warn(
        '[%s] received signal %s, exit by stop failing, still have %s unfinished messages',
        this.name,
        signal,
        this.processing,
        err,
      );
      systemProcess.exit(1);
    });
  }

  enableGracefulExit() {
    for (const signal of ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGTERM', 'SIGABRT', 'SIGTSTP']) {
      process.on(signal as any, (signal: Signals) => {
        this.gracefulExit(signal);
      });
    }
    this.logger.debug('[%s] graceful exit enabled', this.name);
  }
}

export class MnsPublisher implements PublisherInterface<AliMNS.Topic> {
  client: AliMNS.Topic;
  logger: LoggerInterface;
  name: string;

  constructor(input: { client: AliMNS.Topic, logger: LoggerInterface }) {
    this.client = input.client;
    this.logger = input.logger;
    this.name = process.env.PRODUCER_NAME || `PubMns-${require('os').hostname()}-${process.pid}`;
  }

  getClient() {
    return this.client;
  }

  /**
   * @param {Message} message
   * @returns {Promise<Message>}
   */
  async publish(message: Message | CommandMessage): Promise<Message> {
    if (message instanceof CommandMessage) {
      await this.client.publishP(
        message instanceof MnsCommandMessage ?
          message.toRawMessage() :
          message.downCasting(MnsCommandMessage).toRawMessage(),
        true,
      );
    } else {
      await this.client.publishP(
        message instanceof MnsMessage ?
          message.toRawMessage() :
          message.downCasting(MnsMessage).toRawMessage(),
        true,
      );
    }
    return message;
  }
}

export class MnsSubscriber extends MnsConsumer implements SubscriberInterface<AliMNS.MQ> {
  subscribing(
    callback: (err: Error, msg: Message | CommandMessage) => {},
    maxProcessing: Number = 3,
  ) {
    return this.consuming(callback, maxProcessing);
  }
}

export class MnsMessageTopic implements MessageTopicAdapterInterface {
  publisher: MnsPublisher;
  subscriber: MnsSubscriber;

  /**
   * @param {MnsConfigInterface} config
   * @param {LoggerInterface} logger
   * @param {string} inputTopicName
   */
  constructor(
    config: MnsConfigInterface,
    logger: LoggerInterface,
    inputTopicName?: string,
  ) {
    const {
      Account,
      Region,
      Topic,
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
      defaultTopicName,
    } = config;

    const topicName = inputTopicName || defaultTopicName;
    const account = new Account(accountId, keyId, keySecret);
    account.setGA(false);

    this.publisher = new MnsPublisher({
      logger,
      client: new Topic(
        topicName,
        account,
        new Region(region, networkType),
      ),
    });
    this.subscriber = new MnsSubscriber({
      logger,
      client: new MQ(
        topicName,
        account,
        new Region(region, networkType),
      ),
    });
  }

  getPublisher(): MnsPublisher {
    return this.publisher;
  }

  getSubscriber(): MnsSubscriber {
    return this.subscriber;
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
        zone = 'cn',
      },
      defaultQueueName,
    } = config;

    const queueName = inputQueueName || defaultQueueName;
    const account = new Account(accountId, keyId, keySecret);
    account.setGA(false);
    const client = new MQ(
      queueName,
      account,
      new Region(region, networkType, zone),
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
