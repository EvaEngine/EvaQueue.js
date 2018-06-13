import { LoggerInterface } from 'interfaces';

const adapters = {};
export default class MessageQueue {
  config: any;
  logger: LoggerInterface;

  static registerAdapter(adapterName: string, adapaterClass: any) {
    Object.assign(adapters, {
      [adapterName]: adapaterClass,
    });
  }

  constructor(config: any, logger: LoggerInterface) {
    this.config = config;
    this.logger = logger;
  }

  getAdapter(name: string, adapterClass: any) {
    return new adapterClass({
      config: this.config[name],
      logger: this.logger,
    });
  }

  /**
   * @returns {MnsMessageQueue}
   */
  getMNS() {
    const name = 'mns';
    const mnsAdapter = require('./mns_adapter').default;
    MessageQueue.registerAdapter(name, mnsAdapter);
    return new mnsAdapter({
      config: this.config[name],
      logger: this.logger,
    });
  }

  /**
   * @returns {KafkaMessageQueue}
   */
  getKafka() {
    const name = 'kafka';
    const kafkaAdapter = require('./kafka_adapter').default;
    MessageQueue.registerAdapter(name, kafkaAdapter);
    return new kafkaAdapter({
      config: this.config[name],
      logger: this.logger,
    });
  }
}
