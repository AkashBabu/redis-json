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
   * @param {...String} fields List of fields to be retreived from redis.
   *    This helps reduce network latency incase only a few fields are
   *    needed.
   *
   * @returns {Promise<Object>}
   */
  async get(key, ...fields) {
    const result = await this.redisClient[fields.length > 0 ? 'hmget' : 'hgetall'].call(
      this.redisClient,
      this.getKey(key),
      ...fields
    );

    if(fields.length > 0) {
      return fields.reduce((res, field, i) => {
        res[field] = result[i]
        return res;
      }, {})
    }

    return Object.keys(result).length ? unflatten(result) : undefined;
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

  /**
   * Removes/deletes all the keys in the JSON Cache,
   * having the prefix.
   */
  async clearAll() {
    const keys = await this.redisClient.keys.call(this.redisClient, `${this.prefix}*`)

    // Multi command for efficiently all the keys at once
    await this.redisClient.multi(keys.map(k => ['del', k])).exec()
  }
}

module.exports = JSONCache;
