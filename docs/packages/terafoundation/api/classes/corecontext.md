---
title: Terafoundation: `CoreContext`
sidebar_label: CoreContext
---

# Class: CoreContext <**S, A, D**>

CoreContext

## Type parameters

▪ **S**

▪ **A**

▪ **D**: *string*

## Hierarchy

* **CoreContext**

  * [ClusterContext](clustercontext.md)

  * [ProcessContext](processcontext.md)

## Implements

* object

## Index

### Constructors

* [constructor](corecontext.md#constructor)

### Properties

* [apis](corecontext.md#apis)
* [arch](corecontext.md#arch)
* [assignment](corecontext.md#assignment)
* [cluster](corecontext.md#cluster)
* [cluster_name](corecontext.md#optional-cluster_name)
* [foundation](corecontext.md#foundation)
* [logger](corecontext.md#logger)
* [name](corecontext.md#name)
* [platform](corecontext.md#platform)
* [sysconfig](corecontext.md#sysconfig)

## Constructors

###  constructor

\+ **new CoreContext**(`config`: i.FoundationConfig‹S, A, D›, `cluster`: i.Cluster, `sysconfig`: i.FoundationSysConfig‹S›, `assignment?`: [D](undefined)): *[CoreContext](corecontext.md)*

*Defined in [core-context.ts:23](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | i.FoundationConfig‹S, A, D› |
`cluster` | i.Cluster |
`sysconfig` | i.FoundationSysConfig‹S› |
`assignment?` | [D](undefined) |

**Returns:** *[CoreContext](corecontext.md)*

## Properties

###  apis

• **apis**: *i.ContextAPIs & A*

*Defined in [core-context.ts:16](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L16)*

___

###  arch

• **arch**: *string* =  process.arch

*Defined in [core-context.ts:20](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L20)*

___

###  assignment

• **assignment**: *D*

*Defined in [core-context.ts:22](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L22)*

___

###  cluster

• **cluster**: *i.Cluster*

*Defined in [core-context.ts:14](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L14)*

___

### `Optional` cluster_name

• **cluster_name**? : *undefined | string*

*Defined in [core-context.ts:23](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L23)*

___

###  foundation

• **foundation**: *[LegacyFoundationApis](../interfaces/legacyfoundationapis.md)*

*Defined in [core-context.ts:17](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L17)*

___

###  logger

• **logger**: *Logger*

*Defined in [core-context.ts:18](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L18)*

___

###  name

• **name**: *string*

*Defined in [core-context.ts:19](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L19)*

___

###  platform

• **platform**: *"aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32" | "cygwin"* =  process.platform

*Defined in [core-context.ts:21](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L21)*

___

###  sysconfig

• **sysconfig**: *i.FoundationSysConfig‹S›*

*Defined in [core-context.ts:15](https://github.com/terascope/teraslice/blob/ddd3f0a43/packages/terafoundation/src/core-context.ts#L15)*