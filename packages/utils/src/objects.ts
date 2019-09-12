import set from 'lodash.set';
import get from 'lodash.get';
import unset from 'lodash.unset';
import cloneDeep from 'lodash.clonedeep';
import isPlainObject from 'is-plain-object';

/** Check in input has a key */
export function has(data: object, key: any) {
    return key in data;
}

/**
 * A clone deep using `JSON.parse(JSON.stringify(input))`
*/
export function fastCloneDeep<T>(input: T): T {
    return JSON.parse(JSON.stringify(input));
}

/** Perform a shallow clone of an object to another, in the fastest way possible */
export function fastAssign<T, U>(target: T, source: U) {
    if (!isPlainObject(source)) {
        return target;
    }

    for (const [key, val] of Object.entries(source)) {
        target[key] = val;
    }

    return target;
}

/**
 * Similar to is-plain-object but works better when clone deeping a DataEntity
*/
export function isSimpleObject(input: any): input is object {
    if (input == null) return false;
    if (Buffer.isBuffer(input)) return false;
    if (Array.isArray(input)) return false;
    if (input instanceof Set) return false;
    if (input instanceof Map) return false;
    return typeof input === 'object';
}

// export a few dependencies
export {
    isPlainObject,
    cloneDeep,
    get,
    set,
    unset
};
