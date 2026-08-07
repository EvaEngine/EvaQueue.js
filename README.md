# EvaQueue.js

[![NPM version](https://img.shields.io/npm/v/evaqueue.svg?style=flat-square)](http://badge.fury.io/js/evaqueue)
[![CI](https://github.com/bmqb/EvaQueue.js/actions/workflows/ci.yml/badge.svg)](https://github.com/bmqb/EvaQueue.js/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/dm/evaqueue.svg?maxAge=2592000)](https://www.npmjs.com/package/evaqueue)
[![License](https://img.shields.io/npm/l/evaqueue.svg?maxAge=2592000?style=plastic)](https://github.com/bmqb/EvaQueue.js/blob/master/LICENSE)


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
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import MQ from 'evaqueue';
import Message from 'evaqueue/message';

const manager = new MQ(
  require('./config'),
  console,
);
const producer = await manager.getProducer();

const msg = await producer.produce(new Message({ foo: 'bar' }));
console.log('[%s] producing %o', producer.name, msg);
```

Consume messages from queue:

``` js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import MQ from 'evaqueue';

const manager = new MQ(
  require('./config'),
  console,
);
const consumer = await manager.getConsumer();

await consumer.consuming(
  async (err, message) => {
    console.log('[%s] consuming %o', consumer.name, message);
  },
  3,
);

consumer.enableGracefulExit();
```

### Switch default Ali-MNS / Kafka

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

or switch manually by:

``` js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const manager = new MQ(
  require('./config'),
  console,
);
const consumer = await manager.getConsumer('mns_another');
```


### Try more examples

[Examples](./examples)

# Development

``` bash
git clone git@github.com:bmqb/EvaQueue.js.git
cd EvaQueue.js
pnpm install
```

## Requirements

- Node.js >= 24.0.0
- pnpm (recommended for development) or npm
