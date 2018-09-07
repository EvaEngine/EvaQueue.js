import Message, { CommandMessage } from './message';
import {
  Constructor,
  ConfigInterface,
  ConsumerInterface,
  LoggerInterface,
  MessageInterface,
  MessageQueueAdapterInterface,
  ProducerInterface,
  PublisherInterface,
  SubscriberInterface,
  MessageTopicAdapterInterface,
} from './interfaces';
import {
  RDKafkaConsumerConfigInterface,
  RDKafkaProducerConfigInterface,
  RDKafkaMessageInterface,
  RDKafkaConfigInterface,
} from './rdkafka/interfaces';
import RDKafkaProducer from './rdkafka/producer';
import RDKafkaConsumer from './rdkafka/consumer';
import Signals = NodeJS.Signals;
import Timer = NodeJS.Timer;

export interface KafkaConfigInterface extends ConfigInterface {
  connection: RDKafkaConfigInterface;
  producer: RDKafkaProducerConfigInterface;
  consumer: RDKafkaConsumerConfigInterface;
  defaultQueueName: string;
  defaultTopicName: string;
}

export class KafkaCommandMessage extends CommandMessage {
  offset: number;
  partition: number;

  toRawMessage(): RDKafkaMessageInterface {
    return {
      value: Buffer.from(JSON.stringify(this)),
      topic: this.queueName,
      offset: this.offset,
      partition: this.partition,
      key: this.getMessageId(),
      timestamp: this.getEnqueueAt(),
    };
  }
}

export class KafkaMessage extends Message {
  offset: number;
  partition: number;

  toRawMessage(): RDKafkaMessageInterface {
    return {
      value: Buffer.from(JSON.stringify(this)),
      topic: this.queueName,
      offset: this.offset,
      partition: this.partition,
      key: this.getMessageId(),
      timestamp: this.getEnqueueAt(),
    };
  }

  static factory(rdKafkaMessage: RDKafkaMessageInterface): KafkaMessage | KafkaCommandMessage {
    const {
      value: contentBuffer,
      offset,
      partition,
      // key: messageId,
      // timestamp: enqueueAt,
    } = rdKafkaMessage;

    const { content, ...msg } = JSON.parse(contentBuffer.toString());
    const message = new (
      msg.command ? KafkaCommandMessage : KafkaMessage as Constructor
    )(content, msg);
    message.offset = offset;
    message.partition = partition;
    return message;
  }
}

export class KafkaProducer implements ProducerInterface<RDKafkaProducer> {
  client: RDKafkaProducer;
  logger: LoggerInterface;
  connected: boolean = false;
  queue: string;
  name: string;

  /**
   * @param {any} input
   */
  constructor(input: {
    client: RDKafkaProducer,
    logger: LoggerInterface,
    queue?: string,
  }) {
    this.client = input.client;
    this.logger = input.logger;
    this.queue = input.queue;
    this.name = process.env.PRODUCER_NAME || `PKafka-${require('os').hostname()}-${process.pid}`;
  }

  async connect() {
    if (false === this.connected) {
      await this.client.connect();
      this.connected = true;
      this.logger.debug('[%s] connected', this.name);
    }
    return this;
  }

  getClient() {
    return this.client;
  }

  /**
   * @param {KafkaMessage} message
   * @param {string} queue
   * @returns {Promise<Message>}
   */
  async produce(message: Message | CommandMessage, queue?: string): Promise<Message> {
    await this.connect();
    message.setQueueName(queue || this.queue);

    if (message instanceof CommandMessage) {
      await this.client.produce(
        message instanceof KafkaCommandMessage ?
          message.toRawMessage() :
          message.downCasting(KafkaCommandMessage).toRawMessage(),
      );
    } else {
      await this.client.produce(
        message instanceof KafkaMessage ?
          message.toRawMessage() :
          message.downCasting(KafkaMessage).toRawMessage(),
      );
    }

    return message;
  }
}

export class KafkaConsumer implements ConsumerInterface<RDKafkaConsumer> {
  client: RDKafkaConsumer;
  logger: LoggerInterface;
  connected: Boolean = false;
  queue: string;
  name: string;
  stopped: boolean = false;
  processing: number = 0;

  constructor(input: { client: RDKafkaConsumer, logger: LoggerInterface, queue?: string }) {
    this.client = input.client;
    this.logger = input.logger;
    this.queue = input.queue;
    this.name = process.env.CONSUMER_NAME || `CKafka-${require('os').hostname()}-${process.pid}`;
  }

  getClient() {
    return this.client;
  }

  async connect() {
    if (false === this.connected) {
      await this.client.connect();
      this.connected = true;
    }
    return this;
  }

  receiving(
    callback: (err: Error, msg: MessageInterface) => {},
    maxProcessing: Number = 3,
  ) {
  }

  consuming(
    callback: (err: Error, msg: MessageInterface) => {},
    maxProcessing: number = 3,
    queue?: string,
  ) {
    this.connect().then(() => {
      const topics = [
        queue || this.queue,
      ];
      this.logger.debug('[%s] connected, subscribing %s', this.name, topics);
      return this.client.subscribe(topics);
    }).then(async () => {
      this.stopped = false;
      this.logger.debug('[%s] start consuming', this.name);
      while (this.stopped === false) {
        this.processing = maxProcessing;
        await this.client.consume(
          async (rdMessage: RDKafkaMessageInterface) => {
            await callback(null, KafkaMessage.factory(rdMessage));
            this.processing -= 1;
          },
          maxProcessing,
        );
      }
    });
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
    this.stopped = true;
    this.client.disconnect().then(() => {
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

  // gracefulExit(signal?: Signals) {
  //   this.stopped = true;
  //   this.logger.info('[%s] received signal %s, start exiting', this.name, signal);
  //   this.client.disconnect().then(() => {
  //     this.logger.info('[%s] received signal %s, exit by code 0', this.name, signal);
  //     process.exit(0);
  //   }).catch((err) => {
  //     this.logger.warn(
  //       '[%s] received signal %s, exit by stop failing, still have %s unfinished messages',
  //       this.name,
  //       signal,
  //       err,
  //     );
  //     process.exit(1);
  //   });
  // }

  enableGracefulExit() {
    for (const signal of ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGTERM', 'SIGABRT', 'SIGTSTP']) {
      process.on(signal as any, (signal: Signals) => {
        this.gracefulExit(signal);
      });
    }
    this.logger.debug('[%s] graceful exit enabled', this.name);
  }
}

export class KafkaPublisher extends KafkaProducer implements PublisherInterface<RDKafkaProducer> {
  async publish(message: Message | CommandMessage, topic?: string): Promise<Message> {
    return this.produce(message, topic);
  }
}

export class KafkaSubscriber extends KafkaConsumer implements SubscriberInterface<RDKafkaConsumer> {
  subscribing(
    callback: (err: Error, msg: MessageInterface) => {},
    maxProcessing: number = 3,
    queue?: string,
  ) {
    return this.consuming(callback, maxProcessing, queue);
  }
}

export class KafkaMessageTopic implements MessageTopicAdapterInterface {
  publisher: KafkaPublisher;
  subscriber: KafkaSubscriber;

  /**
   * @param {KafkaConfigInterface} config
   * @param {LoggerInterface} logger
   * @param {string} inputTopicName
   */
  constructor(
    config: KafkaConfigInterface,
    logger: LoggerInterface,
    inputTopicName?: string,
  ) {
    const topicName = inputTopicName || config.defaultTopicName;
    this.publisher = new KafkaPublisher({
      logger,
      client: new RDKafkaProducer(
        Object.assign({}, config.connection, config.producer),
      ),
      queue: topicName,
    });
    this.subscriber = new KafkaSubscriber({
      logger,
      client: new RDKafkaConsumer(
        Object.assign({}, config.connection, config.consumer),
      ),
      queue: topicName,
    });
  }

  getPublisher(): KafkaPublisher {
    return this.publisher;
  }

  getSubscriber(): KafkaSubscriber {
    return this.subscriber;
  }
}

export default class KafkaMessageQueue implements MessageQueueAdapterInterface {
  producer: KafkaProducer;
  consumer: KafkaConsumer;

  /**
   * @param {MnsConfigInterface} config
   * @param {LoggerInterface} logger
   * @param {string} inputQueueName
   */
  constructor(
    config: KafkaConfigInterface,
    logger: LoggerInterface,
    inputQueueName?: string,
  ) {
    const queueName = inputQueueName || config.defaultQueueName;
    this.producer = new KafkaProducer({
      logger,
      client: new RDKafkaProducer(
        Object.assign({}, config.connection, config.producer),
      ),
      queue: queueName,
    });
    this.consumer = new KafkaConsumer({
      logger,
      client: new RDKafkaConsumer(
        Object.assign({}, config.connection, config.consumer),
      ),
      queue: queueName,
    });
  }

  getProducer(): KafkaProducer {
    return this.producer;
  }

  getConsumer(): KafkaConsumer {
    return this.consumer;
  }
}
