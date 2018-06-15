import RDKafkaConsumer from '../src/rdkafka/consumer';
import {
  RDKafkaMessageInterface,
} from '../src/rdkafka/interfaces';

const config = require('./config');
const consumer = new RDKafkaConsumer(Object.assign(config.kafka.connection, config.kafka.consumer));
const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  await consumer.connect();
  await consumer.subscribe(config.kafka.defaultQueueName);
  while (true) {
    await consumer.consume(
      async (message: RDKafkaMessageInterface) => {
        // await sleep(randomInt(1000, 3000));
        console.log(
          `topic: ${message.topic} offset : ${message.offset}
          val: ${message.value.toString('utf-8')}`,
        );
      },
      3,
    );
  }
})();
