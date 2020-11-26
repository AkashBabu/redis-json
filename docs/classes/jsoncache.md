[redis-json](../README.md) › [JSONCache](jsoncache.md)

# Class: JSONCache <**T**>

JSONCache eases the difficulties in storing a JSON in redis.

 It stores the JSON in hashset for simpler get and set of required
fields. It also allows you to override/set specific fields in
the JSON without rewriting the whole JSON tree. Which means that it
is literally possible to `Object.deepAssign()`.

  Everytime you store an object, JSONCache would store two hashset
in Redis, one for data and the other for type information. This helps
during retrieval of data, to restore the type of data which was originally
provided. All these workaround are needed because Redis DOES NOT support
any other data type apart from String.

Well the easiest way is to store an object in Redis is
JSON.stringify(obj) and store the stringified result.
But this can cause issue when the obj is
too huge or when you would want to retrieve only specific fields
from the JSON but do not want to parse the whole JSON.
  Also note that this method would end up in returing all the
fields as strings and you would have no clue to identify the type of
field.

## Type parameters

▪ **T**

## Hierarchy

* **JSONCache**

## Implements

* IJSONCache‹T›

## Index

### Constructors

* [constructor](jsoncache.md#constructor)

### Methods

* [clearAll](jsoncache.md#clearall)
* [del](jsoncache.md#del)
* [delT](jsoncache.md#delt)
* [get](jsoncache.md#get)
* [incr](jsoncache.md#incr)
* [incrT](jsoncache.md#incrt)
* [rewrite](jsoncache.md#rewrite)
* [rewriteT](jsoncache.md#rewritet)
* [set](jsoncache.md#set)
* [setT](jsoncache.md#sett)

## Constructors

###  constructor

\+ **new JSONCache**(`redisClient`: any, `options`: [IOptions](../interfaces/ioptions.md)): *[JSONCache](jsoncache.md)*

Defined in src/lib/jsonCache.ts:67

Intializes JSONCache instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`redisClient` | any | - | RedisClient instance(Preferred ioredis - cient).      It supports any redisClient instance that has      `'hmset' | 'hmget' | 'hgetall' | 'expire' | 'del' | 'keys'`      methods implemented |
`options` | [IOptions](../interfaces/ioptions.md) |  {} | Options for controlling the prefix  |

**Returns:** *[JSONCache](jsoncache.md)*

## Methods

###  clearAll

▸ **clearAll**(): *Promise‹any›*

Defined in src/lib/jsonCache.ts:218

Removes/deletes all the keys in the JSON Cache,
having the prefix.

**Returns:** *Promise‹any›*

___

###  del

▸ **del**(`key`: string): *Promise‹any›*

Defined in src/lib/jsonCache.ts:243

Removes the given key from Redis

Please use this method instead of
directly using `redis.del` as this method
ensures that even the corresponding type info
is removed. It also ensures that prefix is
added to key, ensuring no other key is
removed unintentionally

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | string | Redis key  |

**Returns:** *Promise‹any›*

___

###  delT

▸ **delT**(`transaction`: Transaction, `key`: string): *Transaction*

Defined in src/lib/jsonCache.ts:264

Removes the given key from Redis
using the given transaction

Please use this method instead of
directly using `redis.del` as this method
ensures that even the corresponding type info
is removed. It also ensures that prefix is
added to key, ensuring no other key is
removed unintentionally

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`transaction` | Transaction | Redis transaction |
`key` | string | Redis key  |

**Returns:** *Transaction*

___

###  get

▸ **get**(`key`: string, ...`fields`: string[]): *Promise‹Partial‹T› | undefined›*

Defined in src/lib/jsonCache.ts:151

Retrieves the hashset from redis and
unflattens it back to the original Object

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | string | Redis key |
`...fields` | string[] | List of fields to be retreived from redis.    This helps reduce network latency incase only a few fields are    needed.  |

**Returns:** *Promise‹Partial‹T› | undefined›*

request object from the cache

___

###  incr

▸ **incr**(`key`: string, `obj`: RecursivePartial‹T›): *Promise‹any›*

Defined in src/lib/jsonCache.ts:286

Increments the value of a variable in the JSON
Note: You can increment multiple variables in the
same command (Internally it will split it into multiple
commands on the RedisDB)

**`example`** 
```JS
await jsonCache.incr(key, {messages: 10, profile: {age: 1}})
```

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | string | Redis Cache key |
`obj` | RecursivePartial‹T› | Partial object specifying the path to the required              variable along with value  |

**Returns:** *Promise‹any›*

___

###  incrT

▸ **incrT**(`transaction`: Transaction, `key`: string, `obj`: RecursivePartial‹T›): *Transaction*

Defined in src/lib/jsonCache.ts:303

**Parameters:**

Name | Type |
------ | ------ |
`transaction` | Transaction |
`key` | string |
`obj` | RecursivePartial‹T› |

**Returns:** *Transaction*

___

###  rewrite

▸ **rewrite**(`key`: string, `obj`: T, `options?`: [ISetOptions](../interfaces/isetoptions.md)): *Promise‹any›*

Defined in src/lib/jsonCache.ts:197

Replace the entire hashset for the given key

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | string | Redis key |
`obj` | T | JSON Object of type T  |
`options?` | [ISetOptions](../interfaces/isetoptions.md) | - |

**Returns:** *Promise‹any›*

___

###  rewriteT

▸ **rewriteT**(`transaction`: Transaction, `key`: string, `obj`: T, `options?`: [ISetOptions](../interfaces/isetoptions.md)): *Transaction*

Defined in src/lib/jsonCache.ts:209

Replace the entire hashset for the given key

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`transaction` | Transaction | Redis transaction |
`key` | string | Redis key |
`obj` | T | JSON Object of type T  |
`options?` | [ISetOptions](../interfaces/isetoptions.md) | - |

**Returns:** *Transaction*

___

###  set

▸ **set**(`key`: string, `obj`: T, `options`: [ISetOptions](../interfaces/isetoptions.md)): *Promise‹any›*

Defined in src/lib/jsonCache.ts:102

Flattens the given json object and
stores it in Redis hashset

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`key` | string | - | Redis key |
`obj` | T | - | JSON object to be stored |
`options` | [ISetOptions](../interfaces/isetoptions.md) |  {} |   |

**Returns:** *Promise‹any›*

___

###  setT

▸ **setT**(`transaction`: Transaction, `key`: string, `obj`: T, `options`: [ISetOptions](../interfaces/isetoptions.md)): *Transaction*

Defined in src/lib/jsonCache.ts:127

Flattens the given json object and
stores it in Redis hashset using
the given transaction

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`transaction` | Transaction | - | redis transaction |
`key` | string | - | Redis key |
`obj` | T | - | JSON object to be stored |
`options` | [ISetOptions](../interfaces/isetoptions.md) |  {} |   |

**Returns:** *Transaction*
