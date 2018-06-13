import _ from 'lodash';
import {
  CONFIG_DEBUG,
  CONFIG_MECHANISMS,
  CONFIG_SECURITY_PROTOCOL,
  CONFIG_TRUE_FALSE,
} from '../src/rdkafka/interfaces';
import fs from 'fs';

let localConfig = {};
try {
  fs.accessSync('./config.local.ts', fs.constants.F_OK);
  localConfig = require('./config.local');
} catch (e) {
}

const config = {
  mns: {
    connection: {
      accountId: 'your_account_id',
      region: 'hangzhou',
      keyId: 'your_key_id',
      keySecret: 'your_key_secret',
      networkType: '',
    },
    defaultQueueName: 'your_queue_name',
  },
  kafka: {
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
};

const finalConfig = _.merge(config, localConfig);
console.log('config:', finalConfig);

module.exports = finalConfig;
