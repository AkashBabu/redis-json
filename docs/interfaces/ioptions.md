[redis-json](../README.md) › [IOptions](ioptions.md)

# Interface: IOptions

JSONCache options

## Hierarchy

* **IOptions**

## Index

### Properties

* [parser](ioptions.md#optional-parser)
* [prefix](ioptions.md#optional-prefix)
* [stringifier](ioptions.md#optional-stringifier)

## Properties

### `Optional` parser

• **parser**? : *[IParser](iparser.md)*

Defined in src/interfaces.ts:42

Parser will be used to convert the string
back to custom object when `get` is called

___

### `Optional` prefix

• **prefix**? : *undefined | string*

Defined in src/interfaces.ts:30

Custom prefix to be used for storage
namespace separation

___

### `Optional` stringifier

• **stringifier**? : *[IStringifier](istringifier.md)*

Defined in src/interfaces.ts:36

Stringifier will be used to convert a custom
object to a string when `set` is called
