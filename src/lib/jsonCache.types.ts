
export type IPromisified = (...args: any[]) => Promise<any>;

export type Methods = 'hmset' | 'hmget' | 'hgetall' | 'expire' | 'del' | 'scan' | 'hincrbyfloat';

export type IMultiCommands = Array<[string, string, ...any[]]>;
export type IMulti = (commands: IMultiCommands) => Promise<any>;

export type IRedisMethods = {
  [K in Methods]: IPromisified;
} & {
  multi: IMulti;
};

export type IRedisClient = IRedisMethods;
export type Transaction = any;

export interface IDelOptions {
  transaction?: Transaction;
}

export interface ISetOptions {
  expire?: number;
  transaction?: Transaction;
}

/**
 * Stringifier will be used to convert a custom
 * object to a string when `set` is called
 */
export interface IStringifier {
  [constructorName: string]: (val: any) => string;
}

/**
 * Parser will be used to convert the string
 * back to custom object when `get` is called
 */
export interface IParser {
  [constructorName: string]: (val: string) => any;
}

/**
 * JSONCache options
 */
export interface IOptions {
  /**
   * Custom prefix to be used for storage
   * namespace separation
   */
  prefix?: string;

  /**
   * Stringifier will be used to convert a custom
   * object to a string when `set` is called
   */
  stringifier?: IStringifier;

  /**
   * Parser will be used to convert the string
   * back to custom object when `get` is called
   */
  parser?: IParser;
}
