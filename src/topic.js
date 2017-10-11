import assert from 'assert';

import find from 'lodash/find';
import AliMNS from 'ali-mns';

import { Message } from './message';

//////////////////////////////////////////////////////////////////////////////

class MnsPublisher {
  constructor({ topic, logger }) {
    /**
     * @type {AliMNS.Topic}
     */
    this.topic = topic;
    this.logger = logger;
  }

  /**
   * @param {Message} message
   */
  async publish(message) {
    assert(message instanceof Message);
    await this.topic.publishP(message.toString(), true);
    return message;
  }
}

class MnsSubscriber {
  constructor({ topic, logger }) {
    /**
     * @type {AliMNS.Topic}
     */
    this.topic = topic;
    this.logger = logger;
  }

  subscribe() {
    throw new Error('OperationNotPermittedException');
  }
}

//////////////////////////////////////////////////////////////////////////////

// TODO: use adapter pattern
class MessageTopic {
  constructor({ config, logger }) {
    const account = new AliMNS.Account(config.accountId, config.keyId, config.keySecret);
    account.setGA(false);
    const networkType = '';
    const region = new AliMNS.Region(config.region, networkType);
    const topic = new AliMNS.Topic(config.topicName, account, region);

    [this.publisher, this.subscriber] = [MnsPublisher, MnsSubscriber]
      .map(Cls => new Cls({ topic, logger }));
  }

  getPublisher() {
    return this.publisher;
  }

  getSubscriber() {
    return this.subscriber;
  }
}

//////////////////////////////////////////////////////////////////////////////

export class MT {
  /**
   * @param {Config} config
   * @param {Logger} logger
   */
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.topics = {};
  }

  /**
   * @returns {MessageTopic}
   */
  getTopic(topicName) {
    const config = this.config.get('mq');
    let mnsConfig = {};
    if (!topicName) {
      mnsConfig = find(config.mns, { default: true });
    } else {
      mnsConfig = find(config.mns, { topicName });
    }
    const name = topicName || mnsConfig.topicName;

    if (!this.topics[name]) {
      this.topics[name] = new MessageTopic({
        config: mnsConfig,
        logger: this.logger
      });
    }

    return this.topics[name];
  }

  getPublisher(topicName) {
    return this.getTopic(topicName).getPublisher();
  }
}

export default { MT };
