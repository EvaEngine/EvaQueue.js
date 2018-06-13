import Message from './message';
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
  RDKafkaConfigInterface,
} from './rdkafka/interfaces';
import RDKafkaProducer from './rdkafka/producer';
import RDKafkaConsumer from './rdkafka/consumer';

export interface KafkaConfigInterface extends ConfigInterface {
  connection: RDKafkaConfigInterface;
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
  async produce(message: KafkaMessage, queue?: string): Promise<Message> {
    await this.connect();
    this.logger.debug('[Producer %s] connected', this.name);
    message.setTopic(queue || this.queue);
    await this.client.produce(message.toRDKafkaMessage());
    return message;
  }
}

export class KafkaConsumer implements ConsumerInterface<RDKafkaConsumer> {
  client: RDKafkaConsumer;
  logger: LoggerInterface;
  processing: 0;
  connected: Boolean = false;
  queue: string;
  name: string;

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
      this.logger.debug('[KafkaConsumer %s] connected, subscribing %s', this.name, topics);
      return this.client.subscribe(topics);
    }).then(async () => {
      this.logger.debug('[KafkaConsumer %s] start consuming', this.name);
      while (true) {
        await this.client.consume(
          async (rdMessage: RDKafkaMessageInterface) => {
            await callback(null, KafkaMessage.factory(rdMessage));
          },
          maxProcessing,
        );
      }
    });
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
