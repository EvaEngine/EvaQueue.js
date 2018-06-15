import MQ from '../src/';
import { MessageInterface } from '../src/interfaces';
import { KafkaConsumer } from '../src/kafka_adapter';

const manager = new MQ(
  require('./config'),
  console,
);
// const consumer = manager.getMNS().getConsumer();
const consumer = manager.getConsumer() as KafkaConsumer;

(async () => {
  let count = 0;
  await consumer.consuming(
    async (err: Error, message: MessageInterface) => {
      count += 1;
      console.log(
        '[%s] consuming count: [%s] processing [%s] message %j',
        consumer.name,
        count,
        consumer.processing,
        message,
      );
    },
    3,
  );
})();

consumer.enableGracefulExit();
