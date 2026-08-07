import { createRequire } from 'node:module';
import MnsMessageQueue from '../src/mns_adapter.js';

const require = createRequire(import.meta.url);
const mnsMQ = new MnsMessageQueue(
  require('./config').mns,
  console,
);

try {
  mnsMQ.getConsumer().consuming(
    async (err: unknown, message) => {
      if (err) {
        return console.error(err);
      }
      console.log('Consuming %s', message);
    },
    1,
  );
} catch (e: any) {
  console.error(e, e.prevError);
}
