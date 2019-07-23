---
title: Teraslice State Storage: `ESCachedStateStorage`
sidebar_label: ESCachedStateStorage
---

# Class: ESCachedStateStorage

## Hierarchy

* **ESCachedStateStorage**

### Index

#### Constructors

* [constructor](escachedstatestorage.md#constructor)

#### Properties

* [cache](escachedstatestorage.md#cache)

#### Methods

* [count](escachedstatestorage.md#count)
* [get](escachedstatestorage.md#get)
* [initialize](escachedstatestorage.md#initialize)
* [mget](escachedstatestorage.md#mget)
* [mset](escachedstatestorage.md#mset)
* [set](escachedstatestorage.md#set)
* [shutdown](escachedstatestorage.md#shutdown)

## Constructors

###  constructor

\+ **new ESCachedStateStorage**(`client`: `Client`, `logger`: `Logger`, `config`: [ESStateStorageConfig](../interfaces/esstatestorageconfig.md)): *[ESCachedStateStorage](escachedstatestorage.md)*

*Defined in [elasticsearch-state-storage/index.ts:18](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`logger` | `Logger` |
`config` | [ESStateStorageConfig](../interfaces/esstatestorageconfig.md) |

**Returns:** *[ESCachedStateStorage](escachedstatestorage.md)*

## Properties

###  cache

• **cache**: *[CachedStateStorage](cachedstatestorage.md)*

*Defined in [elasticsearch-state-storage/index.ts:18](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L18)*

## Methods

###  count

▸ **count**(): *number*

*Defined in [elasticsearch-state-storage/index.ts:169](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L169)*

**Returns:** *number*

___

###  get

▸ **get**(`doc`: `DataEntity`): *`Promise<DataEntity<object>>`*

*Defined in [elasticsearch-state-storage/index.ts:105](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *`Promise<DataEntity<object>>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Defined in [elasticsearch-state-storage/index.ts:173](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L173)*

**Returns:** *`Promise<void>`*

___

###  mget

▸ **mget**(`docArray`: `DataEntity`[], `mapperFn`: `(Anonymous function)`): *`Promise<object>`*

*Defined in [elasticsearch-state-storage/index.ts:113](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L113)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`docArray` | `DataEntity`[] | - |
`mapperFn` | `(Anonymous function)` |  (doc: DataEntity) => doc |

**Returns:** *`Promise<object>`*

___

###  mset

▸ **mset**(`docArray`: `DataEntity`[], `keyField?`: undefined | string): *`Promise<void | [void, (DataEntity<object> | ESQuery)[][]]>`*

*Defined in [elasticsearch-state-storage/index.ts:161](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L161)*

**Parameters:**

Name | Type |
------ | ------ |
`docArray` | `DataEntity`[] |
`keyField?` | undefined \| string |

**Returns:** *`Promise<void | [void, (DataEntity<object> | ESQuery)[][]]>`*

___

###  set

▸ **set**(`doc`: `DataEntity`): *`Promise<void>`*

*Defined in [elasticsearch-state-storage/index.ts:156](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L156)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `DataEntity` |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [elasticsearch-state-storage/index.ts:177](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-state-storage/src/elasticsearch-state-storage/index.ts#L177)*

**Returns:** *`Promise<void>`*