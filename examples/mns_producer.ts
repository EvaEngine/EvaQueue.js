import MnsMessageQueue from '../src/mns_adapter';
import Message from '../src/message';

const mnsMQ = new MnsMessageQueue(
  require('./config').mns,
  console,
);

(async () => {
  const msg = await mnsMQ.getProducer().produce(new Message({ content: { foo: 'bar' } }));
  console.log(msg.toDebugString());
})();
