import assert from 'assert';

export class Message {
  getMessageId() {
    return this.messageId;
  }

  getMessageHash() {
    return this.messageHash;
  }

  getContent() {
    return this.content;
  }

  getPriority() {
    return this.priority;
  }

  getDelaySeconds() {
    return this.delay;
  }

  getTraceId() {
    return this.traceId;
  }

  getParentId() {
    return this.parentId;
  }

  getEnqueueAt() {
    return this.enqueueAt;
  }

  getAck() {
    return this.ack;
  }

  /**
   * @returns {boolean}
   */
  isRelay() {
    return this.delay > 0;
  }

  /**
   * @returns {string}
   */
  toDebugString() {
    return [
      this.getMessageId(),
      this.getTraceId(),
      this.getParentId(),
      JSON.stringify(this.content)
    ].join(' | ');
  }

  /**
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this.content);
  }

  assign({
    priority, delay = 0, ack, enqueueAt, messageId, messageHash, traceId, parentId
  }) {
    this.priority = priority;
    this.delay = delay;
    this.messageId = messageId;
    this.messageHash = messageHash;
    this.traceId = traceId;
    this.parentId = parentId;
    this.ack = ack;
    this.enqueueAt = enqueueAt;
    return this;
  }

  constructor(content, {
    priority, delay = 0, ack, enqueueAt, messageId, messageHash, traceId, parentId
  } = {}) {
    assert(content, 'Message require content input');
    this.content = content;
    this.priority = priority;
    this.delay = delay;
    this.messageId = messageId;
    this.messageHash = messageHash;
    this.traceId = traceId;
    this.parentId = parentId;
    this.ack = ack;
    this.enqueueAt = enqueueAt;
  }
}

export default { Message };
