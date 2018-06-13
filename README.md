# EvaQueue.js

EvaQueue.js provide a unified API across different high performance queue backends, including Kafka, AliMNS

## Quick start

```
npm install evaqueue ali-mns node-rdkafka
```

EvaQueue.js will installed as peer dependency, you are free to install queue libs which only required.

NOTE: if install `node-rdkafka` met error `ld: symbol(s) not found for architecture x86_64`, try below command to fix

```
CPPFLAGS=-I/usr/local/opt/openssl/include LDFLAGS=-L/usr/local/opt/openssl/lib npm install
```

### Use AliMNS

```typescript
import MnsMessageQueue, { MnsMessage } from 'evaqueue/lib/mns_adapter';

const mnsMQ = new MnsMessageQueue(
  {
    connection: {
      accountId: 'your account Id',
      region: 'hangzhou',
      keyId: 'your key id',
      keySecret: 'your secret',
      networkType: '',
    },
    defaultQueueName: 'your queue name',
  },
  console,
);

(async () => {
  const msg = await mnsMQ.getProducer().produce(new MnsMessage({ content: { foo: 'bar' } }));
  console.log(msg.toDebugString());
})();
```


# Development

``` bash
git clone git@github.com:bmqb/EvaQueue.js.git
cd EvaQueue.js
brew install jq
npm install
npm run install:peers
```


node-rdkafka promisfy is from https://github.com/joway/node-kfk
