import { createRequire } from 'node:module';
import MnsMessageQueue from '../src/mns_adapter.js';
import Message from '../src/message.js';

const require = createRequire(import.meta.url);
const mnsMQ = new MnsMessageQueue(
  require('./config').mns,
  console,
);

const msg = await mnsMQ.getProducer().produce(new Message({ content: { foo: 'bar' } }));
console.log(msg.toDebugString());
