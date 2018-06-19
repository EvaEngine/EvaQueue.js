import KafkaMessageQueue, { KafkaMessage } from '../src/kafka_adapter';

const kafkaMQ = new KafkaMessageQueue(
  require('./config').kafka.default,
  console,
);

(async () => {
  const producer = kafkaMQ.getProducer();
  const msg = await producer.produce(new KafkaMessage({ content: { foo: 'bar' } }));
  console.log('[%s] produced', producer.name, msg.toDebugString());
})();
