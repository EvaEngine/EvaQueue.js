import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import MessageQueue, { MessageTopic } from '../src/index.js';
import type { LoggerInterface, MessageInterface } from '../src/interfaces.js';
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