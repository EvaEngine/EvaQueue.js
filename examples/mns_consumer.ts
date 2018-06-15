import MnsMessageQueue from '../src/mns_adapter';

const mnsMQ = new MnsMessageQueue(
  require('./config').mns,
  console,
);

// BEGIN: main function
(async () => {
  try {
    mnsMQ.getConsumer().consuming(
      async (err, message) => {
        if (err) {
          return console.error(err);
        }
        console.log('Consuming %s', message);
      },
      1,
    );
  } catch (e) {
    console.error(e, e.prevError);
  }
})();
