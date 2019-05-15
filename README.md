# redis-json [![Build Status](https://travis-ci.com/AkashBabu/redis-json.svg?branch=master)](https://travis-ci.com/AkashBabu/redis-json)
Nodejs library to store/retreive JSON Objects in RedisDB

## Description
Every time `set` is called JSON object is flattened(embeded objects are converted to path keys) and then stored in Redis just like a normal hashset, on `get` the hashset is unflattened and converted back to the original JSON object.  
Under the hood it uses [flat](https://www.npmjs.com/package/flat) library for flattening and unflattening JSON objects

## Installation

> npm i redis-json -D

## Usage 

```js
const Redis = require('ioredis');
const redis = new Redis();

const JSONCache = require('redis-json');

const jsonCache = new JSONCache(redis, {prefix: 'cache:'});

const user = {
  name: 'redis-json',
  age: 25,
  address: {
    doorNo: '12B',
    locality: 'pentagon',
    pincode: 123456
  },
  cars: ['BMW 520i', 'Audo A8']
}

await jsonCache.set('123', user)

const response = await jsonCache.get('123')
console.log(response)
// output
// {
//   name: 'redis-json',
//   age: 25,
//   address: {
//     doorNo: '12B',
//     locality: 'pentagon',
//     pincode: 123456
//   },
//   cars: ['BMW 520i', 'Audo A8']
// }

const response = await jsonCache.get('123', 'name', 'age');
// output
// {
//   name: 'redis-json',
//   age: 25,
// }


```

## API
### Constructor
**JSONCache(redisClient, options)**

*redisClient*: RedisClient instance(Preferred ioredis - cient). It support any redisClient instance that has `keys, multi, set, get & del` methods implemented

*options.prefix*: Prefix for redis keys. Defaults to `jc:` (jsonCache)


### Methods

**set(key, jsobObject, options): \<Promise>**

*key*: The redis key that the JSON object has to be stored against.  
*jsonObject*: JSON obejct that needs to be stored.  
*options.expire*: Max time-to-live before key expiry

if the key already exists, and is of type hashset, then the field in JSON object will get updated along with the existing data.


**get(key, ...fields) \<Promise>**

*key*: The redis key in which the JSON object was stored.  
*fields(optional) [New in v2.4.0]*: List of field to be retrieved from the given key. This can be used if the stored object is large and hence helps to reduce Network latency.

Note: if the key is not of type hashset, then redis will through error.


**~~resave~~ rewrite(key, jsonObj): \<Promise>**

*key*: The redis key that whose value needs to be replaced with the new one.
*jsonObject*: JSON obejct that needs to be stored.  

Even if key is not of type hashset, ~~resave~~ rewrite will delete it and update the JSON object in the provided key.

**clearAll(): \<Promise>**

Clears/removes all the keys with the prefix from redis using `multi` command.  
Useful when trying to refresh the entire cache.

## Changelogs
For detailed ChangeLogs please refer [this](https://github.com/AkashBabu/redis-json/blob/master/CHANGELOG.md)

## Mocha & Chai (Testing)
> npm test

## Coverage Report
> npm run coverage

## Contributions
This is open-source, which makes it obvious for any PRs, but I would request you to add necessary test-cases for the same 

## LICENCE

MIT License
