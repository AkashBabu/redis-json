
/**
 * Return the given key if it's a string else
 * parses it into number
 *
 * @param key
 *
 * @returns a string if it cannot be parsed to a number
 *           else returns the parsed number
 */
export function parseKey(key: string): string | number {
  const numKey = Number(key);

  return isNaN(numKey) ? decodeKey(key) : numKey;
}

/**
 * Encapsulate '.' in the given key, such
 * that a '.' in the key is NOT misinterpreted
 * during unflattening of the object
 *
 * @param key
 */
export function encodeKey(key: string): string {
  return key.replace(/\./g, '/.');
}

/**
 * Recover the actual key which was encoded earlier.
 * This is done to allow a '.' in the key
 *
 * @param key
 */
function decodeKey(key: string): string {
  return key ? key.replace(/\/\./g, '.') : key;
}

export const splitKey = (() => {
  const keySplitReg = /(?<!\/)\./;

  /**
   * Splits the the given key based
   * on the delimiter ('.')
   *
   * @param key
   */
  return (key: string): string[] => {
    return key.split(keySplitReg);
  };
})();
