---
title: Utils: `ElasticsearchError`
sidebar_label: ElasticsearchError
---

# Interface: ElasticsearchError

## Hierarchy

* `Error`

  * **ElasticsearchError**

### Index

#### Properties

* [Error](elasticsearcherror.md#error)
* [body](elasticsearcherror.md#optional-body)
* [index](elasticsearcherror.md#optional-index)
* [message](elasticsearcherror.md#message)
* [name](elasticsearcherror.md#name)
* [reason](elasticsearcherror.md#optional-reason)
* [stack](elasticsearcherror.md#optional-stack)
* [status](elasticsearcherror.md#optional-status)
* [type](elasticsearcherror.md#optional-type)

#### Methods

* [toJSON](elasticsearcherror.md#tojson)

## Properties

###  Error

• **Error**: *`ErrorConstructor`*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984

___

### `Optional` body

• **body**? : *undefined | object*

*Defined in [errors.ts:341](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L341)*

___

### `Optional` index

• **index**? : *undefined | string*

*Defined in [errors.ts:359](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L359)*

___

###  message

• **message**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [errors.ts:358](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L358)*

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975

___

### `Optional` status

• **status**? : *undefined | number*

*Defined in [errors.ts:356](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L356)*

___

### `Optional` type

• **type**? : *undefined | string*

*Defined in [errors.ts:357](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L357)*

## Methods

###  toJSON

▸ **toJSON**(): *object*

*Defined in [errors.ts:361](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L361)*

**Returns:** *object*