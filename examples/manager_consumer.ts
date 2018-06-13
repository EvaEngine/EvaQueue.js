import MQ from '../src/';
import { MessageInterface } from '../src/interfaces';

const manager = new MQ(
  require('./config'),
  console,
);
// const consumer = manager.getMNS().getConsumer();
const consumer = manager.getConsumer();

(async () => {
  await consumer.consuming(
    async (err: Error, message: MessageInterface) => {
      console.log('[%s] consuming %o', consumer.name, message.content);
    },
    3,
  );
})();
