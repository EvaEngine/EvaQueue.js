export interface RDKafkaMessageInterface {
  value: Buffer; // message contents as a Buffer
  size: number; // size of the message, in bytes
  topic: string; // topic the message comes from
  offset: number; // offset the message was read from
  partition: number; // partition the message was on
  key: string; // key of the message if present
  timestamp: number; // timestamp of message creation
}

export interface RDKafkaMessageErrorInterface {
  message: RDKafkaMessageInterface;
  error: Error;
}

export interface RDTopicPartitionInterface {
  topic: string;
  partition: number;
  offset: number;
}

export interface RDKafkaMetadataInterface {
  topics: {
    name: string,
    partitions: {
      id: number,
      leader: number,
      replicas: number[],
      isrs: number[],
    }[],
  }[];
}

export enum CONFIG_DEBUG {
  generic = 'generic',
  broker = 'broker',
  topic = 'topic',
  metadata = 'metadata',
  feature = 'feature',
  queue = 'queue',
  msg = 'msg',
  protocol = 'protocol',
  cgrp = 'cgrp',
  security = 'security',
  fetch = 'fetch',
  interceptor = 'interceptor',
  plugin = 'plugin',
  consumer = 'consumer',
  admin = 'admin',
  all = 'all',
}

export enum CONFIG_TRUE_FALSE {
  true = 'true',
  false = 'false',
}

export enum CONFIG_IP_ADDRESS_FAMILY {
  any = 'any',
  v4 = 'v4',
  v6 = 'v6',
}

export enum CONFIG_SECURITY_PROTOCOL {
  plaintext = 'plaintext',
  ssl = 'ssl',
  sasl_plaintext = 'sasl_plaintext',
  sasl_ssl = 'sasl_ssl',
}

export enum CONFIG_MECHANISMS {
  GSSAPI = 'GSSAPI',
  PLAIN = 'PLAIN',
  'SCRAM-SHA-256' = 'SCRAM-SHA-256',
  'SCRAM-SHA-512' = 'SCRAM-SHA-512',
}

// https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md
export interface RDKafkaConfigInterface {
  'builtin.features'?: string;
  'client.id'?: string;
  'metadata.broker.list': string[];
  'message.max.bytes'?: number;
  'message.copy.max.bytes'?: number;
  'receive.message.max.bytes'?: number;
  'max.in.flight.requests.per.connection'?: number;
  'metadata.request.timeout.ms'?: number;
  'topic.metadata.refresh.interval.ms'?: number;
  'metadata.max.age.ms'?: number;
  'topic.metadata.refresh.fast.interval.ms'?: number;
  'topic.metadata.refresh.fast.cnt'?: number;
  'topic.metadata.refresh.sparse'?: CONFIG_TRUE_FALSE;
  'topic.blacklist'?: string;
  debug?: CONFIG_DEBUG;
  'socket.timeout.ms'?: number;
  'socket.blocking.max.ms'?: number;
  'socket.send.buffer.bytes'?: number;
  'socket.receive.buffer.bytes'?: number;
  'socket.keepalive.enable'?: CONFIG_TRUE_FALSE;
  'socket.nagle.disable'?: CONFIG_TRUE_FALSE;
  'socket.max.fails'?: number;
  'broker.address.ttl'?: number;
  'broker.address.family'?: CONFIG_IP_ADDRESS_FAMILY;
  'reconnect.backoff.jitter.ms'?: number;
  'statistics.interval.ms'?: number;
  'enabled_events'?: number;
  // 'log_level'?:number;
  // 'log.queue'?: CONFIG_TRUE_FALSE;
  // 'log.thread.name'?: string;
  // 'log.connection.close'?:number;
  'api.version.request'?: CONFIG_TRUE_FALSE;
  'api.version.request.timeout.ms'?: number;
  'api.version.fallback.ms'?: number;
  'security.protocol'?: CONFIG_SECURITY_PROTOCOL;
  'ssl.cipher.suites'?: string;
  'ssl.curves.list'?: string;
  'ssl.sigalgs.list'?: string;
  'ssl.key.location'?: string;
  'ssl.key.password'?: string;
  'ssl.certificate.location'?: string;
  'ssl.ca.location'?: string;
  'ssl.crl.location'?: string;
  'ssl.keystore.location'?: string;
  'ssl.keystore.password'?: string;
  'sasl.mechanisms'?: CONFIG_MECHANISMS;
  'sasl.kerberos.service.name'?: string;
  'sasl.kerberos.principal'?: string;
  'sasl.kerberos.kinit.cmd'?: string;
  'sasl.kerberos.keytab'?: string;
  'sasl.kerberos.min.time.before.relogin'?: number;
  'sasl.username'?: string;
  'sasl.password'?: string;
  'group.id'?: string;
  'partition.assignment.strategy'?: string;
  'session.timeout.ms'?: number;
  'heartbeat.interval.ms'?: number;
  'group.protocol.type'?: string;
  'coordinator.query.interval.ms'?: number;
}

export interface RDKafkaConsumerConfigInterface extends RDKafkaConfigInterface {
  'enable.auto.commit'?: CONFIG_TRUE_FALSE;
  'auto.commit.interval.ms'?: number;
  'enable.auto.offset.store'?: CONFIG_TRUE_FALSE;
  'queued.min.messages'?: number;
  'queued.max.messages.kbytes'?: number;
  'fetch.wait.max.ms'?: number;
  'fetch.message.max.bytes'?: number;
  'fetch.max.bytes'?: number;
  'fetch.min.bytes'?: number;
  'fetch.error.backoff.ms'?: number;
  'offset.store.method'?: string;
  'enable.partition.eof'?: CONFIG_TRUE_FALSE;
  'check.crcs'?: CONFIG_TRUE_FALSE;
}

export interface RDKafkaProducerConfigInterface extends RDKafkaConfigInterface {
  'queue.buffering.max.messages'?: number;
  'queue.buffering.max.kbytes'?: number;
  'queue.buffering.max.ms	'?: number;
  'message.send.max.retries'?: number;
  'retry.backoff.ms'?: number;
  'queue.buffering.backpressure.threshold'?: number;
  'compression.codec'?: string;
  'batch.num.messages'?: string;
  'delivery.report.only.error'?: CONFIG_TRUE_FALSE;
  dr_cb?: boolean;
  dr_msg_cb?: boolean;
}
