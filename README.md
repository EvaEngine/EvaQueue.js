# EvaQueue.js

Message queue and topic for [EvaEngine.js](https://github.com/EvaEngine/EvaEngine.js).

## Prerequisites

- [ali-mns](https://www.npmjs.com/package/ali-mns) account and at least one message queue
- [evaengine](https://www.npmjs.com/package/evaengine) and related config files

## Config

```javascript
{
  mq: {
    mns: [
      {
        queueName: 'queue_1',
        topicName: 'topic_1',
        accountId: '',
        region: '',
        keyId: '',
        keySecret: '',
        default: true
      }
    ],
    kue: {
      redis: {
        port: 6379,
        host: 'localhost',
        auth: null,
        options: {}
      }
    }
  }
}
```

## Usage

- MQ: queue model
- MT: topic model
- Message: message for MQ and MT

```javascript
import { DI } from 'evaengine';
import { Message, MT, MQ } from 'evaqueue';

// use evaengine's config and logger
const config = DI.get('config');
const logger = DI.get('logger');

// publish message on topic
const mt = new MT(config, logger);
mt.getPublisher().publish(new Message({
  command: `faker:sleeping --seconds 3`
}));

// produce message on queue
const mq = new MQ(config, logger);
mq.getProducer().produce(new Message({
  command: `event:trigger --name 'foo' --data 'bar'`
}));
```
