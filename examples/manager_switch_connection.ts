import MQ from '../src/';
import Message, { CommandMessage } from '../src/message';

const manager = new MQ(
  require('./config'),
  console,
);

manager.factoryMns('another');
const producer = manager.getProducer('mns_another');

(async () => {
  try {
    const command = await producer
      .produce(new CommandMessage({ name: 'hello:world', spec: { foo: 'bar' } }));
    console.log('[%s] producing %o', producer.name, command);
  } catch (e) {
    console.error(e);
  } finally {
    // await producer.getClient().disconnect();
    // process.exit(0);
  }
})();
