import get from 'lodash.get';
import set from 'lodash.set';
import { fastAssign, fastMap } from '../utils';

// WeakMaps are used as a memory efficient reference to private data
const _metadata = new WeakMap();

/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations
 */

export default class DataEntity {
    /**
     * A utility for safely converting an object a DataEntity.
     * This will detect if passed an already converted input and return it.
    */
    static make(input: DataInput, metadata?: object): DataEntity {
        if (DataEntity.isDataEntity(input)) {
            return input;
        }
        return new DataEntity(input, metadata);
    }

    /**
     * A utility for safely converting an input of an object,
     * or an array of objects, to an array of DataEntities.
     * This will detect if passed an already converted input and return it.
    */
    static makeArray(input: DataInput|DataInput[]): DataEntity[] {
        if (!Array.isArray(input)) {
            return [DataEntity.make(input)];
        }

        if (DataEntity.isDataEntityArray(input)) {
            return input;
        }

        return fastMap(input, (d) => DataEntity.make(d)) as DataEntity[];
    }

    /**
     * Verify that an input is the DataEntity
    */
    static isDataEntity(input: any): input is DataEntity {
        if (input == null) return false;
        if (input instanceof DataEntity) return true;
        if (typeof input.getMetadata === 'function') return true;
        return false;
    }

    /**
     * Verify that an input is an Array of DataEntities,
    */
    static isDataEntityArray(input: any): input is DataEntity[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        return DataEntity.isDataEntity(input[0]);
    }

    /**
     * Safely get the metadata from a DataEntity.
     * If the input is object it will get the property from the object
    */
    static getMetadata(input: DataInput, key: string): any {
        if (input == null) return null;

        if (DataEntity.isDataEntity(input)) {
            return input.getMetadata(key);
        }

        return get(input, key);
    }

    // Add the ability to specify any additional properties
    [prop: string]: any;

    constructor(data: object, metadata?: object) {
        _metadata.set(this, fastAssign({ createdAt: Date.now() }, metadata));

        fastAssign(this, data);
    }

    getMetadata(key?: string): DataEntityMetadata|any {
        const metadata = _metadata.get(this) as DataEntityMetadata;
        if (key) {
            return get(metadata, key);
        }
        return metadata;
    }

    setMetadata(key: string, value: any): void {
        const readonlyMetadataKeys: string[] = ['createdAt'];
        if (readonlyMetadataKeys.includes(key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        const metadata = _metadata.get(this) as DataEntityMetadata;
        _metadata.set(this, set(metadata, key, value));
    }

    toJSON(withMetadata?: boolean): object {
        if (withMetadata) {
            const metadata = _metadata.get(this) as DataEntityMetadata;
            return {
                data: this,
                metadata,
            };
        }

        return this;
    }
}

export type DataInput = object|DataEntity;
export type DataArrayInput = DataInput|DataInput[];

interface DataEntityMetadata {
    // The date at which this entity was created
    readonly createdAt: number;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}
