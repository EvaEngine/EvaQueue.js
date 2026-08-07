import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import MessageQueue from '../src/index.js';
import type { LoggerInterface, MessageInterface } from '../src/interfaces.js';
import { MockProducer, MockConsumer, MockQueueAdapter } from './mocks/kafka.js';

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
// Tests: BaseMessageQueue static methods
// ---------------------------------------------------------------------------

describe('BaseMessageQueue', () => {
  it('registerAdapter stores adapter class', () => {
    MessageQueue.registerAdapter('mock', MockQueueAdapter);
    assert.ok(MessageQueue.adapters.has('mock'));
    assert.strictEqual(MessageQueue.adapters.get('mock'), MockQueueAdapter);

    // Clean up
    MessageQueue.adapters.delete('mock');
  });

  it('registerAdapter does not overwrite existing adapter', () => {
    MessageQueue.registerAdapter('mock', MockQueueAdapter);
    const sizeAfterFirst = MessageQueue.adapters.size;

    // Try registering again
    MessageQueue.registerAdapter('mock', MockQueueAdapter);
    assert.strictEqual(MessageQueue.adapters.size, sizeAfterFirst);

    MessageQueue.adapters.delete('mock');
  });

  it('constructor stores config and logger', () => {
    const config = { defaultInstance: 'test_default' };
    const mq = new MessageQueue(config, silentLogger);
    assert.strictEqual(mq.config, config);
    assert.strictEqual(mq.logger, silentLogger);
    assert.ok(mq.instances instanceof Map);
    assert.strictEqual(mq.instances.size, 0);
  });

  it('getAdapter returns instance by key', () => {
    const mq = new MessageQueue(
      { defaultInstance: 'test_default' },
      silentLogger,
    );
    const adapter = new MockQueueAdapter({}, silentLogger);
    mq.instances.set('test_default', adapter);

    assert.strictEqual(mq.getAdapter('test_default'), adapter);
  });

  it('getAdapter returns default instance when key omitted', () => {
    const mq = new MessageQueue(
      { defaultInstance: 'my_default' },
      silentLogger,
    );
    const adapter = new MockQueueAdapter({}, silentLogger);
    mq.instances.set('my_default', adapter);

    assert.strictEqual(mq.getAdapter(), adapter);
  });

  it('getAdapter returns undefined for missing key', () => {
    const mq = new MessageQueue(
      { defaultInstance: 'missing' },
      silentLogger,
    );
    assert.strictEqual(mq.getAdapter('nonexistent'), undefined);
  });

  it('factoryAdapter creates and caches instance', () => {
    const config = {
      mock: {
        primary: { setting: 'a' },
      },
    };
    const mq = new MessageQueue(config, silentLogger);

    const instance = mq.factoryAdapter('mock', 'primary', MockQueueAdapter);
    assert.ok(instance instanceof MockQueueAdapter);
    assert.strictEqual(instance.logger, silentLogger);

    // Instance should be cached
    assert.ok(mq.instances.has('mock_primary'));
    assert.strictEqual(mq.instances.get('mock_primary'), instance);
  });

  it('factoryAdapter does not overwrite cached instance', () => {
    const config = {
      mock: {
        primary: { setting: 'a' },
      },
    };
    const mq = new MessageQueue(config, silentLogger);

    const first = mq.factoryAdapter('mock', 'primary', MockQueueAdapter);
    const second = mq.factoryAdapter('mock', 'primary', MockQueueAdapter);
    assert.strictEqual(first, second);
  });
});

// ---------------------------------------------------------------------------
// Tests: MessageQueue getProducer / getConsumer with pre-populated instances
// ---------------------------------------------------------------------------

describe('MessageQueue', () => {
  it('getProducer returns producer from pre-populated adapter', async () => {
    const config = { defaultInstance: 'mock_primary' };
    const mq = new MessageQueue(config, silentLogger);
    const adapter = new MockQueueAdapter({}, silentLogger);
    mq.instances.set('mock_primary', adapter);

    const producer = await mq.getProducer();
    assert.ok(producer instanceof MockProducer);
    assert.strictEqual(producer, adapter.producer);
  });

  it('getProducer with custom queue name', async () => {
    const config = { defaultInstance: 'mock_primary' };
    const mq = new MessageQueue(config, silentLogger);
    const adapter = new MockQueueAdapter({}, silentLogger);
    mq.instances.set('mock_primary', adapter);

    const producer = await mq.getProducer('mock_primary', 'custom-queue');
    assert.ok(producer instanceof MockProducer);
  });

  it('getConsumer returns consumer from pre-populated adapter', async () => {
    const config = { defaultInstance: 'mock_primary' };
    const mq = new MessageQueue(config, silentLogger);
    const adapter = new MockQueueAdapter({}, silentLogger);
    mq.instances.set('mock_primary', adapter);

    const consumer = await mq.getConsumer();
    assert.ok(consumer instanceof MockConsumer);
    assert.strictEqual(consumer, adapter.consumer);
  });

  it('getProducer throws for missing instance key', async () => {
    const config = { defaultInstance: 'nonexistent' };
    const mq = new MessageQueue(config, silentLogger);

    await assert.rejects(
      () => mq.getProducer('nonexistent'),
      { message: /Instance key nonexistent incorrect/ },
    );
  });

  it('getConsumer throws for missing instance key', async () => {
    const config = { defaultInstance: 'nonexistent' };
    const mq = new MessageQueue(config, silentLogger);

    await assert.rejects(
      () => mq.getConsumer('nonexistent'),
      { message: /Instance key nonexistent incorrect/ },
    );
  });

  it('mock producer produce returns message', async () => {
    const adapter = new MockQueueAdapter({}, silentLogger);
    const producer = adapter.getProducer();
    const msg: MessageInterface = { content: { hello: 'world' }, messageId: 'test-1' };
    const result = await producer.produce(msg);
    assert.strictEqual(result, msg);
    assert.deepStrictEqual(result.content, { hello: 'world' });
  });
});