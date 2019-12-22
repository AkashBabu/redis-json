# redis-json [![Build Status](https://travis-ci.com/AkashBabu/redis-json.svg?branch=master)](https://travis-ci.com/AkashBabu/redis-json) [![Coverage Status](https://coveralls.io/repos/github/AkashBabu/redis-json/badge.svg?branch=master)](https://coveralls.io/github/AkashBabu/redis-json?branch=master)
Nodejs library to store/retreive JSON Objects in RedisDB

## Description
Every time `set` is called JSON object is flattened(embeded objects are converted to path keys) and then stored in Redis(just like a normal hashset), on `get` the hashset is unflattened and converted back to the original JSON object.  
~~Under the hood it uses [flat](https://www.npmjs.com/package/flat) library for flattening and unflattening JSON objects~~
Now we use our own custom flattening and unflattening logic to accomodate more possibilites and eliminate certain bugs and also to improve efficiency.

We now support typescript since 3.1.0 🎉🎉🎊  
Please see the below updated example.

## Installation

> npm i redis-json -D

## Usage 


```TS
import Redis from 'ioredis';
import JSONCache from 'redis-json';

const redis = new Redis() as any;

const jsonCache = new JSONCache<{
  name: string;
  age: 25;
  address: {
    doorNo: string;
    locality: string;
    pincode: number;
  }
}>(redis, {prefix: 'cache:'});

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
//   age: '25',
//   address: {
//     doorNo: '12B',
//     locality: 'pentagon',
//     pincode: '123456'
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

**new JSONCache<T>(redisClient, options)**

| Param | Description |
|:------|:------------|
| redisClient | RedisClient instance(Preferred ioredis - cient). It support any redisClient instance that has `keys, multi, set, get & del` methods implemented |
| options.prefix | Prefix for redis keys. Defaults to `jc:` (jsonCache) |


### Methods

**set(key: string, jsobObject: T, options): Promise\<any>**

| Param | Description |
|:------|:------------|
| key   | The redis key that the JSON object has to be stored against |
| jsonObject | JSON obejct that needs to be stored |
| options.expire | Max time-to-live before key expiry |

*If the key already exists, and is of type hashset, then the field in JSON object will get updated along with the existing data*


**get(key, ...fields): Promise\<T | undefined>**

| Param | Description |
|:------|:------------|
| key   |The redis key in which the JSON object was stored |
| fields(optional) [New in v2.4.0] | List of field to be retrieved from the given key. This can be used if the stored object is large and hence helps to reduce Network latency |

**~~resave~~ rewrite(key, jsonObj): Promise\<any>**

| Param | Description |
|:------|:------------|
|key | The redis key that whose value needs to be replaced with the new one |
|jsonObject | JSON obejct that needs to be stored |

*Even if key is not of type hashset, ~~resave~~ rewrite will delete it and update the JSON object in the provided key*

**clearAll(): Promise\<any>>**

Clears/removes all the keys with the prefix from redis using `multi` command.  
Useful when trying to refresh the entire cache.

## Caveat

All the values will be parsed to String before saving the same in redis and hence during retreival, we cannot identify the type of data which was saved earlier and hence number will be stringified, whereas the rest of the property types will remain intact(due to internal reverse parsing).  

Below is the table of original type vs retreived type of the object properties

| Original Type | Retreived type |
|:--------------|:---------------|
| string        | string         |
| number        | string         |
| boolean       | boolean        |
| undefined     | undefined      |
| null          | null           |
| object        | object         |
| array         | array          |

Hence make sure to parse the number fields back to number by using a '+' in front of the property like => `+obj.numField` to ensure the numbers as treated as numbers 😜

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
