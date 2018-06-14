import MQ from '../src/';
import Message, { CommandMessage } from '../src/message';

const manager = new MQ(
  require('./config'),
  console,
);
const producer = manager.getProducer();

(async () => {
  // const msg = await producer.produce(new Message({ foo: 'bar' }));
  // console.log('[%s] producing %o', producer.name, msg);
  const command = await producer.produce(new CommandMessage({ name: 'hello:world', spec: { foo: 'bar' } }));
  console.log('[%s] producing %o', producer.name, command);
})();
