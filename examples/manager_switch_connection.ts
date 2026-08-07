import { createRequire } from 'node:module';
import MQ from '../src/index.js';
import Message, { CommandMessage } from '../src/message.js';

const require = createRequire(import.meta.url);
const manager = new MQ(
  require('./config'),
  console,
);

await manager.factoryMns('another');
const producer = await manager.getProducer('mns_another');

try {
  const command = await producer
    .produce(new CommandMessage({ name: 'hello:world', spec: { foo: 'bar' } }));
  console.log('[%s] producing %o', producer.name, command);
} catch (e) {
  console.error(e);
}
