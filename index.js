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
   */
  set(key, obj) {
    const flattened = flatten(obj);

    return this.redisClient.hmset.call(this.redisClient, key, flattened);
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
    return unflatten(flattened);
  }
  // async get(key) {
  // }

  /**
   *
   * @param {String} key Redis key
   * @param {String} obj JSON Object
   */
  async rewrite(key, obj) {
    await this.redisClient.del.call(this.redisClient, key);
    this.set(key, obj);
  }
}

module.exports = JSONCache;
