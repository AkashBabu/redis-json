import { promisify } from 'util';
import { Flattener, IFlattener } from './flattener';
import type { IResult, RecursivePartial } from '../interfaces';
import { TYPE } from '../utils/type';
import type { IOptions, ISetOptions, IDelOptions, IMultiCommands, IRedisClient, Transaction } from './jsonCache.types';
import Config from './config';

interface IJSONCache<T> {
  set(key: string, obj: T, options: ISetOptions): Promise<any>;

  get(key: string): Promise<T | undefined>;
  get(key: string, ...fields: string[]): Promise<Partial<T> | undefined>;

  rewrite(key: string, obj: T, options?: ISetOptions): Promise<any>;
  clearAll(): Promise<any>;
  del(key: string, options?: IDelOptions): Promise<any>;
  incr(key: string, obj: RecursivePartial<T>, options?: IDelOptions): Promise<any>;
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
  // Redis Client internal -> Has limited access to commands
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
      multi: (commands: IMultiCommands) => {
        return new Promise((resolve, reject) => {
          redisClient.multi(commands).exec((err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
      },
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

    const commands: IMultiCommands = await this.getKeysToBeRemoved(key, flattened);

    this.addSetCommands(key, flattened, commands, options.expire);
    await this.execCommand(commands, options.transaction);
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
  public async get(key: string): Promise<T | undefined>;
  public async get(key: string, ...fields: string[]): Promise<Partial<T> | undefined>;
  public async get(key: string, ...fields: string[]): Promise<Partial<T> | undefined> {
    const [data, typeInfo] = await Promise.all([
      this.redisClientInt.hgetall(this.getKey(key)),
      this.redisClientInt.hgetall(this.getTypeKey(key)),
    ]);

    // Empty object is returned when
    // the given key is not present
    // in the cache
    if (!(data && typeInfo)) {
      return undefined;
    }

    const dataKeysLen = Object.keys(data).length;
    const typeInfoKeysLen = Object.keys(typeInfo).length;
    if (dataKeysLen !== typeInfoKeysLen || dataKeysLen === 0 ) return undefined;

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
      result = { data, typeInfo, arrayInfo: {} };
    }

    return this.flattener.unflatten(result) as T;
  }

  /**
   * Replace the entire hashset for the given key
   *
   * @param key Redis key
   * @param obj JSON Object of type T
   */
  public async rewrite(key: string, obj: T, options: ISetOptions = {}): Promise<any> {
    const commands: IMultiCommands = [
      ['del', this.getKey(key)],
      ['del', this.getTypeKey(key)],
    ];

    const flattened = this.flattener.flatten(obj);
    this.addSetCommands(key, flattened, commands, options.expire);
    await this.execCommand(commands, options.transaction);
  }

  /**
   * Removes/deletes all the keys in the JSON Cache,
   * having the prefix.
   */
  public async clearAll(): Promise<any> {
    let cursor = '0';
    let keys: string[];

    do {
      [cursor, keys] = await this.redisClientInt.scan(
        cursor, 'MATCH', `${this.options.prefix}*`, 'COUNT', Config.SCAN_COUNT,
      );

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
  public async del(key: string, options: IDelOptions = {}): Promise<any> {
    const commands: IMultiCommands = [
      ['del', this.getKey(key)],
      ['del', this.getTypeKey(key)],
    ];
    await this.execCommand(commands, options.transaction);
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
  public async incr(key: string, obj: RecursivePartial<T>, options: IDelOptions = {}): Promise<any> {
    const flattened = this.flattener.flatten(obj);

    const commands: IMultiCommands = [];
    Object.entries(flattened.data).forEach(([path, incrVal]) => {

      // This check is needed to avoid redis errors.
      // It also helps while the user wants to increment the value
      // within an array.
      // Ex: rand: [null, null, 1] => this will increment the 3rd index by 1
      if (flattened.typeInfo[path] !== TYPE.NUMBER) {
        return;
      }

      commands.push(['hincrbyfloat', this.getKey(key), path, incrVal]);
    });

    await this.execCommand(commands, options.transaction);
  }

  /******************
   * PRIVATE METHODS
   ******************/

  private async getKeysToBeRemoved(key: string, flattened: IResult): Promise<IMultiCommands> {
    const commands: IMultiCommands = [];

    // Check if the given obj has arrays and if it does
    // then we must remove the current array stored in
    // Cache and then set this array in the Cache
    if (Object.keys(flattened.arrayInfo).length > 0) {
      const currentObj = await this.get(key);
      if (currentObj) {
        const currrentObjFlattened = this.flattener.flatten(currentObj).data;
        const keysToBeRemoved: string[] = [];

        // Get all paths matching the parent array path
        Object.keys(flattened.arrayInfo).forEach(path => {
          Object.keys(currrentObjFlattened).forEach(objPath => {
            if (objPath.startsWith(path)) {
              keysToBeRemoved.push(objPath);
            }
          });
        });

        if (keysToBeRemoved.length > 0) {
          commands.push(['hdel', this.getKey(key), ...keysToBeRemoved]);
          commands.push(['hdel', this.getTypeKey(key), ...keysToBeRemoved]);
        }
      }
    }

    return commands;
  }

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

  /**
   * Will add Set commands to the given array
   * This logic was separated to remove code duplication
   * in set & rewrite methods
   *
   * @param key Storage key
   * @param flattened Flattened object containing data & typeInfo
   * @param commands List of commands to which set commands has to be appended
   * @param expire Redis Key expiry
   */
  private addSetCommands(key: string, flattened: IResult, commands: IMultiCommands, expire?: number): IMultiCommands {
    commands.push(['hmset', this.getKey(key), flattened.data]);
    commands.push(['hmset', this.getTypeKey(key), flattened.typeInfo]);

    if (expire) {
      commands.push(['expire', this.getKey(key), expire]);
      commands.push(['expire', this.getTypeKey(key), expire]);
    }

    return commands;
  }

  private execTransactionCommands(commands: IMultiCommands, transaction: Transaction) {
    commands.forEach(command => {
      const [action, ...args] = command;
      transaction[action](...args);
    });
  }

  private async execCommand(commands: IMultiCommands, transaction?: Transaction): Promise<any> {
    if (transaction) {
      this.execTransactionCommands(commands, transaction);
      return transaction;
    } else {
      const result = await this.redisClientInt.multi(commands);
      return result;
    }
  }
}
