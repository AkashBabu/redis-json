const flatten = require("flat");
const unflatten = require("flat").unflatten;

class JSONCache {
  /**
   * Intializes JSONStore instance
   * @param {RedisClient} redisClient
   *
   * @constructor
   */
  constructor(redisClient) {
    this.redisClient = redisClient;
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

    // Custom property to check 
    // if the hashset has expired
    flattened._present = 1

    await this.redisClient.hmset.call(this.redisClient, key, flattened)
    if(options.expire) await this.redisClient.expire.call(this.redisClient, key, options.expire)
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
      key
    );

    // Remove the custom property
    delete flattened._present

    return Object.keys(flattened).length ? unflatten(flattened) : undefined
  }

  /**
   * Replace the entire hashset for the given key
   * 
   * @param {String} key Redis key
   * @param {String} obj JSON Object
   */
  async rewrite(key, obj) {
    await this.redisClient.del.call(this.redisClient, key);
    return this.set(key, obj);
  }
}

module.exports = JSONCache;
