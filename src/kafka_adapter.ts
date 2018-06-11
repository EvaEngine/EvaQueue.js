import Message from './message';
import Kafka from 'node-rdkafka';
import {
  ConfigInterface,
  ConsumerInterface,
  LoggerInterface,
  MessageInterface,
  MessageQueueAdapterInterface,
  ProducerInterface,
} from './interfaces';
import {
  RDKafkaConsumerConfigInterface,
  RDKafkaProducerConfigInterface,
  RDKafkaMessageInterface,
} from './rdkafka/interfaces';

export interface KafkaConfigInterface extends ConfigInterface {
  connection: {};
  producer: RDKafkaProducerConfigInterface;
  consumer: RDKafkaConsumerConfigInterface;
  defaultQueueName: string;
}

export class KafkaMessage extends Message {
  offset: number;
  partition: number;
  topic: string;

  setTopic(topic: string) {
    this.topic = topic;
    return this;
  }

  toRDKafkaMessage(): RDKafkaMessageInterface {
    return {
      value: Buffer.from(JSON.stringify(this.content)),
      // size: number
      topic: this.topic,
      offset: this.offset,
      partition: this.partition,
      key: this.getMessageId(),
      timestamp: this.getEnqueueAt(),
    };
  }

  static factory(rdKafakaMessage: RDKafkaMessageInterface): KafkaMessage {
    const {
      value: contentBuffer,
      offset,
      partition,
      key: messageId,
      timestamp: enqueueAt,
    } = rdKafakaMessage;

    const message = new KafkaMessage({
      messageId,
      enqueueAt,
      content: JSON.parse(contentBuffer.toString()),
    });
    message.offset = offset;
    message.partition = partition;
    return message;
  }
}

export class KafkaProducer implements ProducerInterface {
  mq: any;
  logger: LoggerInterface;
  connected: boolean = false;
  queue: string;

  /**
   * @param {{mq: RDKafkaProducer; logger: LoggerInterface}} input
   */
  constructor(input: { mq: any, logger: LoggerInterface, queue?: string }) {
    this.mq = input.mq;
    this.logger = input.logger;
    this.queue = input.queue;
  }

  async connect() {
    if (false === this.connected) {
      await this.mq.connect();
      this.connected = true;
    }
    return this;
  }

  /**
   * @param {KafkaMessage} message
   * @param {string} queue
   * @returns {Promise<Message>}
   */
  async produce(message: KafkaMessage, queue?: string): Promise<Message> {
    await this.connect();
    message.setTopic(queue || this.queue);
    console.log(1111111111);
    console.log(message);
    console.log(message.toRDKafkaMessage());
    await this.mq.produce(message.toRDKafkaMessage());
    return message;
  }
}

export class KafkaConsumer implements ConsumerInterface {
  mq: any;
  logger: LoggerInterface;
  processing: 0;
  connected: Boolean = false;
  queue: string;

  constructor(input: { mq: any, logger: LoggerInterface, queue?: string }) {
    this.mq = input.mq;
    this.logger = input.logger;
    this.queue = input.queue;
  }

  async connect() {
    if (false === this.connected) {
      await this.mq.connect();
      this.connected = true;
    }
    return this;
  }

  async consume(message: MessageInterface, callback: (v: MessageInterface) => {}) {
    // await this.mq.deleteP(message.ack);
    // await callback(message);
  }

  async receive() {
    const mnsMessage = await this.mq.recvP();
    return KafkaMessage.factory(mnsMessage);
  }

  //
  // async pause() {
  //   await this.mq.notifyStopP();
  //   this.paused = true;
  // }
  //
  // async stop() {
  //   await this.pause();
  //   this.stopped = true;
  // }

  receiving(
    callback: (err: Error, msg: MessageInterface) => {},
    maxProcessing: Number = 3,
  ) {
  }

  consuming(
    callback: (msg: MessageInterface) => {},
    maxProcessing: number = 3,
    queue?: string,
  ) {
    this.connect().then(() => {
      return this.mq.subscribe([
        queue || this.queue,
      ]);
    }).then(() => {
      this.mq.sub
      this.mq.consume(
        async (rdMessage: RDKafkaMessageInterface) => {
          await callback(KafkaMessage.factory(rdMessage));
        },
        maxProcessing,
      );
    });
  }
}

export default class KafkaMessageQueue implements MessageQueueAdapterInterface {
  producer: KafkaProducer;
  consumer: KafkaConsumer;

  /**
   * @param {Kafka} injectClass
   * @param {MnsConfigInterface} config
   * @param {LoggerInterface} logger
   * @param {string} inputQueueName
   */
  constructor(
    injectClass: {
      RDKafkaProducer: any,
      RDKafkaConsumer: any,
    },
    config: KafkaConfigInterface,
    logger: LoggerInterface,
    inputQueueName?: string,
  ) {
    const queueName = inputQueueName || config.defaultQueueName;
    this.producer = new KafkaProducer({
      logger,
      mq: new injectClass.RDKafkaProducer(config.producer),
      queue: queueName,
    });
    this.consumer = new KafkaConsumer({
      logger,
      mq: new injectClass.RDKafkaConsumer(config.consumer),
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
