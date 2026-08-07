import { createRequire } from 'node:module';
import MQ from '../src/index.js';
import type { MessageInterface } from '../src/interfaces.js';
import { NatsConsumer } from '../src/nats_adapter.js';

const require = createRequire(import.meta.url);
const manager = new MQ(require('./config'), console);
const consumer = await manager.getConsumer('nats_default') as NatsConsumer;

let count = 0;
await consumer.consuming(
  async (err: Error | null, message: MessageInterface) => {
    count += 1;
    console.log(
      '[%s] consuming count: [%s] processing [%s] message %j',
      consumer.name,
      count,
      consumer.processing,
      message,
    );
  },
  3,
);

consumer.enableGracefulExit();