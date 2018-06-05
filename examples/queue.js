import assert from 'assert';
import find from 'lodash/find';
import merge from 'lodash/merge';
import kue from 'kue';
import AliMNS from 'ali-mns';

import { Message } from '../src/message';
import { toCamelCase } from '../src/utils/case_converter';


//////////////////////////////////////////////////////////////////////////////

class MessageQueue {
  /**
   * @returns {{PRODUCER_CONSUMER: string, PUBLISHER_SUBSCRIBER: string}}
   */
  static get patterns() {
    return {
      PRODUCER_CONSUMER: 'PRODUCER_CONSUMER',
      PUBLISHER_SUBSCRIBER: 'PUBLISHER_SUBSCRIBER'
    };
  }

  static getAdapters() {
    return {
      kue: {
        config: {
          prefix: '',
          redis: {
            port: 6379,
            host: 'localhost',
            auth: null,
            options: {}
          }
        },
        ProducerClass: KueProducer,
        ConsumerClass: KueConsumer,
        MessageClass: KueMessage,
        size (adapter) {
          assert(adapter instanceof kue);
          return new Promise((resolve, reject) => {
            adapter.activeCount((err, count) => {
              if (err) {
                reject(err);
              } else {
                resolve(count);
              }
            });
          });
        },
        factory: config =>
          kue.createQueue({
            prefix: config.queueName,
            redis: config.redis
          })
      },
      mns: {
        config: {
          accountId: '',
          keyId: '',
          keySecret: '',
          region: 'hangzhou',
          networkType: '' //'':Public | '-internal':Internal | '-internal-vpc':VPC
        },
        ProducerClass: MnsProducer,
        ConsumerClass: MnsConsumer,
        MessageClass: MnsMessage,
        async size (adapter) {
          assert(adapter instanceof AliMNS.MQ);
          const attrs = await adapter.getAttrsP();
          return attrs.Queue.ActiveMessages + attrs.Queue.DelayMessages;
        },
        factory: (config) => {
          const account = new AliMNS.Account(config.accountId, config.keyId, config.keySecret);
          account.setGA(false);
          const region = new AliMNS.Region(config.region, config.networkType);
          return new AliMNS.MQ(config.queueName, account, region);
        }
      }
    };
  }

  /**
   * @param adapterName
   * @returns {{config: {}, adapter: (AliMNS.MQ),
   *            producer: (KueProducer|MnsProducer), consumer: (KueConsumer|MnsConsumer)}}
   */
  factoryProducerConsumer(adapterName) {
    const adapter = MessageQueue.getAdapters()[adapterName];
    const config = this.config[adapterName];
    this.adapter = adapter.factory(merge({}, adapter.config, config));
    return {
      config,
      adapter: this.adapter,
      producer: new adapter.ProducerClass({
        mq: this.adapter,
        logger: this.logger
      }),
      consumer: new adapter.ConsumerClass({
        mq: this.adapter,
        logger: this.logger
      })
    };
  }

  size(adapterName) {
    const adapter = MessageQueue.getAdapters()[adapterName];
    return adapter.size(this.adapter);
  }

  constructor({
    adapterName, pattern, config, logger
  }) {
    this.adapterName = adapterName || 'kue';
    this.pattern = pattern || MessageQueue.patterns.PRODUCER_CONSUMER;
    this.config = config;
    this.logger = logger;
    this.adapter = null;
    this.producer = null;
    this.consumer = null;

    assert(Object.keys(MessageQueue.getAdapters()).includes(this.adapterName), 'Adapter name not exists');
    assert(Object.keys(MessageQueue.patterns).includes(this.pattern), 'Pattern not exists');
    assert(this.config && this.logger, 'MQ require config && this.logger');

    if (this.pattern === MessageQueue.patterns.PRODUCER_CONSUMER) {
      const {
        producer,
        consumer
      } = this.factoryProducerConsumer(this.adapterName);
      this.producer = producer;
      this.consumer = consumer;
    }

    assert(this.producer && this.consumer);
  }

  /**
   * @returns {KueProducer|MnsProducer}
   */
  getProducer() {
    assert(this.pattern === MessageQueue.patterns.PRODUCER_CONSUMER, 'Producer require PRODUCER_CONSUMER pattern');
    return this.producer;
  }

  /**
   * @returns {KueConsumer|MnsConsumer}
   */
  getConsumer() {
    assert(this.pattern === MessageQueue.patterns.PRODUCER_CONSUMER, 'Consumer require PRODUCER_CONSUMER pattern');
    return this.consumer;
  }
}

//////////////////////////////////////////////////////////////////////////////

export class MQ {
  /**
   * @param {Config} config
   * @param {Logger} logger
   */
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.producerConsumerMQ = {};
  }

  /**
   * @returns {MessageQueue}
   */
  getProducerConsumerMQ(queueName) {
    const config = this.config.get('mq');
    let mnsConfig = {};
    if (!queueName) {
      mnsConfig = find(config.mns, { default: true });
    } else {
      mnsConfig = find(config.mns, { queueName });
    }
    const name = queueName || mnsConfig.queueName;

    if (this.producerConsumerMQ[name]) {
      return this.producerConsumerMQ[name];
    }

    this.producerConsumerMQ[name] = new MessageQueue({
      adapterName: this.config.get('mq.adapter'),
      pattern: MessageQueue.patterns.PRODUCER_CONSUMER,
      config: {
        adapter: config.adapter,
        kue: config.kue,
        mns: mnsConfig
      },
      logger: this.logger
    });
    return this.producerConsumerMQ[name];
  }

  size(queueName) {
    return this.getProducerConsumerMQ(queueName).size(this.config.get('mq.adapter'));
  }

  /**
   * @returns {KueProducer|MnsProducer}
   */
  getProducer(queueName) {
    return this.getProducerConsumerMQ(queueName).getProducer();
  }

  /**
   * @returns {KueConsumer|MnsConsumer}
   */
  getConsumer(queueName) {
    return this.getProducerConsumerMQ(queueName).getConsumer();
  }
}

export default { MQ };
