import MQ from '../src/';
import { KafkaMessage } from '../src/kafka_adapter';

const manager = new MQ(
  require('./config'),
  console,
);
const producer = manager.getProducer();

(async () => {
  const msg = await producer.produce(new KafkaMessage({ content: { foo: 'bar' } }));
  console.log('[%s] producing', producer.name, msg);
})();
