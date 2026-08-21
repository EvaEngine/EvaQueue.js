import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import MessageQueue, { MessageTopic } from '../src/index.js';
import type { LoggerInterface, MessageInterface } from '../src/interfaces.js';
import { NatsConsumer } from '../src/nats_adapter.js';
import {
  MockNatsQueueAdapter,
  MockNatsTopicAdapter,
  MockNatsProducer,
  MockNatsPublisher,
  MockNatsSubscriber,
  MockNatsConsumer,
} from './mocks/nats.js';

// ---------------------------------------------------------------------------
// Logger fixture
// ---------------------------------------------------------------------------

const silentLogger: LoggerInterface = {
  debug: () => { /* no-op */ },
  info: () => { /* no-op */ },
  warn: () => { /* no-op */ },
  error: () => { /* no-op */ },
};

type MockJsMessage = {
  data: Uint8Array;
  seq: number;
  subject: string;
  ack: () => void;
  nak: (millis?: number) => void;
  term: () => void;
  working: () => void;
  getAckCount?: () => number;
};

function createJsMessage() {
  let ackCount = 0;
  const message: MockJsMessage = {
    data: Buffer.from(
      JSON.stringify({
        content: { foo: 'bar' },
        messageId: 'nats-consume-1',
        traceId: 'trace-1',
      }),
    ),
    seq: 42,
    subject: 'events.created',
    ack: () => {
      ackCount += 1;
    },
    nak: () => {
      /* no-op */
    },
    term: () => {
      /* no-op */
    },
    working: () => {
      /* no-op */
    },
  };

  return {
    message: { ...message, getAckCount: () => ackCount },
    getAckCount: () => ackCount,
  };
}

async function createConsumerHarness(
  callback: (err: Error | null, msg: MessageInterface) => void | Promise<void>,
) {
  const errors: unknown[][] = [];
  const logger: LoggerInterface = {
    ...silentLogger,
    error: (...args: unknown[]) => {
      errors.push(args);
    },
  };
  const consumer = new NatsConsumer({
    config: {
      connection: {},
      stream: 'events',
      consumer: 'worker',
      defaultQueueName: 'events.created',
      defaultTopicName: 'events.created',
    },
    logger,
    subject: 'events.created',
    stream: 'events',
    consumerName: 'worker',
  });
  let notifyReady: (() => void) | undefined;
  let resolveBatch: ((messages: MockJsMessage[]) => void) | undefined;
  let firstFetch = true;
  const ready = new Promise<void>((resolve) => {
    notifyReady = resolve;
  });

  consumer.connected = true;
  consumer.client = {
    consumers: {
      get: async () => ({
        fetch: async () => {
          notifyReady?.();
          if (!firstFetch) {
            await new Promise<void>(() => {
              /* keep the consumer stopped between test batches */
            });
          }
          firstFetch = false;
          return {
            async *[Symbol.asyncIterator]() {
              const messages = await new Promise<MockJsMessage[]>((resolve) => {
                resolveBatch = resolve;
              });
              yield* messages;
            },
            stop: () => {
              /* no-op */
            },
          };
        },
      }),
    },
  };
  consumer.consuming(callback);
  await ready;

  return {
    consumer,
    errors,
    handle: async (message: MockJsMessage) => {
      assert.ok(resolveBatch);
      resolveBatch([message]);
      while (consumer.processing === 0 && messageAckCount(message) === 0 && errors.length === 0) {
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
      while (consumer.processing > 0) {
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
    },
  };
}

function messageAckCount(message: MockJsMessage): number {
  return message.getAckCount?.() ?? 0;
}

// ---------------------------------------------------------------------------
// Tests: MessageQueue NATS mode
// ---------------------------------------------------------------------------

describe('MessageQueue (NATS)', () => {
  it('registerAdapter stores NATS adapter class', () => {
    MessageQueue.registerAdapter('nats', MockNatsQueueAdapter);
    assert.ok(MessageQueue.adapters.has('nats'));
    assert.strictEqual(MessageQueue.adapters.get('nats'), MockNatsQueueAdapter);

    // Clean up
    MessageQueue.adapters.delete('nats');
  });

  it('getProducer returns producer from pre-populated adapter', async () => {
    const config = { defaultInstance: 'nats_default' };
    const mq = new MessageQueue(config, silentLogger);
    const adapter = new MockNatsQueueAdapter({}, silentLogger);
    mq.instances.set('nats_default', adapter);

    const producer = await mq.getProducer();
    assert.ok(producer instanceof MockNatsProducer);
    assert.strictEqual(producer, adapter.producer);
  });

  it('getConsumer returns consumer from pre-populated adapter', async () => {
    const config = { defaultInstance: 'nats_default' };
    const mq = new MessageQueue(config, silentLogger);
    const adapter = new MockNatsQueueAdapter({}, silentLogger);
    mq.instances.set('nats_default', adapter);

    const consumer = await mq.getConsumer();
    assert.ok(consumer instanceof MockNatsConsumer);
    assert.strictEqual(consumer, adapter.consumer);
  });

  it('mock producer produce returns message', async () => {
    const adapter = new MockNatsQueueAdapter({}, silentLogger);
    const producer = adapter.getProducer();
    const msg: MessageInterface = { content: { foo: 'bar' }, messageId: 'nats-prod-1' };
    const result = await producer.produce(msg);
    assert.strictEqual(result, msg);
  });

  it('mock consumer receive returns message', async () => {
    const adapter = new MockNatsQueueAdapter({}, silentLogger);
    const consumer = adapter.getConsumer();
    const result = await consumer.receive();
    assert.ok(result);
  });
});

// ---------------------------------------------------------------------------
// Tests: NATS JetStream consumer acknowledgement
// ---------------------------------------------------------------------------

describe('NatsConsumer', () => {
  it('limits concurrent callbacks to the configured batch size', async () => {
    const consumer = new NatsConsumer({
      config: {
        connection: {},
        stream: 'events',
        consumer: 'worker',
        defaultQueueName: 'events.created',
        defaultTopicName: 'events.created',
      },
      logger: silentLogger,
      subject: 'events.created',
      stream: 'events',
      consumerName: 'worker',
    });
    let fetchCount = 0;
    let active = 0;
    let maximumActive = 0;
    let started = 0;
    let resolveStarted: (() => void) | undefined;
    let resolveCallbacks: (() => void) | undefined;
    const allStarted = new Promise<void>((resolve) => {
      resolveStarted = resolve;
    });
    const callbacksReleased = new Promise<void>((resolve) => {
      resolveCallbacks = resolve;
    });

    consumer.connected = true;
    consumer.client = {
      consumers: {
        get: async () => ({
          fetch: async (options: { max_messages: number }) => {
            assert.strictEqual(options.max_messages, 2);
            fetchCount += 1;
            if (fetchCount > 1) {
              await new Promise<void>(() => {
                /* stop after the first batch */
              });
            }
            return {
              async *[Symbol.asyncIterator]() {
                yield createJsMessage().message;
                yield createJsMessage().message;
              },
              stop: () => {
                /* no-op */
              },
            };
          },
        }),
      },
    };
    consumer.consuming(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      started += 1;
      if (started === 2) {
        resolveStarted?.();
      }
      await callbacksReleased;
      active -= 1;
    }, 2);

    await allStarted;
    assert.strictEqual(consumer.processing, 2);
    assert.strictEqual(maximumActive, 2);
    assert.strictEqual(fetchCount, 1);

    resolveCallbacks?.();
    while (consumer.processing > 0) {
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  });

  it('converts the message and acknowledges once after a synchronous callback', async () => {
    let received: MessageInterface | undefined;
    const harness = await createConsumerHarness((_err, message) => {
      received = message;
    });
    const jsMessage = createJsMessage();

    await harness.handle(jsMessage.message);

    assert.deepStrictEqual(received?.content, { foo: 'bar' });
    assert.strictEqual(received?.queueName, 'events.created');
    assert.strictEqual(jsMessage.getAckCount(), 1);
    assert.strictEqual(harness.consumer.processing, 0);
  });

  it('keeps processing active and delays ack until an asynchronous callback resolves', async () => {
    let resolveCallback: (() => void) | undefined;
    const callbackPending = new Promise<void>((resolve) => {
      resolveCallback = resolve;
    });
    const harness = await createConsumerHarness(async () => callbackPending);
    const jsMessage = createJsMessage();

    const handling = harness.handle(jsMessage.message);
    await new Promise<void>((resolve) => setImmediate(resolve));

    assert.strictEqual(harness.consumer.processing, 1);
    assert.strictEqual(jsMessage.getAckCount(), 0);

    resolveCallback?.();
    await handling;

    assert.strictEqual(jsMessage.getAckCount(), 1);
    assert.strictEqual(harness.consumer.processing, 0);
  });

  it('does not ack and logs synchronous throws and asynchronous rejections', async () => {
    const failures = [
      () => {
        throw new Error('sync failure');
      },
      async () => {
        throw new Error('async failure');
      },
    ];

    for (const fail of failures) {
      const harness = await createConsumerHarness(fail);
      const jsMessage = createJsMessage();

      await harness.handle(jsMessage.message);

      assert.strictEqual(jsMessage.getAckCount(), 0);
      assert.strictEqual(harness.consumer.processing, 0);
      assert.strictEqual(harness.errors.length, 1);
      assert.match(String(harness.errors[0]?.[2]), /failure/);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: MessageTopic NATS mode
// ---------------------------------------------------------------------------

describe('MessageTopic (NATS)', () => {
  it('registerAdapter stores NATS topic adapter class', () => {
    MessageTopic.registerAdapter('nats', MockNatsTopicAdapter);
    assert.ok(MessageTopic.adapters.has('nats'));
    assert.strictEqual(MessageTopic.adapters.get('nats'), MockNatsTopicAdapter);

    // Clean up
    MessageTopic.adapters.delete('nats');
  });

  it('getPublisher returns publisher from pre-populated adapter', () => {
    const config = { defaultInstance: 'nats_topic' };
    const topic = new MessageTopic(config, silentLogger);
    const adapter = new MockNatsTopicAdapter({}, silentLogger);
    topic.instances.set('nats_topic', adapter);

    const publisher = topic.getPublisher();
    assert.ok(publisher instanceof MockNatsPublisher);
    assert.strictEqual(publisher, adapter.publisher);
  });

  it('getSubscriber returns subscriber from pre-populated adapter', () => {
    const config = { defaultInstance: 'nats_topic' };
    const topic = new MessageTopic(config, silentLogger);
    const adapter = new MockNatsTopicAdapter({}, silentLogger);
    topic.instances.set('nats_topic', adapter);

    const subscriber = topic.getSubscriber();
    assert.ok(subscriber instanceof MockNatsSubscriber);
    assert.strictEqual(subscriber, adapter.subscriber);
  });

  it('mock publisher publish returns message', async () => {
    const adapter = new MockNatsTopicAdapter({}, silentLogger);
    const publisher = adapter.getPublisher();
    const msg: MessageInterface = { content: { topic: 'test' }, messageId: 'nats-pub-1' };
    const result = await publisher.publish(msg);
    assert.strictEqual(result, msg);
  });
});
