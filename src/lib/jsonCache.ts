import { promisify } from 'util';
import { Flattener, IFlattener } from './flattener';
import { IOptions, ISetOptions, IResult } from '../interfaces';

type IPromisified = (...args: any[]) => Promise<any>;

type Methods = 'hmset' | 'hmget' | 'hgetall' | 'expire' | 'del' | 'keys';

type IRedisMethods = {
  [K in Methods]: IPromisified;
};

interface IRedisClient extends IRedisMethods {
  multi: (...args: any[]) => {
    exec: IPromisified;
  };
}

interface IJSONCache<T> {
  set(key: string, obj: T, options: ISetOptions): Promise<any>;
  get(key: string, ...fields: string[]): Promise<Partial<T> | undefined>;
  rewrite(key: string, obj: T): Promise<any>;
  clearAll(): Promise<any>;
}

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
   *      It support any redisClient instance that has
   *      `'hmset' | 'hmget' | 'hgetall' | 'expire' | 'del' | 'keys'`
   *      methods implemented
   * @param options Options for controlling the prefix
   */
  constructor(redisClient: any, private options: IOptions = {}) {
    this.options.prefix = options.prefix || 'jc:';

    this.redisClientInt = {
      hmset: promisify(redisClient.hmset).bind(redisClient),
      hmget: promisify(redisClient.hmget).bind(redisClient),
      hgetall: promisify(redisClient.hgetall).bind(redisClient),
      expire: promisify(redisClient.expire).bind(redisClient),
      del: promisify(redisClient.del).bind(redisClient),
      keys: promisify(redisClient.keys).bind(redisClient),
      multi: redisClient.multi.bind(redisClient),
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
      this.redisClientInt[fields.length > 0 ? 'hmget' : 'hgetall'](
        this.getKey(key),
        ...fields,
      ),

      this.redisClientInt[fields.length > 0 ? 'hmget' : 'hgetall'](
        this.getTypeKey(key),
        ...fields,
      ),
    ]);

    // Empty object is returned when
    // the given key is not present
    // in the cache
    if (!data || Object.keys(data).length === 0) {
      return undefined;
    }

    let result: IResult;
    if (fields.length > 0) {
      result = fields.reduce((res, field, i) => {
        res.data[field] = data[i];
        res.typeInfo[field] = typeInfo[i];

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
  public async rewrite(key: string, obj: T): Promise<any> {
    await this.redisClientInt.del(this.getKey(key));
    await this.set(key, obj);
  }

  /**
   * Removes/deletes all the keys in the JSON Cache,
   * having the prefix.
   */
  public async clearAll(): Promise<any> {
    const keys: string[] = await this.redisClientInt.keys(`${this.options.prefix}*`);

    // Multi command for efficiently executing all the keys at once
    await this.redisClientInt.multi(keys.map(k => ['del', k])).exec();
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
