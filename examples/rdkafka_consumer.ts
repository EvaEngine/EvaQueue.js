import { createRequire } from 'node:module';
import RDKafkaConsumer from '../src/rdkafka/consumer.js';
import type {
  RDKafkaMessageInterface,
} from '../src/rdkafka/interfaces.js';

const require = createRequire(import.meta.url);
const config = require('./config');
const consumer = new RDKafkaConsumer({ ...config.kafka.default.connection, ...config.kafka.default.consumer });

await consumer.connect();
await consumer.subscribe(config.kafka.default.defaultQueueName);
while (true) {
  await consumer.consume(
    async (message: RDKafkaMessageInterface) => {
      console.log(
        `topic: ${message.topic} offset : ${message.offset}
          val: ${message.value.toString('utf-8')}`,
      );
    },
    3,
  );
}
