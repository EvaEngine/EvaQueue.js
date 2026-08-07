import { createRequire } from 'node:module';
import MQ from '../src/index.js';
import Message from '../src/message.js';

const require = createRequire(import.meta.url);
const config = require('./config');

// NATS JetStream 模式: 实例键为 `nats_default`
const manager = new MQ(config, console);
const producer = await manager.getProducer('nats_default');

try {
  const msg = await producer.produce(new Message({
    hello: 'world',
  }, {
    messageId: 'nats-msg-1',
  }));
  console.log('[%s] producing %o', producer.name, msg);
} catch (e) {
  console.error(e);
}