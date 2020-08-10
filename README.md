# redis-json [![npm version](https://badge.fury.io/js/redis-json.svg)](https://badge.fury.io/js/redis-json) [![Build Status](https://travis-ci.com/AkashBabu/redis-json.svg?branch=master)](https://travis-ci.com/AkashBabu/redis-json) [![Coverage Status](https://coveralls.io/repos/github/AkashBabu/redis-json/badge.svg?branch=master)](https://coveralls.io/github/AkashBabu/redis-json?branch=master) [![Maintainability](https://api.codeclimate.com/v1/badges/0015747bb31d085adae8/maintainability)](https://codeclimate.com/github/AkashBabu/redis-json/maintainability)

Nodejs library to store/retreive JSON Objects in RedisDB

## Description
Every time `set` is called JSON object is flattened(embeded objects are converted to path keys) and then stored in Redis(just like a normal hashset), on `get` the hashset is unflattened and converted back to the original JSON object. 

## What's new in v4.0.0?
Following up with [#3](https://github.com/AkashBabu/redis-json/issues/3) & [#8](https://github.com/AkashBabu/redis-json/issues/8) we decided to support types, which means, you get back exactly (===) same object when restored. But as a drawback, each `set` operation would cost 2 hashsets in redis (one for data and the other for type infomation).

Not just that, we also support custom stringifying and parsing logic for Custom Class (For Ex: Date, Person etc).  
Examples for the same is given below.

## Installation

> npm install redis-json --save

## Usage 


```typescript
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

```

With custom stringifier and parser:
```TS
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

## API

Please visit [this page](docs/README.md) for detailed API documentation.

## Since v4.0.0

Types of the data are retained when retrieved from Redis.

## Changelogs

Please refer to [this page](https://github.com/AkashBabu/redis-json/blob/master/CHANGELOG.md)

## Mocha & Chai (Testing)
> npm test

## Coverage Report
> npm run coverage

## Contributions
This is open-source, which makes it obvious for any PRs, but I would request you to add necessary test-cases for the same 

## LICENCE

MIT License
