import { createRequire } from 'node:module';
import KafkaMessageQueue, { KafkaMessage } from '../src/kafka_adapter.js';

const require = createRequire(import.meta.url);
const kafkaMQ = new KafkaMessageQueue(
  require('./config').kafka.default,
  console,
);

await kafkaMQ.getConsumer().consuming(
  async (err: unknown, message: KafkaMessage) => {
    console.log('Consuming %s', message);
  },
  3,
);
