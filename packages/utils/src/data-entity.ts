import { fastMap } from './arrays';
import { isFunction, isPlainObject, parseJSON, getTypeOf } from './utils';

// WeakMaps are used as a memory efficient reference to private data
const _metadata = new WeakMap();

/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations.
 *
 * IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
 * to create DataEntities that are significantly faster (600x-1000x faster).
 */
export class DataEntity<Data extends object = object, Metadata extends object = ConventionalMetadata> {
    /**
     * A utility for safely converting an object a `DataEntity`.
     * If the input is a DataEntity it will return it and have no side-effect.
     * If you want a create new DataEntity from an existing DataEntity
     * either use `new DataEntity` or shallow clone the input before
     * passing it to `DataEntity.make`.
     *
     * NOTE: `DataEntity.make` is different from using `new DataEntity`
     * because it attaching it doesn't shallow cloning the object
     * onto the `DataEntity` instance, this is significatly faster and so it
     * is recommended to use this in production.
     */
    static make<Input extends undefined | null = undefined, Meta extends object = ConventionalMetadata>(
        input: Input,
        metadata?: Meta & ConventionalMetadata
    ): DataEntity<{}, Meta & BuiltinMetadata>;
    static make<Input extends object | DataEntity<object, object>, Meta extends object = ConventionalMetadata>(
        input: Input,
        metadata?: Meta & ConventionalMetadata
    ): Input extends DataEntity<infer U, infer V> ? DataEntity<U, V> : DataEntity<Input, Meta> & Input;
    static make<Input extends object = any, Meta extends object = ConventionalMetadata>(
        input?: any,
        metadata?: Meta & ConventionalMetadata
    ): DataEntity<Input | {}, Meta> {
        if (input == null) {
            return DataEntity.makeRaw(input).entity;
        }
        if (DataEntity.isDataEntity(input)) return input;
        if (!isPlainObject(input)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(input)}"`);
        }

        return DataEntity.makeRaw(input, metadata).entity;
    }

    /**
     * A barebones method for creating data-entities. This does not do type detection
     * and returns both the metadata and entity
     */
    static makeRaw<T extends undefined | null = undefined, M extends ConventionalMetadata = ConventionalMetadata>(
        input?: T,
        metadata?: M & ConventionalMetadata
    ): {
        entity: DataEntity<{}, M>;
        metadata: M & BuiltinMetadata;
    };
    static makeRaw<T extends object = object, M extends ConventionalMetadata = ConventionalMetadata>(
        input: T,
        metadata?: M & ConventionalMetadata
    ): {
        entity: DataEntity<T, M> & T;
        metadata: M & BuiltinMetadata;
    };
    static makeRaw<T extends object = object, M extends ConventionalMetadata = ConventionalMetadata>(
        input?: T,
        metadata?: M & ConventionalMetadata
    ): {
        entity: DataEntity<T | {}, M>;
        metadata: M & BuiltinMetadata;
    } {
        const entity = createEntity(input || {});
        return {
            entity,
            metadata: createMetadata(entity, metadata || ({} as M)),
        };
    }

    /**
     * A utility for safely converting an `Buffer` to a `DataEntity`.
     * @param input A `Buffer` to parse to JSON
     * @param opConfig The operation config used to get the encoding type of the Buffer, defaults to "json"
     * @param metadata Optionally add any metadata
     */
    static fromBuffer<Input extends object = object, Meta extends object = ConventionalMetadata>(
        input: Buffer,
        opConfig?: EncodingConfig,
        metadata?: Meta & ConventionalMetadata
    ): DataEntity<Input, Meta> {
        const { _encoding = 'json' } = opConfig || {};
        if (_encoding === 'json') {
            return DataEntity.make(parseJSON(input), metadata);
        }

        throw new Error(`Unsupported encoding type, got "${_encoding}"`);
    }

    /**
     * A utility for safely converting an input of an object,
     * or an array of objects, to an array of DataEntities.
     * This will detect if passed an already converted input and return it.
     */
    static makeArray<Input extends (object[]) | (DataEntity<object>[]), Meta extends object = ConventionalMetadata>(
        input: Input
    ): Input extends DataEntity<infer U, infer V>[] ? DataEntity<U, V>[] : DataEntity<Input, Meta>[];
    static makeArray<Input extends object | DataEntity<object>, Meta extends object = ConventionalMetadata>(
        input: Input
    ): Input extends DataEntity<infer U, infer V> ? DataEntity<U, V>[] : DataEntity<Input, Meta>[];
    static makeArray<Input extends object = any, Meta extends object = ConventionalMetadata>(input: any): DataEntity<any, any>[] {
        if (!Array.isArray(input)) {
            return [DataEntity.make(input)];
        }

        if (DataEntity.isDataEntityArray(input)) {
            return input;
        }

        return fastMap(input, d => DataEntity.make(d));
    }

    /**
     * Safely get the metadata from a `DataEntity`.
     * If the input is object it will get the property from the object
     */
    static getMetadata<T extends null | undefined>(input: T, key?: any): null;
    static getMetadata<T extends object | DataEntity>(
        input: T,
        key?: GetMetadataKey<InputOrMetadata<T>>
    ): GetMetadataResult<InputOrMetadata<T>, keyof InputOrMetadata<T>>;
    static getMetadata<T extends any>(input: T, key?: any): any | null {
        if (input == null) return null;

        if (DataEntity.isDataEntity(input)) {
            return input.getMetadata(key as any);
        }

        return key ? input[key] : undefined;
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static isDataEntity(input: any): input is DataEntity {
        if (input == null) return false;
        if (input.__isDataEntity) return true;
        return isFunction(input.getMetadata) && isFunction(input.setMetadata) && isFunction(input.toBuffer);
    }

    /**
     * Verify that an input is an Array of `DataEntity`,
     */
    static isDataEntityArray(input: any): input is DataEntity[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        if (input.length === 0) return true;
        return DataEntity.isDataEntity(input[0]);
    }

    [prop: string]: any;

    constructor(data: Data, metadata?: Metadata) {
        if (data && !isPlainObject(data) && !DataEntity.isDataEntity(data)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(data)}"`);
        }

        const entity = createEntity({ ...data });
        createMetadata(entity, metadata || {});
        return entity as DataEntity<Data, Metadata> & ExtendedData<Data>;
    }

    /**
     * Get hidden metadata properties
     */
    getMetadata<K extends GetMetadataKey<Metadata>>(key?: K): GetMetadataResult<Metadata, K> {
        return getMetadata(this, key);
    }

    /**
     * Set hidden metadata properties
     */
    setMetadata(key: SetMetadataKey<Metadata> | string, value: any): void {
        return setMetadata(this, key, value);
    }

    /**
     * Convert the DataEntity to an encoded buffer
     *
     * @param opConfig The operation config used to get the encoding type of the buffer, defaults to "json"
     */
    toBuffer(opConfig?: EncodingConfig): Buffer {
        return toBuffer(this, opConfig);
    }
}

type ExtendedData<Data extends object = object> = { [P in keyof Data]: Data[P] | any };

/** an encoding focused interfaces */
export interface EncodingConfig {
    _op?: string;
    _encoding?: DataEncoding;
}

type InputOrMetadata<T extends object | DataEntity> = T extends DataEntity<any, infer M> ? M : T;

type SetMetadataKey<Meta extends object> = (keyof Meta) | (keyof ConventionalMetadata) | (string | number | symbol);
type GetMetadataKey<Meta extends object> =
    | (keyof BuiltinMetadata)
    | (keyof ConventionalMetadata)
    | (keyof Meta)
    | (string | number | symbol);
type GetMetadataResult<Meta extends object, K extends GetMetadataKey<Meta>> = K extends keyof BuiltinMetadata
    ? BuiltinMetadata[K]
    : K extends keyof Meta
    ? Meta[K]
    : K extends keyof ConventionalMetadata
    ? ConventionalMetadata[K]
    : unknown;

export type BuiltinMetadata = {
    /** The time at which this entity was created */
    readonly _createTime: number;
};

export type ConventionalMetadata = {
    /** A unique key for the data which will be can be used to key the data */
    _key?: string;

    /** The time at which the data was ingested into the source data */
    _ingestTime?: number;

    /** The time at which the data was consumed by the reader */
    _processTime?: number;

    /**
     * The time associated with this data entity,
     * usually off of a specific field on source data or message
     */
    _eventTime?: number;
};

export type DataEntityMetadata<M extends object = object> = BuiltinMetadata & M & ConventionalMetadata & { [prop: string]: any };

/**
 * available data encoding types
 */
export type DataEncoding = 'json';

/**
 * A list of supported encoding formats
 */
export const dataEncodings: DataEncoding[] = ['json'];

export type DataInput = DataEntity | object;
export type DataArrayInput = DataInput | (DataEntity[]) | (object[]);

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

function createEntity<T extends object, M extends ConventionalMetadata>(input: T): DataEntity<T, M & BuiltinMetadata> {
    const entity = input as DataEntity<T, M & BuiltinMetadata>;
    Object.defineProperties(entity, dataEntityProperties);
    return entity;
}

function createMetadata<T extends DataEntity<any, any>, M extends ConventionalMetadata = ConventionalMetadata>(
    entity: T,
    metadata: M
): M & BuiltinMetadata {
    const newMetadata = { _createTime: Date.now(), ...metadata };
    _metadata.set(entity, newMetadata);
    return newMetadata;
}

function getMetadata<T extends DataEntity<any, any>, K>(entity: T, key?: K): any {
    const metadata = _metadata.get(entity);
    if (key != null && metadata) {
        return metadata[key as any];
    }
    return metadata;
}

function setMetadata<T extends DataEntity<any, any>, M extends object, K extends keyof (SetMetadataKey<M>)>(
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

function toBuffer<T extends DataEntity<any, any>>(entity: T, opConfig?: EncodingConfig): Buffer {
    const { _encoding = 'json' } = opConfig || {};
    if (_encoding === 'json') {
        return Buffer.from(JSON.stringify(entity));
    }

    throw new Error(`Unsupported encoding type, got "${_encoding}"`);
}
