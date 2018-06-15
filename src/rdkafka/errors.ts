export const KAFKA_ERROR_CODE = {
  UNDEFINED: -1,

  CONNECTING: 1,
  CONNECTED: 2,
  DISCONNECT: 3,
  CONNECTION_NOT_READY: 4,
  CONNECTION_DEAD: 5,

  PRODUCER_RUNTIME: 101,
  PRODUCER_FLUSH: 102,

  METADATA: 201,
  SEEK: 202,
  CONSUMER_RUNTIME: 203,
};

export class KfkError extends Error {
  public code: number = KAFKA_ERROR_CODE.UNDEFINED;
}

// --- connection ---
export class ConnectingError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.CONNECTING;
  }
}

export class DisconnectError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.DISCONNECT;
  }
}

export class ConnectionNotReadyError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.CONNECTION_NOT_READY;
  }
}

export class ConnectionDeadError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.CONNECTION_DEAD;
  }
}

// --- producer ---
export class ProducerRuntimeError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.PRODUCER_RUNTIME;
  }
}

export class ProducerFlushError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.PRODUCER_FLUSH;
  }
}

// consumer
export class MetadataError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.METADATA;
  }
}

export class SeekError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.SEEK;
  }
}

export class ConsumerRuntimeError extends KfkError {
  constructor(message: string) {
    super(message);
    this.code = KAFKA_ERROR_CODE.CONSUMER_RUNTIME;
  }
}
