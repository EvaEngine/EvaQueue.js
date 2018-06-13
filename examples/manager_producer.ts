import MQ from '../src/';
import Message from '../src/message';

const manager = new MQ(
  require('./config'),
  console,
);
const producer = manager.getProducer();

(async () => {
  const msg = await producer.produce(new Message({ foo: 'bar' }));
  console.log('[%s] producing %o', producer.name, msg);
})();
