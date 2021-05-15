# redis-json [![npm version](https://badge.fury.io/js/redis-json.svg)](https://badge.fury.io/js/redis-json) [![Build Status](https://travis-ci.com/AkashBabu/redis-json.svg?branch=master)](https://travis-ci.com/AkashBabu/redis-json) [![Coverage Status](https://coveralls.io/repos/github/AkashBabu/redis-json/badge.svg?branch=master)](https://coveralls.io/github/AkashBabu/redis-json?branch=master) [![Maintainability](https://api.codeclimate.com/v1/badges/0015747bb31d085adae8/maintainability)](https://codeclimate.com/github/AkashBabu/redis-json/maintainability)

Nodejs library to store/retrieve JSON Objects in RedisDB without loosing type information, i.e. WYSIWYG (What You Store Is What You Get)

## Description
Every time `set` is called JSON object is flattened(embeded objects are converted to path keys) and then stored in Redis(just like a normal hashset), on `get` the hashset is unflattened and converted back to the original JSON object(with the same types as was in the original object). 

## What's new in v6.0.0?
- In response to issue: [#24](https://github.com/AkashBabu/redis-json/issues/24), we now replace the array in the cache when array is found in `set` object.

If you are on V5 then please check this [Migration Guide to V6](docs/migrationV6.md)

## API

Please visit [this page](docs/api/README.md) for detailed API documentation.

## Usage 

**Simple**
```typescript
import Redis from 'ioredis';
import JSONCache from 'redis-json';

const redis = new Redis() as any;

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

const jsonCache = new JSONCache<typeof user>(redis, {prefix: 'cache:'});


await jsonCache.set('123', user)

await jsonCache.get('123')
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

await jsonCache.set('123', {gender: 'male'})
await jsonCache.get('123')
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
//   gender: 'male'
// }

await jsonCache.get('123', 'name', 'age');
// output
// {
//   name: 'redis-json',
//   age: 25,
// }

await jsonCache.get('123', 'name', 'address.doorNo');
// {
//   name: 'redis-json',
//   address: {
//     doorNo: '12B'
//   }
// }

await jsonCache.clearAll();

await jsonCache.get('123');
// undefined


await jsonCache.incr('123', {age: 1}) // increments age by 1
```

**With custom stringifier and parser:**
```typescript
const jsonCache = new JSONCache(redis, {
  stringifier: {
    Date: (val: Date) => val.toISOString()
  },
  parser: {
    Date: (str: string) => new Date(str)
  }
})

const date = new Date()
await jsonCache.set('test', {
  date: date
})

// Redis hashset
> hgetall jc:test /// data
1) "date"
2) "2020-05-17T14:41:45.861Z"
> hgetall jc:test_t /// type info
1) "date"
2) "Date"


const result = await jsonCache.get('test')
result.date == date /// true
```

**With transactions:**
```typescript
const transaction = redisClient.multi();

transaction
  .set('name', 'foo')
  .set('bar', 'baz')

await jsonCache.set('test', {name: 'testing'}, {transaction})
await jsonCache.del('test1', {transaction})
await jsonCache.rewrite('test2', {name: 'testing', age: 25}, {transaction})

transaction
  .exec(function(err, replies) => {
    /// your logic here after
  })
```
Please note that only `set()`, `rewrite()`, `del()` & `incr()` supports transaction, where as `get()` & `clearAll()` do NOT support transaction because we process those results before returning it to the calling function. Moreover there is no real usecase in supporting transaction in `get()` & `clearAll()` methods!


## Changelogs

Please refer to [this page](https://github.com/AkashBabu/redis-json/blob/master/CHANGELOG.md)

## Coverage Report
> npm run coverage

## Contributions
This is open-source, which makes it obvious for any PRs, but I would request you to add necessary test-cases for the same.

### Pre-requisites:
Run your redis-server and then point the same client to the same. 
An easier way to start redis-server, provided you've already installed `docker` (else visit [this page](https://docs.docker.com/get-docker/)) is by running this command:
> docker run --rm -it --name redis -p 6379:6379 redis

We follow TDD approach, so write your test cases first and then run the same paralelly during development by running the following command:
> npm run test:dev

## LICENCE

MIT License
