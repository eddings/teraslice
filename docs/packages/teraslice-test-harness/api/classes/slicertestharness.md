---
title: Teraslice Test Harness: `SlicerTestHarness`
sidebar_label: SlicerTestHarness
---

# Class: SlicerTestHarness

A test harness for testing Operations that run on
the Execution Controller, mainly the Slicer.
This is useful for testing Slicers.

## Hierarchy

* [BaseTestHarness](basetestharness.md)‹*`SlicerExecutionContext`*›

  * **SlicerTestHarness**

### Index

#### Constructors

* [constructor](slicertestharness.md#constructor)

#### Properties

* [context](slicertestharness.md#protected-context)
* [events](slicertestharness.md#events)
* [executionContext](slicertestharness.md#protected-executioncontext)

#### Methods

* [createSlices](slicertestharness.md#createslices)
* [initialize](slicertestharness.md#initialize)
* [makeContextConfig](slicertestharness.md#protected-makecontextconfig)
* [onSliceComplete](slicertestharness.md#onslicecomplete)
* [onSliceDispatch](slicertestharness.md#onslicedispatch)
* [setClients](slicertestharness.md#setclients)
* [setWorkers](slicertestharness.md#setworkers)
* [shutdown](slicertestharness.md#shutdown)
* [slicer](slicertestharness.md#slicer)

#### Object literals

* [stats](slicertestharness.md#stats)

## Constructors

###  constructor

\+ **new SlicerTestHarness**(`job`: `JobConfig`, `options`: [JobHarnessOptions](../interfaces/jobharnessoptions.md)): *[SlicerTestHarness](slicertestharness.md)*

*Overrides [BaseTestHarness](basetestharness.md).[constructor](basetestharness.md#constructor)*

*Defined in [slicer-test-harness.ts:31](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`job` | `JobConfig` |
`options` | [JobHarnessOptions](../interfaces/jobharnessoptions.md) |

**Returns:** *[SlicerTestHarness](slicertestharness.md)*

## Properties

### `Protected` context

• **context**: *`TestContext`*

*Inherited from [BaseTestHarness](basetestharness.md).[context](basetestharness.md#protected-context)*

*Defined in [base-test-harness.ts:26](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/base-test-harness.ts#L26)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [BaseTestHarness](basetestharness.md).[events](basetestharness.md#events)*

*Defined in [base-test-harness.ts:24](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/base-test-harness.ts#L24)*

___

### `Protected` executionContext

• **executionContext**: *`SlicerExecutionContext`*

*Inherited from [BaseTestHarness](basetestharness.md).[executionContext](basetestharness.md#protected-executioncontext)*

*Defined in [base-test-harness.ts:25](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/base-test-harness.ts#L25)*

## Methods

###  createSlices

▸ **createSlices**(): *`Promise<SliceRequest[]>`*

*Defined in [slicer-test-harness.ts:68](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L68)*

Create Slices, always returns an Array of slices or slice requests.
To adjust the number of slicers change the job configuration
when constructing this class.

If the slicers are done, you should expect a null value for every slicer

**Returns:** *`Promise<SliceRequest[]>`*

an array of Slices including the metadata or the just the Slice Request.

▸ **createSlices**(`options`: object): *`Promise<SliceRequest[]>`*

*Defined in [slicer-test-harness.ts:69](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | object |

**Returns:** *`Promise<SliceRequest[]>`*

▸ **createSlices**(`options`: object): *`Promise<Slice[]>`*

*Defined in [slicer-test-harness.ts:70](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | object |

**Returns:** *`Promise<Slice[]>`*

___

###  initialize

▸ **initialize**(`recoveryData?`: object[]): *`Promise<void>`*

*Overrides [BaseTestHarness](basetestharness.md).[initialize](basetestharness.md#initialize)*

*Defined in [slicer-test-harness.ts:45](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L45)*

Initialize the Operations on the ExecutionContext

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | object[] | is an array of starting points to recover from  |

**Returns:** *`Promise<void>`*

___

### `Protected` makeContextConfig

▸ **makeContextConfig**(`job`: `JobConfig`, `assetDir`: string): *`ExecutionContextConfig`*

*Inherited from [BaseTestHarness](basetestharness.md).[makeContextConfig](basetestharness.md#protected-makecontextconfig)*

*Defined in [base-test-harness.ts:58](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/base-test-harness.ts#L58)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`job` | `JobConfig` | - |
`assetDir` | string |  process.cwd() |

**Returns:** *`ExecutionContextConfig`*

___

###  onSliceComplete

▸ **onSliceComplete**(`result`: `SliceResult`): *void*

*Defined in [slicer-test-harness.ts:112](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`result` | `SliceResult` |

**Returns:** *void*

___

###  onSliceDispatch

▸ **onSliceDispatch**(`slice`: `Slice`): *void*

*Defined in [slicer-test-harness.ts:108](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`slice` | `Slice` |

**Returns:** *void*

___

###  setClients

▸ **setClients**(`clients`: `TestClientConfig`[]): *void*

*Inherited from [BaseTestHarness](basetestharness.md).[setClients](basetestharness.md#setclients)*

*Defined in [base-test-harness.ts:47](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/base-test-harness.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`clients` | `TestClientConfig`[] |

**Returns:** *void*

___

###  setWorkers

▸ **setWorkers**(`count`: number): *void*

*Defined in [slicer-test-harness.ts:102](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`count` | number |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Overrides [BaseTestHarness](basetestharness.md).[shutdown](basetestharness.md#shutdown)*

*Defined in [slicer-test-harness.ts:119](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L119)*

Shutdown the Operations on the ExecutionContext

**Returns:** *`Promise<void>`*

___

###  slicer

▸ **slicer**<**T**>(): *`T`*

*Defined in [slicer-test-harness.ts:37](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L37)*

**Type parameters:**

▪ **T**: *`SlicerCore`*

**Returns:** *`T`*

## Object literals

###  stats

### ▪ **stats**: *object*

*Defined in [slicer-test-harness.ts:20](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L20)*

▪ **slices**: *object*

*Defined in [slicer-test-harness.ts:25](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L25)*

* **failed**: *number* = 0

* **processed**: *number* = 0

▪ **workers**: *object*

*Defined in [slicer-test-harness.ts:21](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/teraslice-test-harness/src/slicer-test-harness.ts#L21)*

* **available**: *number* = 1

* **connected**: *number* = 1