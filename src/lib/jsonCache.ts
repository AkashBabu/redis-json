import { flatten, unflatten } from './flat';
import { IOptions, ISetOptions } from './interfaces';
import { promisify } from 'util';

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
  get(key: string, ...fields: string[]): Promise<T | undefined>;
  rewrite(key: string, obj: T): Promise<any>;
  clearAll(): Promise<any>;
}

export default class JSONCache<T> implements IJSONCache<T> {
  private redisClientInt: IRedisClient;

  /**
   * Intializes JSONStore instance
   * @param redisClient IORedis client
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
    const flattened = flatten(obj);

    // this is done to allow storage of empty objects
    flattened.__jc_root__ = '0';

    await this.redisClientInt.hmset(this.getKey(key), flattened);
    if (options.expire)
      await this.redisClientInt.expire(this.getKey(key), options.expire);
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
  public async get(key: string, ...fields: string[]): Promise<T | undefined> {
    const result = await this.redisClientInt[fields.length > 0 ? 'hmget' : 'hgetall'](
      this.getKey(key),
      ...fields,
    );

    // Empty object is returned when
    // the given key is not present
    // in the cache
    if (Object.keys(result || {}).length === 0) {
      return undefined;
    }

    delete result.__jc_root__;

    if (fields.length > 0) {
      return fields.reduce((res, field, i) => {
        res[field] = result[i];
        return res;
      }, {}) as T;
    }

    return unflatten(result) as T;
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

  private getKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }
}
