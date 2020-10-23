import { IObj, IStringifier, IResult, IParser } from '../interfaces';

import { parseKey, encodeKey, splitKey } from '../utils/key';
import { getTypeOf, getTypedVal, getValueOf, isSkippedType } from '../utils/type';

const getDefaultResult = (): IResult => ({
  data: {},
  typeInfo: {},
});

/**
 * @internal
 */
export interface IFlattener {
  flatten(obj: IObj): IResult;
  unflatten(result: IResult): IObj;
}

/**
 * @internal
 *
 * Class for flattening and unflattening an object / array
 *
 * This could've been a simple function but is rather a class
 * because we are instantiating it during the constructor phase of
 * JSONCache class by calling it with stringifier & parser options.
 */
export class Flattener implements IFlattener {
  constructor(private stringifier: IStringifier = {}, private parser: IParser = {}) { }

  /**
   * Flattens the given object and converts it
   * to a dept of 1
   *
   * @param obj Object to be flattened
   */
  public flatten(obj: IObj): IResult {
    return this.traverse(obj, '', getDefaultResult());
  }

  /**
   * Unflattens the given object to its original
   * format and also applies the necessary types
   * that it originally had
   *
   * @param flattened Flattened object
   */
  public unflatten(flattened: IResult): IObj {
    const typedData = this.mergeTypes(flattened);

    let result: any;
    Object.entries(typedData).some(([key, val]) => {
      // if the key is '', it means that
      // the flattened object / array is empty
      if (!key) {
        if (Object.keys(typedData).length <= 1) {
          result = val;
          return true;
        } else {
          // when the initial data is {'': {}} and
          // later a prop is added to the same, then
          // the data would be {'': {}, prop: {...}}
          // hence we need to continue the loop when
          // the keys.length > 1
          return false;
        }
      }

      const splittedKeys = splitKey(key);

      if (!result) {
        result = typeof parseKey(splittedKeys[0]) === 'number' ? [] : {};
      }

      this.scaffoldStructure(result, splittedKeys, val);

      return false;
    });

    return result;
  }

  /***********************************
   * PRIVATE METHODS - Flatten helpers
   **********************************/

  private traverse(target: IObj, basePath: string, result: IResult): IResult {
    if (!(target instanceof Object)) return result;

    const entries = Object.entries(target);
    if (entries.length > 0) {
      entries.forEach(([key, val]) => {
        const encodedKey = encodeKey(key);

        const path = appendPath(basePath, encodedKey);

        if (val instanceof Object) {
          this.traverse(val, path, result);
        } else {
          this.assignResult(result, path, val);
        }
      });
    } else {
      this.assignResult(result, basePath, target);
    }

    return result;
  }

  private assignResult(result: IResult, path: string, val: any) {
    if (!isSkippedType(val)) {
      result.data[path] = getValueOf(val, this.stringifier);
      result.typeInfo[path] = getTypeOf(val);
    }
  }

  /*************************************
   * PRIVATE METHODS - Unflatten helpers
   *************************************/

  private mergeTypes(result: IResult): IObj {
    const { data, typeInfo } = result;

    return Object.entries(data).reduce(
      (merged, [path, val]) => {
        merged[path] = getTypedVal(typeInfo[path], val, this.parser);
        return merged;
      },
      {},
    );
  }

  private scaffoldStructure(tree: any, splittedKeys: string[], val: any) {
    // Loop until k1 has reached end of split
    for (let i = 0, len = splittedKeys.length; i < len; i++) {
      const k1 = parseKey(splittedKeys[i]);
      const k2 = parseKey(splittedKeys[i + 1]);

      if (typeof k2 === 'undefined') {
        tree[k1] = val;
      } else {
        const isObj = typeof tree[k1] === 'object';
        if (!isObj) tree[k1] = typeof k2 === 'number' ? [] : {};
        tree = tree[k1];
      }
    }
  }
}

function appendPath(basePath: string, key: string) {
  return basePath ? `${basePath}.${key}` : key;
}
