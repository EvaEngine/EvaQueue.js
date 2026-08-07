import { createRequire } from 'node:module';
import KafkaMessageQueue, { KafkaMessage } from '../src/kafka_adapter.js';

const require = createRequire(import.meta.url);
const kafkaMQ = new KafkaMessageQueue(
  require('./config').kafka.default,
  console,
);

const producer = kafkaMQ.getProducer();
const msg = await producer.produce(new KafkaMessage({ content: { foo: 'bar' } }));
console.log('[%s] produced', producer.name, msg.toDebugString());
