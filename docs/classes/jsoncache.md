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
* [get](jsoncache.md#get)
* [rewrite](jsoncache.md#rewrite)
* [set](jsoncache.md#set)

## Constructors

###  constructor

\+ **new JSONCache**(`redisClient`: any, `options`: [IOptions](../interfaces/ioptions.md)): *[JSONCache](jsoncache.md)*

Defined in src/lib/jsonCache.ts:54

Intializes JSONCache instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`redisClient` | any | - | RedisClient instance(Preferred ioredis - cient).      It support any redisClient instance that has      `'hmset' | 'hmget' | 'hgetall' | 'expire' | 'del' | 'keys'`      methods implemented |
`options` | [IOptions](../interfaces/ioptions.md) |  {} | Options for controlling the prefix  |

**Returns:** *[JSONCache](jsoncache.md)*

## Methods

###  clearAll

▸ **clearAll**(): *Promise‹any›*

Defined in src/lib/jsonCache.ts:170

Removes/deletes all the keys in the JSON Cache,
having the prefix.

**Returns:** *Promise‹any›*

___

###  get

▸ **get**(`key`: string, ...`fields`: string[]): *Promise‹Partial‹T› | undefined›*

Defined in src/lib/jsonCache.ts:115

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

###  rewrite

▸ **rewrite**(`key`: string, `obj`: T): *Promise‹any›*

Defined in src/lib/jsonCache.ts:161

Replace the entire hashset for the given key

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`key` | string | Redis key |
`obj` | T | JSON Object of type T  |

**Returns:** *Promise‹any›*

___

###  set

▸ **set**(`key`: string, `obj`: T, `options`: [ISetOptions](../interfaces/isetoptions.md)): *Promise‹any›*

Defined in src/lib/jsonCache.ts:89

Flattens the given json object and
stores it in Redis hashset

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`key` | string | - | Redis key |
`obj` | T | - | JSON object to be stored |
`options` | [ISetOptions](../interfaces/isetoptions.md) |  {} |   |

**Returns:** *Promise‹any›*
