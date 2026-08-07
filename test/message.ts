import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Message, { CommandMessage } from '../src/message.js';

describe('Message', () => {
  it('message with content', () => {
    const msg = new Message({ foo: 'bar' });
    assert.deepStrictEqual(msg.content, { foo: 'bar' });
  });

  it('message with empty content', () => {
    const msg = new Message(null);
    assert.deepStrictEqual(msg.content, {});
  });

  it('message with no arguments', () => {
    const msg = new Message();
    assert.deepStrictEqual(msg.content, {});
    assert.ok(msg.messageId);
    assert.ok(msg.traceId);
    assert.strictEqual(msg.priority, 0);
    assert.strictEqual(msg.delay, 0);
    assert.strictEqual(msg.enqueueAt, Math.floor(Date.now() / 1000));
  });

  it('message with all fields specified', () => {
    const msg = new Message(
      { data: 'test' },
      {
        queueName: 'test-queue',
        priority: 5,
        delay: 10,
        messageId: 'msg-001',
        messageHash: 'hash-001',
        traceId: 'trace-001',
        parentId: 'parent-001',
        enqueueAt: 1000,
        ack: 'ack-001',
      },
    );
    assert.strictEqual(msg.queueName, 'test-queue');
    assert.strictEqual(msg.priority, 5);
    assert.strictEqual(msg.delay, 10);
    assert.strictEqual(msg.messageId, 'msg-001');
    assert.strictEqual(msg.messageHash, 'hash-001');
    assert.strictEqual(msg.traceId, 'trace-001');
    assert.strictEqual(msg.parentId, 'parent-001');
    assert.strictEqual(msg.enqueueAt, 1000);
    assert.strictEqual(msg.ack, 'ack-001');
    assert.deepStrictEqual(msg.content, { data: 'test' });
  });

  it('message getters', () => {
    const msg = new Message(
      { data: 'test' },
      {
        queueName: 'q',
        priority: 3,
        delay: 5,
        messageId: 'mid',
        messageHash: 'mhash',
        traceId: 'tid',
        parentId: 'pid',
        enqueueAt: 500,
        ack: 'ack-val',
      },
    );
    assert.strictEqual(msg.getMessageId(), 'mid');
    assert.strictEqual(msg.getMessageHash(), 'mhash');
    assert.deepStrictEqual(msg.getContent(), { data: 'test' });
    assert.strictEqual(msg.getPriority(), 3);
    assert.strictEqual(msg.getDelaySeconds(), 5);
    assert.strictEqual(msg.getTraceId(), 'tid');
    assert.strictEqual(msg.getParentId(), 'pid');
    assert.strictEqual(msg.getEnqueueAt(), 500);
    assert.strictEqual(msg.getAck(), 'ack-val');
  });

  it('message isRelay returns true when delay > 0', () => {
    const msg = new Message(null, { delay: 5 });
    assert.strictEqual(msg.isRelay(), true);
  });

  it('message isRelay returns false when delay is 0', () => {
    const msg = new Message(null, { delay: 0 });
    assert.strictEqual(msg.isRelay(), false);
  });

  it('message setQueueName is chainable', () => {
    const msg = new Message({ foo: 'bar' });
    const result = msg.setQueueName('my-queue');
    assert.strictEqual(result, msg);
    assert.strictEqual(msg.queueName, 'my-queue');
  });

  it('message toDebugString format', () => {
    const msg = new Message(
      { hello: 'world' },
      {
        messageId: 'mid-1',
        traceId: 'tid-1',
        parentId: 'pid-1',
      },
    );
    const debugStr = msg.toDebugString();
    assert.ok(debugStr.includes('tid-1'));
    assert.ok(debugStr.includes('mid-1'));
    assert.ok(debugStr.includes('pid-1'));
    assert.ok(debugStr.includes('{"hello":"world"}'));
  });

  it('message toString returns JSON', () => {
    const msg = new Message({ foo: 'bar' }, { messageId: 'mid-1' });
    const str = msg.toString();
    const parsed = JSON.parse(str) as Record<string, unknown>;
    assert.strictEqual(parsed.messageId, 'mid-1');
    assert.deepStrictEqual(parsed.content, { foo: 'bar' });
  });

  it('message toRawMessage throws by default', () => {
    const msg = new Message({ foo: 'bar' });
    assert.throws(() => msg.toRawMessage(), {
      message: /not able to convert/,
    });
  });

  it('message downCasting creates new instance', () => {
    const msg = new Message({ foo: 'bar' }, { messageId: 'orig-id' });
    const downcasted = msg.downCasting(Message);
    assert.ok(downcasted instanceof Message);
    assert.notStrictEqual(downcasted, msg);
    assert.deepStrictEqual(downcasted.content, { foo: 'bar' });
  });
});

describe('CommandMessage', () => {
  it('command message basic', () => {
    const msg = new CommandMessage({ name: 'foo', spec: { spec1: 1, spec2: 'go' } });
    assert.strictEqual(msg.getCommand(), 'foo --spec1 1 --spec2 go');
  });

  it('command message with empty spec', () => {
    const msg = new CommandMessage({ name: 'hello' });
    assert.strictEqual(msg.getCommand(), 'hello');
  });

  it('command message toCommand returns same as getCommand', () => {
    const msg = new CommandMessage({ name: 'test', spec: { key: 'val' } });
    assert.strictEqual(msg.toCommand(), msg.getCommand());
  });

  it('command message inherits message properties', () => {
    const msg = new CommandMessage(
      { name: 'cmd', spec: { flag: '1' } },
      { messageId: 'cmd-001', traceId: 'trace-cmd' },
    );
    assert.strictEqual(msg.getMessageId(), 'cmd-001');
    assert.strictEqual(msg.getTraceId(), 'trace-cmd');
    assert.strictEqual(msg.getCommand(), 'cmd --flag 1');
  });
});
