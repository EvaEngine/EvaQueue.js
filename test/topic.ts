import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MessageTopic } from '../src/index.js';
import type { LoggerInterface, MessageInterface } from '../src/interfaces.js';
import { MockPublisher, MockSubscriber, MockTopicAdapter } from './mocks/mns.js';

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
// Tests: MessageTopic getPublisher / getSubscriber with pre-populated instances
// ---------------------------------------------------------------------------

describe('MessageTopic', () => {
  it('getPublisher returns publisher from pre-populated adapter', () => {
    const config = { defaultInstance: 'mock_topic' };
    const topic = new MessageTopic(config, silentLogger);
    const adapter = new MockTopicAdapter({}, silentLogger);
    topic.instances.set('mock_topic', adapter);

    const publisher = topic.getPublisher();
    assert.ok(publisher instanceof MockPublisher);
    assert.strictEqual(publisher, adapter.publisher);
  });

  it('getSubscriber returns subscriber from pre-populated adapter', () => {
    const config = { defaultInstance: 'mock_topic' };
    const topic = new MessageTopic(config, silentLogger);
    const adapter = new MockTopicAdapter({}, silentLogger);
    topic.instances.set('mock_topic', adapter);

    const subscriber = topic.getSubcriber();
    assert.ok(subscriber instanceof MockSubscriber);
    assert.strictEqual(subscriber, adapter.subscriber);
  });

  it('getPublisher throws for uninitialized adapter', () => {
    const config = { defaultInstance: 'nonexistent' };
    const topic = new MessageTopic(config, silentLogger);

    assert.throws(
      () => topic.getPublisher('nonexistent'),
      { message: /MQ Adapter not inited/ },
    );
  });

  it('getSubscriber throws for uninitialized adapter', () => {
    const config = { defaultInstance: 'nonexistent' };
    const topic = new MessageTopic(config, silentLogger);

    assert.throws(
      () => topic.getSubcriber('nonexistent'),
      { message: /MQ Adapter not inited/ },
    );
  });

  it('mock publisher publish returns message', async () => {
    const adapter = new MockTopicAdapter({}, silentLogger);
    const publisher = adapter.getPublisher();
    const msg: MessageInterface = { content: { topic: 'test' }, messageId: 'pub-1' };
    const result = await publisher.publish(msg);
    assert.strictEqual(result, msg);
  });
});