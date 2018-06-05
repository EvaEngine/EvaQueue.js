declare var CryptoA: any;
declare var Events: any;
declare var Util: any;
declare var Url: any;
declare var UA: any;
declare var debug: any;
declare var Promise: PromiseConstructor;
declare var Request: {
  new(input: RequestInfo, init?: RequestInit): Request;
  prototype: Request;
};
declare var Xml2js: any;
declare var XmlBuilder: any;
declare module AliMNS {
  class Account {
    constructor(accountId: string, keyId: string, keySecret: string);

    getAccountId(): string;

    getOwnerId(): string;

    getKeyId(): string;

    getGA(): boolean;

    setGA(bGA: boolean): void;

    getHttps(): boolean;

    setHttps(bHttps: boolean): void;

    hmac_sha1(text: string, encoding?: string): any;

    b64md5(text: string): any;

    private _accountId;
    private _keyId;
    private _keySecret;
    private _bGoogleAnalytics;
    private _bHttps;
  }
}
declare module AliMNS {
  class Msg {
    constructor(msg: string, priority?: number, delaySeconds?: number);

    getMsg(): string;

    getPriority(): number;

    getDelaySeconds(): number;

    private _msg;
    private _priority;
    private _delaySeconds;
  }
}
declare module AliMNS {
  interface IMNS {
    listP(prefix?: string, pageSize?: number, pageMarker?: string): any;

    createP(name: string, options?: any): any;

    deleteP(name: string): any;
  }

  interface IMNSTopic extends IMNS {
    listTopicP(prefix?: string, pageSize?: number, pageMarker?: string): any;

    createTopicP(name: string, options?: any): any;

    deleteTopicP(name: string): any;
  }

  interface IMQ {
    getAttrsP(): any;

    setAttrsP(options: any): any;

    sendP(msg: string, priority?: number, delaySeconds?: number): any;

    recvP(waitSeconds?: number): any;

    peekP(): any;

    deleteP(receiptHandle: string): any;

    reserveP(receiptHandle: string, reserveSeconds: number): any;
  }

  interface IMQBatch extends IMQ {
    sendP(msg: string | Array<Msg>, priority?: number, delaySeconds?: number): any;

    recvP(waitSeconds?: number, numOfMessages?: number): any;

    peekP(numOfMessages?: number): any;

    deleteP(receiptHandle: string | Array<string>): any;
  }

  interface INotifyRecv {
    notifyRecv(cb: (ex: Error, msg: any) => Boolean, waitSeconds?: number): any;

    notifyStopP(): any;
  }

  interface INotifyRecvBatch extends INotifyRecv {
    notifyRecv(cb: (ex: Error, msg: any) => Boolean, waitSeconds?: number, numOfMessages?: number): any;
  }

  interface ITopic {
    getAttrsP(): any;

    setAttrsP(options: any): any;

    listP(prefix?: string, pageSize?: number, pageMarker?: string): any;

    subscribeP(name: string, endPoint: string, notifyStrategy?: string, notifyContentFormat?: string): any;

    unsubscribeP(name: string): any;

    publishP(msg: string, b64: boolean): any;
  }

  interface ISubscription {
    getAttrsP(): any;

    setAttrsP(options: any): any;
  }

  interface ITopicNotify {
    notifyP(request: any): any;
  }
}
declare module AliMNS {
  class OpenStack {
    constructor(account: Account);

    sendP(method: string, url: string, body?: any, headers?: any, options?: any): any;

    accumulateNextGASend(prefix: string): void;

    disableGA(bDisable?: boolean): void;

    private makeHeaders(mothod, url, headers, body?);

    private authorize(httpVerb, mnsURI, mnsHeaders, contentType, contentMD5, tm);

    private signature(httpVerb, mnsURI, mnsHeaders, contentType, contentMD5, tm);

    private _account;
    private _patternMNS;
    private _patternSign;
    private _xmlBuilder;
    private _contentType;
    private _version;
    private _ga;
    private _gaRGA;
  }
}
declare module AliMNS {
  class Region {
    constructor(city?: string | City, network?: string | NetworkType, zone?: string | Zone);

    buildString(): void;

    toString(): string;

    private networkToString(network);

    private zoneToString(zone);

    private cityToString(city);

    private cityToZone(city);

    private _zone;
    private _city;
    private _network;
    private _pattern;
    private _region;
  }

  enum NetworkType {
    Public = 0,
    Internal = 1,
    VPC = 2,
  }

  enum Zone {
    China = 0,
    AsiaPacific = 1,
    Europe = 2,
    UniteState = 3,
    MiddleEast = 4,
  }

  enum Area {
    UniteState = 1,
    Germany = 49,
    Australia = 61,
    Singapore = 65,
    Japan = 81,
    China = 86,
    Hongkong = 852,
    UnitedArabEmirates = 971,
  }

  enum City {
    Beijing = 5636106,
    Shanghai = 5636117,
    Qingdao = 5636628,
    Hangzhou = 5636667,
    Shenzhen = 5636851,
    Hongkong = 55836672,
    Tokyo = 5308419,
    Singapore = 4259840,
    Sydney = 3997698,
    Frankfurt = 3211599,
    SiliconValley = 65951,
    Virginia = 66107,
    Dubai = 63635460,
  }
}
declare module AliMNS {
  class MNS implements IMNS {
    constructor(account: Account, region?: string | Region);

    listP(prefix?: string, pageSize?: number, pageMarker?: string): any;

    createP(name: string, options?: any): any;

    deleteP(name: string): any;

    private makeURL();

    protected _account: Account;
    protected _region: Region;
    private _pattern;
    private _url;
    protected _openStack: OpenStack;
  }

  var MQS: typeof MNS;
}
declare module AliMNS {
  class NotifyRecv implements INotifyRecvBatch {
    constructor(mq: IMQ);

    notifyRecv(cb: (ex: Error, msg: any) => Boolean, waitSeconds?: number, numOfMessages?: number): void;

    notifyStopP(): any;

    private notifyRecvInternal(cb, waitSeconds, numOfMessages?);

    private deleteP(dataRecv);

    private _mq;
    private _signalSTOP;
    private _evStopped;
    private _emitter;
    private _timeoutCount;
    private _timeoutMax;
    private _ga;
  }
}
declare module AliMNS {
  class MQ implements IMQ, INotifyRecv {
    constructor(name: string, account: Account, region?: string | Region);

    getName(): string;

    getAccount(): Account;

    getRegion(): Region;

    getAttrsP(): any;

    setAttrsP(options: any): any;

    sendP(msg: string, priority?: number, delaySeconds?: number): any;

    getRecvTolerance(): number;

    setRecvTolerance(value: number): void;

    recvP(waitSeconds?: number): any;

    peekP(): any;

    deleteP(receiptHandle: string): any;

    reserveP(receiptHandle: string, reserveSeconds: number): any;

    notifyRecv(cb: (ex: Error, msg: any) => Boolean, waitSeconds?: number): any;

    notifyStopP(): any;

    protected utf8ToBase64(src: any): string;

    protected base64ToUtf8(src: any): string;

    protected decodeB64Messages(data: any): void;

    private makeAttrURL();

    private makeURL();

    protected _url: string;
    protected _openStack: OpenStack;
    protected _notifyRecv: INotifyRecv;
    protected _recvTolerance: number;
    private _name;
    private _region;
    private _account;
    private _urlAttr;
    private _pattern;
  }
}
declare module AliMNS {
  class MQBatch extends MQ implements IMQBatch, INotifyRecvBatch {
    constructor(name: string, account: Account, region?: string);

    sendP(msg: string | Array<Msg>, priority?: number, delaySeconds?: number): any;

    recvP(waitSeconds?: number, numOfMessages?: number): any;

    peekP(numOfMessages?: number): any;

    deleteP(receiptHandle: string | Array<string>): any;

    notifyRecv(cb: (ex: Error, msg: any) => Boolean, waitSeconds?: number, numOfMessages?: number): any;

    protected decodeB64Messages(data: any): void;

    protected _notifyRecv: INotifyRecvBatch;
  }
}
declare var gitVersion: any;
declare module AliMNS {
  class GA {
    constructor(accId: string);

    send(action: string, value: number, url: string): void;

    accumulateNextSend(prefix: string): void;

    disableGA(bDisable?: boolean): void;

    private u2id(uid);

    private _visitor;
    private _gitMark;
    private _bGoogleAnalytics;
    private _rgxAccId;
    private _bAccumulated;
    private _bAccumulatePrefix;
    private _accumutionMax;
    private _accumulation;
  }
}
declare module AliMNS {
  class MNSTopic extends MNS implements IMNSTopic {
    constructor(account: Account, region?: string | Region);

    listTopicP(prefix?: string, pageSize?: number, pageMarker?: string): any;

    createTopicP(name: string, options?: any): any;

    deleteTopicP(name: string): any;

    private makeTopicURL();

    private _patternTopic;
    private _urlTopic;
  }
}
declare module AliMNS {
  class Topic implements ITopic {
    constructor(name: string, account: Account, region?: string | Region);

    getName(): string;

    getAccount(): Account;

    getRegion(): Region;

    getAttrsP(): any;

    setAttrsP(options: any): any;

    listP(prefix?: string, pageSize?: number, pageMarker?: string): any;

    subscribeP(name: string, endPoint: string, notifyStrategy?: string, notifyContentFormat?: string, filterTag?: string): any;

    unsubscribeP(name: string): any;

    publishP(msg: string, b64: boolean, tag?: string, attrs?: any, options?: any): any;

    protected utf8ToBase64(src: any): string;

    private makeAttrURL();

    private makeSubscriptionURL();

    private makePublishURL();

    private _urlSubscription;
    private _urlPublish;
    protected _openStack: OpenStack;
    private _name;
    private _region;
    private _account;
    private _urlAttr;
    private _pattern;
  }
}
declare module AliMNS {
  class Subscription implements ISubscription {
    constructor(name: string, topic: Topic);

    getName(): string;

    getTopic(): Topic;

    getAttrsP(): any;

    setAttrsP(options: any): any;

    static NotifyStrategy: {
      BACKOFF_RETRY: string;
      EXPONENTIAL_DECAY_RETRY: string;
    };
    static NotifyContentFormat: {
      XML: string;
      SIMPLIFIED: string;
    };

    private makeAttrURL();

    protected _openStack: OpenStack;
    private _name;
    private _topic;
    private _urlAttr;
    private _pattern;
  }
}

export default AliMNS;