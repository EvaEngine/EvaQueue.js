import { createRequire } from 'node:module';
import MQ from '../src/index.js';
import type { MessageInterface } from '../src/interfaces.js';
import { KafkaConsumer } from '../src/kafka_adapter.js';

const require = createRequire(import.meta.url);
const manager = new MQ(
  require('./config'),
  console,
);
// const consumer = manager.getMNS().getConsumer();
const consumer = await manager.getConsumer() as KafkaConsumer;

let count = 0;
await consumer.consuming(
  async (err: Error, message: MessageInterface) => {
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
