/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations.
 *
 * IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
 * to create DataEntities that are significantly faster (600x-1000x faster).
 */
export interface IDataEntityConstructor<Data extends object = object, Metadata extends ConventionalMetadata = ConventionalMetadata> {
    /**
     * A utility for safely converting an object a `DataEntity`.
     * If the input is a DataEntity it will return it and have no side-effect.
     * If you want a create new DataEntity from an existing DataEntity
     * either use `new DataEntity` or shallow clone the input before
     * passing it to `DataEntity.make`.
     *
     * NOTE: `IDataEntity.make` is different from using `new DataEntity`
     * because it attaching it doesn't shallow cloning the object
     * onto the `DataEntity` instance, this is significatly faster and so it
     * is recommended to use this in production.
     */
    make<Input extends undefined | null = undefined, Meta extends ConventionalMetadata = ConventionalMetadata>(
        input: Input,
        metadata?: Meta
    ): IDataEntity<{}, Meta & BuiltinMetadata>;
    make<Input extends object | IDataEntity<object, object>, Meta extends ConventionalMetadata = ConventionalMetadata>(
        input: Input,
        metadata?: Meta
    ): Input extends IDataEntity<infer U, infer V> ? IDataEntity<U, V> : IDataEntity<Input, Meta>;
    make<Input extends object = any, Meta extends ConventionalMetadata = ConventionalMetadata>(
        input?: any,
        metadata?: Meta
    ): IDataEntity<Input | {}, Meta>;

    /**
     * A barebones method for creating data-entities. This does not do type detection
     * and returns both the metadata and entity
     */
    makeRaw<T extends undefined | null = undefined, M extends ConventionalMetadata = ConventionalMetadata>(
        input?: T,
        metadata?: M
    ): {
        entity: IDataEntity<{}, M>;
        metadata: M & BuiltinMetadata;
    };
    makeRaw<T extends object = object, M extends ConventionalMetadata = ConventionalMetadata>(
        input: T,
        metadata?: M
    ): {
        entity: IDataEntity<T, M>;
        metadata: M & BuiltinMetadata;
    };
    makeRaw<T extends object = object, M extends ConventionalMetadata = ConventionalMetadata>(
        input?: T,
        metadata?: M
    ): {
        entity: IDataEntity<T | {}, M>;
        metadata: M & BuiltinMetadata;
    };

    /**
     * A utility for safely converting an `Buffer` to a `DataEntity`.
     * @param input A `Buffer` to parse to JSON
     * @param opConfig The operation config used to get the encoding type of the Buffer, defaults to "json"
     * @param metadata Optionally add any metadata
     */
    fromBuffer<Input extends object = object, Meta extends ConventionalMetadata = ConventionalMetadata>(
        input: Buffer,
        opConfig?: EncodingConfig,
        metadata?: Meta
    ): IDataEntity<Input, Meta>;

    /**
     * A utility for safely converting an input of an object,
     * or an array of objects, to an array of DataEntities.
     * This will detect if passed an already converted input and return it.
     */
    makeArray<Input extends (object[]) | (IDataEntity<object>[]), Meta extends ConventionalMetadata = ConventionalMetadata>(
        input: Input
    ): Input extends IDataEntity<infer U, infer V>[] ? IDataEntity<U, V>[] : IDataEntity<Input, Meta>[];
    makeArray<Input extends object | IDataEntity<object>, Meta extends ConventionalMetadata = ConventionalMetadata>(
        input: Input
    ): Input extends IDataEntity<infer U, infer V> ? IDataEntity<U, V>[] : IDataEntity<Input, Meta>[];
    makeArray<Input extends object = any, Meta extends ConventionalMetadata = ConventionalMetadata>(input: any): IDataEntity<any, any>[];

    /**
     * Safely get the metadata from a `DataEntity`.
     * If the input is object it will get the property from the object
     */
    getMetadata<T extends null | undefined>(input: T, key?: any): null;
    getMetadata<T extends object | IDataEntity>(
        input: T,
        key?: GetMetadataKey<InputOrMetadata<T>>
    ): GetMetadataResult<InputOrMetadata<T>, keyof InputOrMetadata<T>>;
    getMetadata<T extends any>(input: T, key?: any): any | null;

    /**
     * Verify that an input is the `DataEntity`
     */
    isDataEntity(input: any): input is IDataEntity;

    /**
     * Verify that an input is an Array of `DataEntity`,
     */
    isDataEntityArray(input: any): input is IDataEntity[];

    new (data: Data, metadata?: Metadata): IDataEntity<Data, Metadata>;
}

export type IDataEntity<Input extends object = object, Meta extends ConventionalMetadata = ConventionalMetadata> = {
    readonly __isDataEntity: true;
    /**
     * Get hidden metadata properties
     */
    getMetadata<K extends GetMetadataKey<Meta>>(key?: K): GetMetadataResult<Meta, K>;

    /**
     * Set hidden metadata properties
     */
    setMetadata(key: SetMetadataKey<Meta> | string, value: any): void;

    /**
     * Convert the IDataEntity to an encoded buffer
     *
     * @param opConfig The operation config used to get the encoding type of the buffer, defaults to "json"
     */
    toBuffer(opConfig?: EncodingConfig): Buffer;
} & Input & { [prop: string]: any };

/** an encoding focused interfaces */
export interface EncodingConfig {
    _op?: string;
    _encoding?: DataEncoding;
}

export type InputOrMetadata<T extends object | IDataEntity> = T extends IDataEntity<any, infer M> ? M : T;

export type SetMetadataKey<Meta extends ConventionalMetadata> = (keyof Meta) | (string | number | symbol);
export type GetMetadataKey<Meta extends ConventionalMetadata> = (keyof BuiltinMetadata) | (keyof Meta) | (string | number | symbol);
export type GetMetadataResult<Meta extends ConventionalMetadata, K extends GetMetadataKey<Meta>> = K extends keyof BuiltinMetadata
    ? BuiltinMetadata[K]
    : K extends keyof Meta
    ? Meta[K]
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

/**
 * available data encoding types
 */
export type DataEncoding = 'json';

/** A list of supported encoding formats */
export const dataEncodings: DataEncoding[] = ['json'];
