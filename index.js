const flatten = require('flat')
const unflatten = flatten.unflatten

class JSONCache {
  /**
   * Intializes JSONStore instance
   * @param {RedisClient} redisClient
   *
   * @constructor
   */
  constructor(redisClient, { prefix = 'jc:' } = {}) {
    this.redisClient = redisClient;
    this.prefix = prefix
  }

  getKey(key) {
    return `${this.prefix}${key}`
  }

  /**
   * Flattens the given json object and
   * stores it in Redis hashset
   *
   * @param {String} key Redis key
   * @param {Object} obj JSON object to be stored
   * @param {Options} options
   *
   * @typedef {Object} Options
   * @property {Number} expire Max time in seconds for the key to live
   */
  async set(key, obj, options = {}) {
    const flattened = flatten(obj);
    
    await this.redisClient.hmset.call(this.redisClient, this.getKey(key), flattened);
    if (options.expire)
      await this.redisClient.expire.call(this.redisClient, this.getKey(key), options.expire);
  }

  /**
   * Retrieves the hashset from redis and
   * unflattens it back to the original Object
   *
   * @param {String} key Redis key
   *
   * @returns {Object}
   */
  async get(key) {
    const flattened = await this.redisClient.hgetall.call(
      this.redisClient,
      this.getKey(key)
    );

    return Object.keys(flattened).length ? unflatten(flattened) : undefined;
  }

  /**
   * Replace the entire hashset for the given key
   *
   * @param {String} key Redis key
   * @param {String} obj JSON Object
   */
  async rewrite(key, obj) {
    await this.redisClient.del.call(this.redisClient, this.getKey(key));
    await this.set(key, obj);
  }
}

module.exports = JSONCache;
