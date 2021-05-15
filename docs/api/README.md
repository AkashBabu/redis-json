[redis-json](README.md)

# redis-json

## Index

### Classes

* [JSONCache](classes/jsoncache.md)

### Interfaces

* [IDelOptions](interfaces/ideloptions.md)
* [IOptions](interfaces/ioptions.md)
* [IParser](interfaces/iparser.md)
* [ISetOptions](interfaces/isetoptions.md)
* [IStringifier](interfaces/istringifier.md)

### Type aliases

* [IMulti](README.md#imulti)
* [IMultiCommands](README.md#imulticommands)
* [IPromisified](README.md#ipromisified)
* [IRedisClient](README.md#iredisclient)
* [IRedisMethods](README.md#iredismethods)
* [Methods](README.md#methods)
* [Transaction](README.md#transaction)

## Type aliases

###  IMulti

Ƭ **IMulti**: *function*

Defined in src/lib/jsonCache.types.ts:7

#### Type declaration:

▸ (`commands`: [IMultiCommands](README.md#imulticommands)): *Promise‹any›*

**Parameters:**

Name | Type |
------ | ------ |
`commands` | [IMultiCommands](README.md#imulticommands) |

___

###  IMultiCommands

Ƭ **IMultiCommands**: *Array‹[string, string, any]›*

Defined in src/lib/jsonCache.types.ts:6

___

###  IPromisified

Ƭ **IPromisified**: *function*

Defined in src/lib/jsonCache.types.ts:2

#### Type declaration:

▸ (...`args`: any[]): *Promise‹any›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

___

###  IRedisClient

Ƭ **IRedisClient**: *[IRedisMethods](README.md#iredismethods)*

Defined in src/lib/jsonCache.types.ts:15

___

###  IRedisMethods

Ƭ **IRedisMethods**: *object & object*

Defined in src/lib/jsonCache.types.ts:9

___

###  Methods

Ƭ **Methods**: *"hmset" | "hmget" | "hgetall" | "expire" | "del" | "scan" | "hincrbyfloat"*

Defined in src/lib/jsonCache.types.ts:4

___

###  Transaction

Ƭ **Transaction**: *any*

Defined in src/lib/jsonCache.types.ts:16
