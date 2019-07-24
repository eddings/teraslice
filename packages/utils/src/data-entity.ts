import { fastMap } from './arrays';
import { isFunction, isPlainObject, parseJSON, getTypeOf } from './utils';
import * as i from './data-entity-interfaces';
import { AnyObject } from './interfaces';

// WeakMaps are used as a memory efficient reference to private data
const _metadata = new WeakMap<DataEntity, i.BuiltinMetadata & i.ConventionalMetadata & AnyObject>();

// @ts-ignore
const DataEntity: i.IDataEntityConstructor = function _DataEntity<
    T extends object = object,
    M extends i.ConventionalMetadata = i.ConventionalMetadata
>(input: T, metadata?: M): i.IDataEntityConstructor<T, M> {
    return makeRaw({ ...input }, metadata).entity;
};

DataEntity.make = make;
DataEntity.makeArray = makeArray;
DataEntity.makeRaw = makeRaw;
DataEntity.isDataEntity = isDataEntity;
DataEntity.isDataEntityArray = isDataEntityArray;
DataEntity.getMetadata = getMetadataFromAny;
DataEntity.fromBuffer = fromBuffer;

function isDataEntity(input: any): input is DataEntity {
    if (input == null) return false;
    if (input.__isDataEntity) return true;
    return isFunction(input.getMetadata) && isFunction(input.setMetadata) && isFunction(input.toBuffer);
}

function isDataEntityArray(input: any): input is DataEntity[] {
    if (input == null) return false;
    if (!Array.isArray(input)) return false;
    if (input.length === 0) return true;
    return DataEntity.isDataEntity(input[0]);
}

function make(input: any, metadata?: any): any {
    if (input == null) {
        return DataEntity.makeRaw(input).entity;
    }
    if (DataEntity.isDataEntity(input)) return input;
    if (!isPlainObject(input)) {
        throw new Error(`Invalid data source, must be an object, got "${getTypeOf(input)}"`);
    }

    return DataEntity.makeRaw(input, metadata).entity;
}

function makeArray(input: any): any {
    if (!Array.isArray(input)) {
        return [DataEntity.make(input)];
    }

    if (DataEntity.isDataEntityArray(input)) {
        return input;
    }

    return fastMap(input, d => DataEntity.make(d));
}

function makeRaw<T extends object, M extends i.ConventionalMetadata = i.ConventionalMetadata>(
    input: T,
    metadata?: M
): { entity: DataEntity<T, M>; metadata: M & i.BuiltinMetadata } {
    const entity = createEntity(input || {});
    return {
        entity,
        metadata: createMetadata(entity, metadata || ({} as M)),
    };
}

const dataEntityProperties = {
    __isDataEntity: {
        value: true,
        enumerable: false,
        writable: false,
    },
    getMetadata: {
        value(key?: any) {
            return getMetadata(this as any, key);
        },
        enumerable: false,
        writable: false,
    },
    setMetadata: {
        value(key: any, value: any) {
            return setMetadata(this as any, key, value);
        },
        enumerable: false,
        writable: false,
    },
    toBuffer: {
        value(opConfig: any) {
            return toBuffer(this as any, opConfig);
        },
        enumerable: false,
        writable: false,
    },
};

function createEntity<T extends object, M extends i.ConventionalMetadata>(input: T): i.IDataEntity<T, M & i.BuiltinMetadata> {
    const entity = input as i.IDataEntity<T, M & i.BuiltinMetadata>;
    Object.defineProperties(entity, dataEntityProperties);
    return entity;
}

function createMetadata<T extends i.IDataEntity<any, any>, M extends i.ConventionalMetadata = i.ConventionalMetadata>(
    entity: T,
    metadata: M
): M & i.BuiltinMetadata {
    const newMetadata = { _createTime: Date.now(), ...metadata };
    _metadata.set(entity, newMetadata);
    return newMetadata;
}

export { DataEntity };

function getMetadataFromAny(input: any, key?: any): any | null {
    if (input == null) return null;

    if (DataEntity.isDataEntity(input)) {
        return input.getMetadata(key as any);
    }

    return key ? input[key] : undefined;
}

function getMetadata<T extends i.IDataEntity<any, any>, K>(entity: T, key?: K): any {
    const metadata = _metadata.get(entity);
    if (key != null && metadata) {
        return metadata[key as any];
    }
    return metadata;
}

export type DataInput = i.IDataEntity | object;
export type DataArrayInput = DataInput | (i.IDataEntity[]) | (object[]);

function setMetadata<T extends i.IDataEntity<any, any>, M extends object, K extends keyof (i.SetMetadataKey<M>)>(
    entity: T,
    key: K | any,
    value: any
): void {
    if (key === '_createTime') {
        throw new Error(`Cannot set readonly metadata property ${key}`);
    }

    const metadata = _metadata.get(entity) as any;
    metadata[key] = value;
    _metadata.set(entity, metadata);
}

function fromBuffer(input: any, opConfig: any, metadata: any): any {
    const { _encoding = 'json' } = opConfig || {};
    if (_encoding === 'json') {
        return DataEntity.make(parseJSON(input), metadata);
    }

    throw new Error(`Unsupported encoding type, got "${_encoding}"`);
}

function toBuffer<T extends i.IDataEntity<any, any>>(entity: T, opConfig: i.EncodingConfig): Buffer {
    const { _encoding = 'json' } = opConfig;
    if (_encoding === 'json') {
        return Buffer.from(JSON.stringify(entity));
    }

    throw new Error(`Unsupported encoding type, got "${_encoding}"`);
}
