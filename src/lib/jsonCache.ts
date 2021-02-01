import { promisify } from 'util';
import { Flattener, IFlattener } from './flattener';
import { IOptions, ISetOptions, IResult } from '../interfaces';
import { TYPE } from '../utils/type';

type IPromisified = (...args: any[]) => Promise<any>;

type Methods = 'hmset' | 'hmget' | 'hgetall' | 'expire' | 'del' | 'scan' | 'hincrbyfloat';

type IRedisMethods = {
  [K in Methods]: IPromisified;
};

type IRedisClient = IRedisMethods;
type Transaction = any;

type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends any[] ? Array<RecursivePartial<T[P]>>
    : T[P] extends any ? RecursivePartial<T[P]>
    : T[P];
};

interface IJSONCache<T> {
  set(key: string, obj: T, options: ISetOptions): Promise<any>;
  get(key: string, ...fields: string[]): Promise<Partial<T> | undefined>;
  rewrite(key: string, obj: T, options?: ISetOptions): Promise<any>;
  clearAll(): Promise<any>;
  del(key: string): Promise<any>;
  incr(key: string, obj: RecursivePartial<T>): Promise<any>;

  // Transaction methods
  setT(transaction: Transaction, key: string, obj: T, options: ISetOptions): Transaction;
  rewriteT(transaction: Transaction, key: string, obj: T, options?: ISetOptions): Transaction;
  delT(transaction: Transaction, key: string): Transaction;
  incrT(transaction: Transaction, key: string, obj: RecursivePartial<T>): Transaction;
}

const SCAN_COUNT = 100;

/**
 * JSONCache eases the difficulties in storing a JSON in redis.
 *
 *  It stores the JSON in hashset for simpler get and set of required
 * fields. It also allows you to override/set specific fields in
 * the JSON without rewriting the whole JSON tree. Which means that it
 * is literally possible to `Object.deepAssign()`.
 *
 *   Everytime you store an object, JSONCache would store two hashset
 * in Redis, one for data and the other for type information. This helps
 * during retrieval of data, to restore the type of data which was originally
 * provided. All these workaround are needed because Redis DOES NOT support
 * any other data type apart from String.
 *
 * Well the easiest way is to store an object in Redis is
 * JSON.stringify(obj) and store the stringified result.
 * But this can cause issue when the obj is
 * too huge or when you would want to retrieve only specific fields
 * from the JSON but do not want to parse the whole JSON.
 *   Also note that this method would end up in returing all the
 * fields as strings and you would have no clue to identify the type of
 * field.
 */
export default class JSONCache<T = any> implements IJSONCache<T> {
  private redisClientInt: IRedisClient;

  private flattener: IFlattener;

  /**
   * Intializes JSONCache instance
   * @param redisClient RedisClient instance(Preferred ioredis - cient).
   *      It supports any redisClient instance that has
   *      `'hmset' | 'hmget' | 'hgetall' | 'expire' | 'del' | 'keys'`
   *      methods implemented
   * @param options Options for controlling the prefix
   */
  constructor(redisClient: any, private options: IOptions = {}) {
    this.options.prefix = typeof options.prefix === 'string' ? options.prefix : 'jc:';

    this.redisClientInt = {
      hmset: promisify(redisClient.hmset).bind(redisClient),
      hmget: promisify(redisClient.hmget).bind(redisClient),
      hgetall: promisify(redisClient.hgetall).bind(redisClient),
      expire: promisify(redisClient.expire).bind(redisClient),
      del: promisify(redisClient.del).bind(redisClient),
      scan: promisify(redisClient.scan).bind(redisClient),
      hincrbyfloat: promisify(redisClient.hincrbyfloat).bind(redisClient),
    };

    this.flattener = new Flattener(options.stringifier, options.parser);

  }

  /**
   * Flattens the given json object and
   * stores it in Redis hashset
   *
   * @param key Redis key
   * @param obj JSON object to be stored
   * @param options
   */
  public async set(key: string, obj: T, options: ISetOptions = {}): Promise<any> {
    const flattened = this.flattener.flatten(obj);

    await Promise.all([
      this.redisClientInt.hmset(this.getKey(key), flattened.data),
      this.redisClientInt.hmset(this.getTypeKey(key), flattened.typeInfo),
    ]);
    if (options.expire) {
      await Promise.all([
        this.redisClientInt.expire(this.getKey(key), options.expire),
        this.redisClientInt.expire(this.getTypeKey(key), options.expire),
      ]);
    }
  }

  /**
   * Flattens the given json object and
   * stores it in Redis hashset using
   * the given transaction
   *
   * @param transaction redis transaction
   * @param key Redis key
   * @param obj JSON object to be stored
   * @param options
   */
  public setT(transaction: Transaction, key: string, obj: T, options: ISetOptions = {}): Transaction {
    const flattened = this.flattener.flatten(obj);

    transaction.hmset(this.getKey(key), flattened.data);
    transaction.hmset(this.getTypeKey(key), flattened.typeInfo);
    if (options.expire) {
      transaction.expire(this.getKey(key), options.expire);
      transaction.expire(this.getTypeKey(key), options.expire);
    }

    return transaction;
  }

  /**
   * Retrieves the hashset from redis and
   * unflattens it back to the original Object
   *
   * @param key Redis key
   * @param fields List of fields to be retreived from redis.
   *    This helps reduce network latency incase only a few fields are
   *    needed.
   *
   * @returns request object from the cache
   */
  public async get(key: string, ...fields: string[]): Promise<Partial<T> | undefined> {
    const [data, typeInfo] = await Promise.all([
      this.redisClientInt.hgetall(this.getKey(key)),
      this.redisClientInt.hgetall(this.getTypeKey(key)),
    ]);

    // Empty object is returned when
    // the given key is not present
    // in the cache
    if (!data || Object.keys(data).length === 0) {
      return undefined;
    }

    let result: IResult;
    if (fields.length > 0) {
      let dataKeys: string[];

      result = fields.reduce((res, field) => {
        if (field in data) {
          res.data[field] = data[field];
          res.typeInfo[field] = typeInfo[field];
        } else {
          const searchKey = `${field}.`;
          (dataKeys || (dataKeys = Object.keys(data))).forEach(flattenedKey => {
            if (flattenedKey.startsWith(searchKey)) {
              res.data[flattenedKey] = data[flattenedKey];
              res.typeInfo[flattenedKey] = typeInfo[flattenedKey];
            }
          });
        }

        return res;
      }, { data: {}, typeInfo: {} }) as IResult;
    } else {
      result = { data, typeInfo };
    }

    return this.flattener.unflatten(result) as T;
  }

  /**
   * Replace the entire hashset for the given key
   *
   * @param key Redis key
   * @param obj JSON Object of type T
   */
  public async rewrite(key: string, obj: T, options?: ISetOptions): Promise<any> {
    await this.redisClientInt.del(this.getKey(key));
    await this.set(key, obj, options);
  }

  /**
   * Replace the entire hashset for the given key
   *
   * @param transaction Redis transaction
   * @param key Redis key
   * @param obj JSON Object of type T
   */
  public rewriteT(transaction: Transaction, key: string, obj: T, options?: ISetOptions): Transaction {
    transaction.del(this.getKey(key));
    return this.setT(transaction, key, obj, options);
  }

  /**
   * Removes/deletes all the keys in the JSON Cache,
   * having the prefix.
   */
  public async clearAll(): Promise<any> {
    let cursor = '0';
    let keys: string[];

    do {
      [cursor, keys] = await this.redisClientInt.scan(cursor, 'MATCH', `${this.options.prefix}*`, 'COUNT', SCAN_COUNT);

      if (keys.length > 0) {
        await this.redisClientInt.del(...keys);
      }
    } while (cursor !== '0');
  }

  /**
   * Removes the given key from Redis
   *
   * Please use this method instead of
   * directly using `redis.del` as this method
   * ensures that even the corresponding type info
   * is removed. It also ensures that prefix is
   * added to key, ensuring no other key is
   * removed unintentionally
   *
   * @param key Redis key
   */
  public async del(key: string): Promise<any> {
    await Promise.all([
      this.redisClientInt.del(this.getKey(key)),
      this.redisClientInt.del(this.getTypeKey(key)),
    ]);
  }

  /**
   * Removes the given key from Redis
   * using the given transaction
   *
   * Please use this method instead of
   * directly using `redis.del` as this method
   * ensures that even the corresponding type info
   * is removed. It also ensures that prefix is
   * added to key, ensuring no other key is
   * removed unintentionally
   *
   * @param transaction Redis transaction
   * @param key Redis key
   */
  public delT(transaction: Transaction, key: string): Transaction {
    transaction.del(this.getKey(key));
    transaction.del(this.getTypeKey(key));

    return transaction;
  }

  /**
   * Increments the value of a variable in the JSON
   * Note: You can increment multiple variables in the
   * same command (Internally it will split it into multiple
   * commands on the RedisDB)
   *
   * @example
   * ```JS
   * await jsonCache.incr(key, {messages: 10, profile: {age: 1}})
   * ```
   *
   * @param key Redis Cache key
   * @param obj Partial object specifying the path to the required
   *              variable along with value
   */
  public async incr(key: string, obj: RecursivePartial<T>): Promise<any> {
    const flattened = this.flattener.flatten(obj);

    await Promise.all(Object.entries(flattened.data).map(([path, incrVal]) => {

      // This check is needed to avoid redis errors.
      // It also helps while the user wants to increment the value
      // within an array.
      // Ex: rand: [null, null, 1] => this will increment the 3rd index by 1
      if (flattened.typeInfo[path] !== TYPE.NUMBER) {
        return;
      }

      return this.redisClientInt.hincrbyfloat(this.getKey(key), path, incrVal);
    }));
  }

  public incrT(transaction: Transaction, key: string, obj: RecursivePartial<T>): Transaction {
    const flattened = this.flattener.flatten(obj);

    Object.entries(flattened.data).forEach(([path, incrVal]) => {

      // This check is needed to avoid redis errors.
      // It also helps while the user wants to increment the value
      // within an array.
      // Ex: rand: [null, null, 1] => this will increment the 3rd index by 1
      if (flattened.typeInfo[path] !== TYPE.NUMBER) {
        return;
      }

      transaction.hincrbyfloat(this.getKey(key), path, incrVal);
    });

    return transaction;
  }

  /******************
   * PRIVATE METHODS
   ******************/

  /**
   * Returns the redis storage key for storing data
   * by prefixing custom string, such that it
   * doesn't collide with other keys in usage
   *
   * @param key Storage key
   */
  private getKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Returns the redis storage key for storing
   * corresponding types by prefixing custom string,
   * such that it doesn't collide with other keys
   * in usage
   *
   * @param key Storage key
   */
  private getTypeKey(key: string): string {
    return `${this.options.prefix}${key}_t`;
  }

}
