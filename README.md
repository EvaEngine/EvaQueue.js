# EvaQueue.js

EvaQueue.js provide a unified API across different high performance queue backends, including [Kafka](https://kafka.apache.org/), [AliMNS](https://www.alibabacloud.com/product/message-service) or other message queues which could be customized.

Features:

- Same API for Kafka / AliMNS / others
- Only install necessary message queue library, EvaQueue work as a peer dependency
- High level API, easier for understanding and using
- Built-In graceful exit
- Written by TypeScript, IDE friendly

## Quick start

```
npm install evaqueue ali-mns node-rdkafka
```

EvaQueue.js will installed as peer dependency, you are free to install queue libs which only required.

NOTE: if install `node-rdkafka` met error `ld: symbol(s) not found for architecture x86_64`, try below command to fix

```
CPPFLAGS=-I/usr/local/opt/openssl/include LDFLAGS=-L/usr/local/opt/openssl/lib npm install
```

## Use as Producer & Consumer

Produce a message to queue:

``` js
import MQ from 'evaqueue';
import Message from 'evaqueue/message';

const manager = new MQ(
  require('./config'),
  console,
);
const producer = manager.getProducer();

(async () => {
  try {
    const msg = await producer.produce(new Message({ foo: 'bar' }));
    console.log('[%s] producing %o', producer.name, msg);
  } catch (e) {
    console.error(e);
  }
})();
```

Consume messages from queue:

``` js
import MQ from 'evaqueue';

const manager = new MQ(
  require('./config'),
  console,
);
const consumer = manager.getConsumer();

(async () => {
  await consumer.consuming(
    async (err, message) => {
      console.log('[%s] consuming %o', consumer.name, message);
    },
    3,
  );
})();

consumer.enableGracefulExit();
```

### Switch Ali-MNS / Kafka

Just change config file

``` js
{
  defaultInstance: 'kafka_default'
}
```

to

``` js
{
  defaultInstance: 'mns_default'
}
```


### Try more examples

[Examples](./examples)

# Development

``` bash
git clone git@github.com:bmqb/EvaQueue.js.git
cd EvaQueue.js
brew install jq
npm install
npm run install:peers
```


node-rdkafka promisfy is from https://github.com/joway/node-kfk
