import { IStringifier, IParser } from '../interfaces';

export enum TYPE {
  OBJECT = '0',
  STRING = '1',
  NUMBER = '2',
  BOOLEAN = '3',
  FUNCTION = '4',
  UNDEFINED = '5',
  SYMBOL = '6',
}

type Primitives = 'object' | 'string' | 'number' | 'boolean' | 'function' | 'undefined' | 'symbol';

/**
 * Returns true if the constructor name is known
 * to us. Ex: Object, Array
 */
const isKnownContructor = (() => {
  const knownConstructors = {
    Object: true,
    Array: true,
  };

  return (constructorName: string): boolean => knownConstructors[constructorName];
})();

/**
 * Returns true if the given value's
 * type need to be skipped during storage.
 * For ex: Symbol -> Since symbols are private,
 * we DO NOT encourage them to be stored, hence
 * we are skipping from storing the same.
 *
 * In case you've forked this library and want to
 * add more type, then this is the place for you 🙂
 */
export const isSkippedType = (() => {
  const skippedType = {
    symbol: true,
  };

  return (val: any): boolean => !!skippedType[typeof val];
})();

/**
 * Returns a shorter form of the type of the
 * value that can be stored in redis.
 *   This also handles custom Classes by using
 * their constructor names directly.
 *
 * @param val Value whose type needs to be computed
 */
export const getTypeOf = (() => {
  const shortTypes: {
    [props in Primitives]: TYPE;
  } = {
    object: TYPE.OBJECT,
    string: TYPE.STRING,
    number: TYPE.NUMBER,
    boolean: TYPE.BOOLEAN,
    function: TYPE.FUNCTION,
    undefined: TYPE.UNDEFINED,
    symbol: TYPE.SYMBOL,
  };

  return (val: any): (TYPE | string) => {
    if (typeof val === 'object') {

      // If the val is `null`
      if (!val) {
        return TYPE.OBJECT;
      }

      const constructorName = val.constructor.name;
      return isKnownContructor(constructorName)

        // if the val is {} or []
        ? TYPE.OBJECT

        // if the val is Date or other custom classes / object
        : constructorName;
    }

    return shortTypes[typeof val] || TYPE.STRING /** this is a fallback, just in case */;
  };
})();

/**
 * Returns the stringified version of the given value.
 * However note that this method needs to take care,
 * such that special values like undefined, null, false, true
 * etc are also stringified correctly for storage.
 *
 * In case of a custom class / object, this method would
 * call the provided stringifier (if any available), else
 * would use `String(val)`
 *
 * @param val Value to be evaluated
 * @param stringifier Custom stringifiers
 *
 * @returns Stringified value. If null is returned, then such a value must NOT
 * be stored
 */
export const getValueOf = (val: any, stringifier: IStringifier = {}): string => {
  if (typeof val === 'object') {

    // if the val is null
    if (!val) {
      return 'null';
    }

    const constructorName = val?.constructor?.name;

    return isKnownContructor(constructorName)

      // if the val is {} or []
      ? JSON.stringify(val)

      // if the val is Date or other custom classes / object
      : stringifier[constructorName]
        ? stringifier[constructorName](val)
        : String(val);
  }

  return String(val);
};

/**
 * Converts the given value to the specified type.
 *   Also note that, if a custom className type is
 * detected, then the provided custom Parser will
 * be called (if any available), else will return
 * the value as is.
 */
export const getTypedVal = (() => {
  const internalParsers: {
    [props in TYPE]: (val: string) => any
  } = {
    [TYPE.STRING]: val => val,
    [TYPE.NUMBER]: Number,
    [TYPE.BOOLEAN]: (val) => val === 'true',
    [TYPE.FUNCTION]: val => val,
    [TYPE.UNDEFINED]: () => undefined,
    [TYPE.SYMBOL]: (val) => val,
    [TYPE.OBJECT]: (() => {
      const valMap = {
        '{}': () => ({}),
        '[]': () => [],
        'null': () => null,
      };
      return (val: string) => valMap[val]();
    })(),
  };

  return (type: TYPE | string, val: string, parser: IParser = {}): any => {
    return internalParsers[type]
      ? internalParsers[type](val)
      : parser[type]
        ? parser[type](val)
        : val;
  };
})();
