import Message, { CommandMessage } from './message.js';
import type {
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
} from './interfaces.js';
import os from 'node:os';
import type { Signals } from './types.js';

// ---------------------------------------------------------------------------
// Config interface
// ---------------------------------------------------------------------------

export interface NatsConfigInterface extends ConfigInterface {
  connection: {
    servers?: string | string[];
    /** Connection options (passed to nats.connect) */
    [key: string]: unknown;
  };
  stream: string;
  /** Consumer name for queue mode */
  consumer?: string;
  defaultQueueName: string;
  defaultTopicName: string;
}

// ---------------------------------------------------------------------------
// Message classes
// ---------------------------------------------------------------------------

export class NatsCommandMessage extends CommandMessage {
  seq!: number;

  toRawMessage(): Uint8Array {
    return Buffer.from(JSON.stringify(this));
  }
}

export class NatsMessage extends Message {
  seq!: number;

  toRawMessage(): Uint8Array {
    return Buffer.from(JSON.stringify(this));
  }

  static factory(jsMsg: {
    data: Uint8Array;
    seq: number;
    subject: string;
    ack: () => void;
    nak: (millis?: number) => void;
    term: () => void;
    working: () => void;
  }): NatsMessage | NatsCommandMessage {
    const { content, ...msg } = JSON.parse(
      Buffer.from(jsMsg.data).toString(),
    );
    const message = new (
      msg.command ? NatsCommandMessage : NatsMessage as Constructor
    )(content, msg);
    message.seq = jsMsg.seq;
    return message;
  }
}

// ---------------------------------------------------------------------------
// Producer
// ---------------------------------------------------------------------------

export class NatsProducer implements ProducerInterface<any> {
  client: any; // JetStream client
  logger: LoggerInterface;
  config: NatsConfigInterface;
  connected: boolean = false;
  subject: string;
  name: string;

  constructor(input: {
    config: NatsConfigInterface;
    logger: LoggerInterface;
    subject?: string;
  }) {
    this.config = input.config;
    this.logger = input.logger;
    this.subject = input.subject ?? '';
    this.name = process.env.PRODUCER_NAME || `PNats-${os.hostname()}-${process.pid}`;
  }

  getClient() {
    return this.client;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    const { connect } = await import('@nats-io/transport-node');
    const { jetstream } = await import('@nats-io/jetstream');
    const nc = await connect(this.config.connection);
    this.client = jetstream(nc);
    this.connected = true;
    this.logger.debug('[%s] connected', this.name);
  }

  async produce(
    message: Message | CommandMessage,
    subject?: string,
  ): Promise<Message> {
    await this.connect();
    message.setQueueName(subject || this.subject);

    const rawMessage =
      message instanceof NatsMessage || message instanceof NatsCommandMessage
        ? message.toRawMessage()
        : message instanceof CommandMessage
          ? message.downCasting(NatsCommandMessage).toRawMessage()
          : message.downCasting(NatsMessage).toRawMessage();

    await this.client.publish(subject || this.subject, rawMessage, {
      msgID: message.getMessageId(),
    });

    return message;
  }
}

// ---------------------------------------------------------------------------
// Consumer
// ---------------------------------------------------------------------------

export class NatsConsumer implements ConsumerInterface<any> {
  client: any; // JetStream client
  logger: LoggerInterface;
  config: NatsConfigInterface;
  connected: boolean = false;
  subject: string;
  stream: string;
  consumerName: string;
  name: string;
  stopped: boolean = false;
  processing: number = 0;

  private jsConsumer: any = null;
  private consumerMessages: any = null;

  constructor(input: {
    config: NatsConfigInterface;
    logger: LoggerInterface;
    subject?: string;
    stream: string;
    consumerName: string;
  }) {
    this.config = input.config;
    this.logger = input.logger;
    this.subject = input.subject ?? '';
    this.stream = input.stream;
    this.consumerName = input.consumerName;
    this.name = process.env.CONSUMER_NAME || `CNats-${os.hostname()}-${process.pid}`;
  }

  getClient() {
    return this.client;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    const { connect } = await import('@nats-io/transport-node');
    const { jetstream } = await import('@nats-io/jetstream');
    const nc = await connect(this.config.connection);
    this.client = jetstream(nc);
    this.connected = true;
    this.logger.debug('[%s] connected', this.name);
  }

  receive(): Promise<MessageInterface> {
    throw new Error('NATS adapter not support yet');
  }

  commit(_message: MessageInterface): void {
    // NATS JetStream uses ack() on the message; no separate commit
  }

  consume(): Promise<MessageInterface> {
    throw new Error('NATS adapter not support yet');
  }

  receiving(
    _callback: (err: Error | null, msg: MessageInterface) => void | Promise<void>,
    _maxProcessing: number = 3,
  ): void {
    // Not implemented for NATS
  }

  consuming(
    callback: (err: Error | null, msg: MessageInterface) => void | Promise<void>,
    maxProcessing: number = 3,
    queue?: string,
  ): void {
    void this.connect().then(async () => {
      this.stopped = false;
      const subject = queue || this.subject;
      const processingLimit = Math.max(1, Number(maxProcessing) || 3);

      try {
        this.jsConsumer = await this.client.consumers.get(
          this.stream,
          this.consumerName,
        );
      } catch {
        this.logger.error(
          '[%s] consumer %s/%s not found',
          this.name,
          this.stream,
          this.consumerName,
        );
        return;
      }

      this.logger.debug(
        '[%s] start consuming from %s/%s',
        this.name,
        this.stream,
        this.consumerName,
      );

      try {
        while (!this.stopped) {
          const messages = await this.jsConsumer.fetch({
            max_messages: processingLimit,
            expires: 1000,
          });
          this.consumerMessages = messages;
          const processing = [];

          for await (const jsMsg of messages) {
            processing.push(
              (async () => {
                this.processing += 1;
                try {
                  const message = NatsMessage.factory(jsMsg);
                  message.setQueueName(subject);
                  await callback(null, message);
                  jsMsg.ack();
                } catch (e) {
                  this.logger.error(
                    '[%s] error processing message: %s',
                    this.name,
                    e instanceof Error ? e.message : String(e),
                  );
                } finally {
                  this.processing -= 1;
                }
              })(),
            );
          }

          await Promise.all(processing);
          this.consumerMessages = undefined;
        }
      } catch (e) {
        if (!this.stopped) {
          this.logger.error(
            '[%s] error consuming messages: %s',
            this.name,
            e instanceof Error ? e.message : String(e),
          );
        }
      }
    }).catch((err: Error) => {
      this.logger.error('[%s] consuming error %s', this.name, err.message);
    });
  }

  gracefulExit(
    signal?: Signals,
    systemProcess = process,
    delay: number = 1000,
    maxCheck: number = 3,
  ): void {
    this.logger.info('[%s] received signal %s, start exiting', this.name, signal);
    let checkCount: number = 0;
    this.stopped = true;

    if (this.consumerMessages) {
      this.consumerMessages.stop();
    }

    const handle = setInterval(
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
  }

  enableGracefulExit(): void {
    for (const signal of ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGTERM', 'SIGABRT', 'SIGTSTP']) {
      process.on(signal as any, (signal: Signals) => {
        this.gracefulExit(signal);
      });
    }
    this.logger.debug('[%s] graceful exit enabled', this.name);
  }
}

// ---------------------------------------------------------------------------
// Publisher / Subscriber (Topic mode)
// ---------------------------------------------------------------------------

export class NatsPublisher extends NatsProducer implements PublisherInterface<any> {
  async publish(
    message: Message | CommandMessage,
    topic?: string,
  ): Promise<Message> {
    return this.produce(message, topic);
  }
}

export class NatsSubscriber extends NatsConsumer implements SubscriberInterface<any> {
  subscribing(
    callback: (err: Error | null, msg: MessageInterface) => void | Promise<void>,
    maxProcessing: number = 3,
    queue?: string,
  ): void {
    return this.consuming(callback, maxProcessing, queue);
  }
}

// ---------------------------------------------------------------------------
// Adapter classes
// ---------------------------------------------------------------------------

export class NatsMessageTopic implements MessageTopicAdapterInterface {
  publisher: NatsPublisher;
  subscriber: NatsSubscriber;

  constructor(
    config: NatsConfigInterface,
    logger: LoggerInterface,
    inputTopicName?: string,
  ) {
    const topicName = inputTopicName || config.defaultTopicName;
    const stream = config.stream;
    const consumerName = config.consumer ?? 'default-topic-consumer';

    this.publisher = new NatsPublisher({
      config,
      logger,
      subject: topicName,
    });

    this.subscriber = new NatsSubscriber({
      config,
      logger,
      subject: topicName,
      stream,
      consumerName,
    });
  }

  getPublisher(): NatsPublisher {
    return this.publisher;
  }

  getSubscriber(): NatsSubscriber {
    return this.subscriber;
  }
}

export default class NatsMessageQueue implements MessageQueueAdapterInterface {
  producer: NatsProducer;
  consumer: NatsConsumer;

  constructor(
    config: NatsConfigInterface,
    logger: LoggerInterface,
    inputQueueName?: string,
  ) {
    const queueName = inputQueueName || config.defaultQueueName;
    const stream = config.stream;
    const consumerName = config.consumer ?? 'default-queue-consumer';

    this.producer = new NatsProducer({
      config,
      logger,
      subject: queueName,
    });

    this.consumer = new NatsConsumer({
      config,
      logger,
      subject: queueName,
      stream,
      consumerName,
    });
  }

  getProducer(): NatsProducer {
    return this.producer;
  }

  getConsumer(): NatsConsumer {
    return this.consumer;
  }
}
