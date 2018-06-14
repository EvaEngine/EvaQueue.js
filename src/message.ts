import { CommandMessageInterface, MessageInterface } from './interfaces';
import { Constructor } from 'ava';

export default class Message implements MessageInterface {
  readonly messageId: string;
  messageHash: string;
  content: object;
  priority: number;
  delay: number;
  traceId: string;
  parentId: string;
  enqueueAt: number;
  ack: string;
  queueName: string;

  toRawMessage(): any {
    throw new Error('Message not able to convert by no implements toRawMessage');
  }

  setQueueName(queueName: string) {
    this.queueName = queueName;
    return this;
  }

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
      this.getTraceId(),
      this.getMessageId(),
      this.getParentId(),
      JSON.stringify(this.content),
    ].join(' | ');
  }

  /**
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this);
  }

  downCasting(downCastingClass: Constructor): Message {
    return new downCastingClass(null, this);
  }

  constructor(content: any, msg: MessageInterface = {}) {
    const {
      queueName,
      priority = 0,
      delay = 0,
      ack,
      enqueueAt,
      messageId,
      messageHash,
      traceId,
      parentId,
    } = msg;
    this.queueName = queueName;
    this.content = content || msg.content;
    this.priority = priority;
    this.delay = delay;
    this.messageId = messageId || Math.random().toString(36).slice(2);
    this.messageHash = messageHash;
    this.traceId = traceId || Math.random().toString(36).slice(2);
    this.parentId = parentId;
    this.ack = ack;
    this.enqueueAt = enqueueAt || Math.floor(Date.now() / 1000);
  }
}

export class CommandMessage extends Message implements CommandMessageInterface {
  command: string;

  constructor(
    command: {
      name: string,
      spec?: any,
    },
    msg: MessageInterface = {},
  ) {
    super(command, msg);
    this.command = this.toCommand();
  }

  getCommand(): string {
    return this.command;
  }

  toCommand(): string {
    const {
      name,
      spec,
    } = this.content as any;
    const specString = Object
      .entries(spec)
      .map(([key, value]) => {
        return `--${key} ${value}`;
      })
      .join(' ');
    return `${name} ${specString}`;
  }
}
