
export interface ISetOptions {
  expire?: number;
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

/**
 * @hidden
 */
export interface IObj<T = any> {
  [anyProp: string]: T;
}

/**
 * @hidden
 */
export interface IResult {
  data: IObj<string>;
  typeInfo: IObj<string>;
}

