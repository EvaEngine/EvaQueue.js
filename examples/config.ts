import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFIG_DEBUG,
  CONFIG_MECHANISMS,
  CONFIG_SECURITY_PROTOCOL,
  CONFIG_TRUE_FALSE,
} from '../src/rdkafka/interfaces.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

let localConfig: Record<string, any> = {};
try {
  fs.accessSync(path.join(__dirname, 'config.local.ts'), fs.constants.F_OK);
  localConfig = require('./config.local');
} catch (e) {
  console.error(e);
}

const config = {
  mns: {
    default: {
      connection: {
        accountId: 'your_account_id',
        region: 'hangzhou',
        keyId: 'your_key_id',
        keySecret: 'your_key_secret',
        networkType: '',
      },
      defaultTopicName: 'your_topic_name',
      defaultQueueName: 'your_queue_name',
    },
    another: {
      connection: {
        accountId: 'your_account_id',
        region: 'hangzhou',
        keyId: 'your_key_id',
        keySecret: 'your_key_secret',
        networkType: '',
      },
      defaultTopicName: 'your_topic_name',
      defaultQueueName: 'your_queue_name',
    },
  },
  kafka: {
    default: {
      connection: {
        debug: CONFIG_DEBUG.all,
        'api.version.request': CONFIG_TRUE_FALSE.true,
        'metadata.broker.list': ['kafka-cn-internet.aliyun.com:8080'],
        'security.protocol': CONFIG_SECURITY_PROTOCOL.sasl_ssl,
        'ssl.ca.location': './ca-cert',
        'sasl.mechanisms': CONFIG_MECHANISMS.PLAIN,
        'sasl.username': 'your_username',
        'sasl.password': 'your_password',
      },
      producer: {
        dr_cb: true,
        dr_msg_cb: true,
      },
      consumer: {
        'group.id': 'your_group_id',
      },
      defaultQueueName: 'your_topic',
    },
  },
};

const finalConfig = _.merge({}, config, localConfig);
console.log('Loaded config: %j', finalConfig);

module.exports = finalConfig;
