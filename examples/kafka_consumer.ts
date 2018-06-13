import KafkaMessageQueue, { KafkaMessage } from '../src/kafka_adapter';

const kafkaMQ = new KafkaMessageQueue(
  require('./config').kafka,
  console,
);

(async () => {
  await kafkaMQ.getConsumer().consuming(
    async (message: KafkaMessage) => {
      console.log('Consuming %s', message);
    },
    3,
  );
})();
