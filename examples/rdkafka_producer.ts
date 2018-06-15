import RDKafkaProducer from '../src/rdkafka/producer';
import crypto from 'crypto';

const config = require('./config');
const producer = new RDKafkaProducer(Object.assign(config.kafka.connection, config.kafka.producer));
let i = 0;

(async () => {
  await producer.connect();
  console.log('connected');
  // while (true) {
  const msg = `NO.${i} ${new Date().getTime()}-${crypto.randomBytes(20).toString('hex')}`;
  console.log('producing', msg);
  await producer.produce({
    topic: 'alikafka-crawler-appstores-test',
    value: Buffer.from(JSON.stringify(msg)),
  });
  i += 1;
  // }
})();
