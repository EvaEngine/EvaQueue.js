import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import RDKafkaProducer from '../src/rdkafka/producer.js';

const require = createRequire(import.meta.url);
const config = require('./config');
const producer = new RDKafkaProducer({ ...config.kafka.default.connection, ...config.kafka.default.producer });

await producer.connect();
console.log('connected');
const msg = `NO.0 ${Date.now()}-${crypto.randomBytes(20).toString('hex')}`;
await producer.produce({
  topic: 'alikafka-crawler-appstores-test',
  value: Buffer.from(JSON.stringify(msg)),
});
console.log('produced', msg);
