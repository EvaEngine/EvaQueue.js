import KafkaMessageQueue, { KafkaMessage } from '../src/kafka_adapter';

const kafkaMQ = new KafkaMessageQueue(
  require('./config').kafka.default,
  console,
);

(async () => {
  await kafkaMQ.getConsumer().consuming(
    async (err, message: KafkaMessage) => {
      console.log('Consuming %s', message);
    },
    3,
  );
})();
