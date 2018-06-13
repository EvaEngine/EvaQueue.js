import KafkaMessageQueue, { KafkaMessage } from '../src/kafka_adapter';

const kafkaMQ = new KafkaMessageQueue(
  require('./config').kafka,
  console,
);

(async () => {
  const producer = kafkaMQ.getProducer();
  const msg = await producer.produce(new KafkaMessage({ content: { foo: 'bar' } }));
  console.log('[Producer %s] producing', producer.name, msg.toDebugString());
})();
