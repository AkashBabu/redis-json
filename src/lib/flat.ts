import { IObj } from './interfaces';

/**
 * Flattens an object into another object
 * with key(in the form of 'a.b', 'a.c.0')-value pairs of dept=1
 *
 * @param target Object to be flattened
 * @param path String path not to include in the flattened object
 *
 * @returns
 */
export function flatten(target: IObj): IObj {
  return step(target);
}

function handleVal(val: any, path: string, result: IObj) { // tslint:disable cyclomatic-complexity
  const isArray = Array.isArray(val);
  const isObject = val instanceof Object && !isArray;

  if (isObject) {
    if (Object.keys(val).length === 0) {
      result[path] = '{}';
    } else {
      step(val, path, result);
    }
  } else if (isArray) {
    if (val.length === 0) {
      result[path] = '[]';
    } else {
      val.forEach((item: any, i: number) => {
        const newPath = `${path}.${i}`;

        handleVal(item, newPath, result);
      });
    }
  } else {
    if (typeMap[val]) {
      result[path] = String(val);
    } else {
      result[path] = val;
    }
  }
}

const typeMap = {
  undefined: true,
  null: true,
  false: true,
  true: true,
};

/**
 * Moves into each embedded object in a step by step fashion
 *
 * @param object
 * @param prev Previous step's key
 */
function step(obj: IObj, path: string = '', result: IObj = {}) {
  Object.entries(obj).forEach(([key, val]) => {
    const currPath = path ? `${path}.${key}` : key;
    handleVal(val, currPath, result);
  });

  return result;
}

/**
 * Unflatten/reverts the flattened object back
 * to original object
 *
 * @param target Flattened object
 *
 * @returns unflattened object
 */
export function unflatten(target: IObj) {
  const delimiter = '.';
  const result = {};

  Object.entries(target).forEach(([key, val]) => { // tslint:disable cyclomatic-complexity
    const split = key.split(delimiter);

    let i = 0;

    // Get first and next key in the split key path
    let k1 = getkey(split[i]);
    let k2 = getkey(split[i + 1]);

    let tmp = result;

    // Loop until k1 has reached end of split
    while (k2 !== undefined) {
      const isObj = tmp[k1] instanceof Object;

      // If path has not been initialized,
      // then initialize it as an array/object
      // depending on next key (whether number or not?)
      if (!isObj) tmp[k1] = typeof k2 === 'number' ? [] : {};

      // Move one key forward
      tmp = tmp[k1];
      if (++i < split.length) {
        k1 = getkey(split[i]);
        k2 = getkey(split[i + 1]);
      }
    }

    tmp[k1] = unflattenMap[val] ? unflattenMap[val]() : val;
  });

  return result;
}

const unflattenMap: {[prop: string]: () => any} = {
  '{}': () => ({}),
  '[]': () => [],
  'undefined': () => undefined,
  'null': () => null,
  'true': () => true,
  'false': () => false,
};

/**
 * Return the given key if it's a string else
 * parses it into number
 *
 * @param key
 *
 * @returns a string if it cannot be parsed to a number
 *           else returns the parsed number
 */
function getkey(key: string): string | number {
  const parsedKey = Number(key);

  return isNaN(parsedKey) ? key : parsedKey;
}
