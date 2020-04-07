import * as ts from '@terascope/utils';
import { AvailableType } from '@terascope/data-types';
import crypto from 'crypto';
import PhoneValidator from 'awesome-phonenumber';
import jexl from 'jexl';
import { format as dateFormat, parse } from 'date-fns';
import {
    ExtractFieldConfig,
    ReplaceLiteralConfig,
    ReplaceRegexConfig
} from './interfaces';
import {
    isString,
    isValidDate,
    isNumber,
    isArray,
    isNumberTuple
} from '../validations/field-validator';
import { Repository } from '../interfaces';

export const repository: Repository = {
    toString: {
        fn: toString,
        config: {},
        output_type: 'String' as AvailableType
    },
    toBoolean: { fn: toBoolean, config: {}, output_type: 'Boolean' as AvailableType },
    toUpperCase: { fn: toUpperCase, config: {}, output_type: 'String' as AvailableType },
    toLowerCase: { fn: toLowerCase, config: {}, output_type: 'String' as AvailableType },
    trim: {
        fn: trim,
        config: {
            char: { type: 'String' }
        },
        output_type: 'String' as AvailableType
    },
    truncate: {
        fn: truncate,
        config: {
            size: { type: 'Number' }
        },
        output_type: 'String' as AvailableType
    },
    toISDN: { fn: toISDN, config: {}, output_type: 'String' as AvailableType },
    toNumber: {
        fn: toNumber,
        config: {
            booleanLike: { type: 'Boolean' }
        },
        output_type: 'Number' as AvailableType
    },
    decodeBase64: { fn: decodeBase64, config: {}, output_type: 'String' as AvailableType },
    encodeBase64: { fn: encodeBase64, config: {}, output_type: 'String' as AvailableType },
    decodeUrl: { fn: decodeUrl, config: {}, output_type: 'String' as AvailableType },
    encodeUrl: { fn: encodeUrl, config: {}, output_type: 'String' as AvailableType },
    decodeHex: { fn: decodeHex, config: {}, output_type: 'String' as AvailableType },
    encodeHex: { fn: encodeHex, config: {}, output_type: 'String' as AvailableType },
    encodeMD5: { fn: encodeMD5, config: {}, output_type: 'String' as AvailableType },
    encodeSHA: {
        fn: encodeSHA,
        config: {
            hash: { type: 'String' },
            digest: { type: 'String' }
        },
        output_type: 'String' as AvailableType
    },
    encodeSHA1: { fn: encodeSHA1, config: {}, output_type: 'String' as AvailableType },
    parseJSON: { fn: parseJSON, config: {}, output_type: 'Any' as AvailableType },
    toJSON: {
        fn: toJSON,
        config: {
            pretty: { type: 'Boolean' }
        },
        output_type: 'String' as AvailableType
    },
    dedupe: { fn: dedupe, config: {}, output_type: 'Any' as AvailableType },
    toGeoPoint: { fn: toGeoPoint, config: {}, output_type: 'GeoPoint' as AvailableType },
    extract: {
        fn: extract,
        config: {
            regex: { type: 'String' },
            isMultiValue: { type: 'Boolean' },
            jexlExp: { type: 'String' },
            start: { type: 'String' },
            end: { type: 'String' }
        },
        output_type: 'Any' as AvailableType
    },
    replaceRegex: {
        fn: replaceRegex,
        config: {
            regex: { type: 'String' },
            replace: { type: 'String' },
            global: { type: 'String' },
            ignore_case: { type: 'Boolean' }
        },
        output_type: 'String' as AvailableType
    },
    replaceLiteral: {
        fn: replaceLiteral,
        config: {
            search: {
                type: 'String'
            },
            replace: {
                type: 'String'
            }
        },
        output_type: 'String' as AvailableType
    },
    toUnixTime: { fn: toUnixTime, config: {}, output_type: 'Number' as AvailableType },
    toISO8601: {
        fn: toISO8601,
        config: {
            resolution: {
                type: 'String',
                description: 'may be set to seconds | milliseconds'
            }
        },
        output_type: 'String' as AvailableType
    },
    formatDate: {
        fn: formatDate,
        config: {
            format: { type: 'String' },
            resolution: { type: 'String', description: 'may be set to seconds | milliseconds' },
        },
        output_type: 'String' as AvailableType
    },
    parseDate: {
        fn: parseDate,
        config: {
            format: { type: 'String' },
        },
        output_type: 'Date' as AvailableType
    },
    trimStart: {
        fn: trimStart,
        config: {
            char: { type: 'String' }
        },
        output_type: 'String' as AvailableType
    },
    trimEnd: {
        fn: trimEnd,
        config: {
            char: { type: 'String' }
        },
        output_type: 'String' as AvailableType
    },
    toCamelCase: { fn: toCamelCase, config: {}, output_type: 'String' as AvailableType },
    toKebabCase: { fn: toKebabCase, config: {}, output_type: 'String' as AvailableType },
    toPascalCase: { fn: toPascalCase, config: {}, output_type: 'String' as AvailableType },
    toSnakeCase: { fn: toSnakeCase, config: {}, output_type: 'String' as AvailableType },
    toTitleCase: { fn: toTitleCase, config: {}, output_type: 'String' as AvailableType },
    setField: {
        fn: setField,
        config: {
            value: {
                type: 'Any'
            }
        },
        output_type: 'Any' as AvailableType
    },
    setDefault: {
        fn: setDefault,
        config: {
            value: {
                type: 'Any'
            }
        },
        output_type: 'Any' as AvailableType
    },
    map: {
        fn: map,
        config: {
            fn: {
                type: 'String'
            },
            options: {
                type: 'Object'
            }
        },
        output_type: 'Any' as AvailableType
    },
};

type StringInput = string | string[] | null | undefined;

/**
 * This function is used to set a value if input is null or undefined,
 * otherwise the input value is returned
 * @example
 * const results = fieldTransform.setDefault(undefined, { value: 'someValue' });
 * results === 'someValue';
 *
 * @export
 * @param {*} input
 * @param {{ value: any }} args value is what will be given when input is null/undefined
 * @returns {*}
 */

export function setDefault(input: any, args: { value: any }) {
    if (ts.isNil(input)) {
        if (ts.isNil(args.value)) throw new Error('Parameter value cannot be set to undefined or null');
        return args.value;
    }
    return input;
}

/**
 * This function is used to map an array of values with any FieldTransform method
 * @example
 *  const array = ['hello', 'world', 'goodbye'];
 *  const results = fieldTransform.map(array, { fn: 'truncate', options: { size: 3 } }
 *  results === ['hel', 'wor', 'goo']
 *
 * @param  {any[]} input an array of any value
 * @param  {{fn:string; options?:any}} args fn any FieldTransform function name,
 * options is an object with any additional parameters needed
 * @returns {any[] | null} returns the mapped values, return null if input is null/undefied
 */

export function map(input: any[], args: { fn: string; options?: any }) {
    if (ts.isNil(input)) return null;

    if (!isArray(input)) throw new Error(`Input must be an array, received ${ts.getTypeOf(input)}`);
    const { fn, options } = args;
    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field transform respository`);

    return input.map((data) => repoConfig.fn(data, options));
}

// TODO: this is currently a hack for directives, this will evolve, do not use it for other purposes

/**
 * This function is not meant to be used programatically
 * please use `RecordTransform.setField` instead
 *
 * @export
 * @param {*} _input This value will be discarded
 * @param {{ value: any }} args value will be used to set field
 * @returns
 */

export function setField(_input: any, args: { value: any }) {
    const { value } = args;
    return value;
}

/**
 * Converts values to strings
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 *  expect(transform.toString(true)).toEqual('true');
  * expect(fieldTransform.toString([true, undefined, false])).toEqual(['true', 'false']);
 * @export
 * @param {*} input
 * @returns {String | null} returns null if input is null/undefined
 */

export function toString(input: any) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toString);

    return ts.toString(input);
}

/**
 * Converts values to booleans
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * expect(fieldTransform.toBoolean('0')).toBe(false)
 * expect(fieldTransform.toBoolean(['foo', 'false', null])).toEqual([true, false]);
 *
 * @export
 * @param {*} input
 * @returns {Boolean | null} returns null if input is null/undefined
 */

export function toBoolean(input: any) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toBoolean);

    return ts.toBoolean(input);
}

/**
 * Converts strings to UpperCase
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 *  expect(fieldTransform.toUpperCase('lowercase')).toBe('LOWERCASE');
 *  expect(fieldTransform.toUpperCase(['MixEd', null, 'lower'])).toEqual(['MIXED', 'LOWER']);
 *
 * @export
 * @param {StringInput} input string or string[]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function toUpperCase(input: StringInput) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map((str: string) => str.toUpperCase());
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return input.toUpperCase();
}

/**
 * Converts strings to lowercase
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 *  expect(fieldTransform.toLowerCase('UPPERCASE')).toBe('uppercase');
 *  expect(fieldTransform.toLowerCase(['MixEd', null, 'UPPER'])).toEqual(['mixed', 'upper']);
 *
 * @export
 * @param {StringInput} input string | string[]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function toLowerCase(input: StringInput) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map((str: string) => str.toLowerCase());
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return input.toLowerCase();
}

/**
 * Will trim the input
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * expect(fieldTransform.trim('right    ')).toBe('right');
 * expect(fieldTransform.trim('fast cars race fast', { char: 'fast' })).toBe(' cars race ');
 *
 * @export
 * @param {StringInput} input string | string[]
 * @param {{ char: string }} [args] a single char or word that will be cut out
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function trim(input: StringInput, args?: { char: string }) {
    if (ts.isNil(input)) return null;
    const char: string = (args?.char && isString(args.char)) ? args.char : ' ';

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: string) => trimEnd(trimStart(str, { char }), { char }));
    }

    return trimEnd(trimStart(input, { char }), { char });
}

/**
 * Will trim the beginning of the input
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * expect(fieldTransform.trimStart('    Hello Bob    ')).toBe('Hello Bob    ');
 * expect(fieldTransform.trimStart('iiii-wordiwords-iii', { char: 'i' })).toBe('-wordiwords-iii');
 *
 *
 * @export
 * @param {StringInput} input string | string[]
 * @param {{ char: string }} [args]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function trimStart(input: StringInput, args?: { char: string }) {
    if (ts.isNil(input)) return null;
    if (args?.char && !isString(args.char)) throw new Error(`Parameter char must be a string, received ${ts.getTypeOf(input)}`);

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: any) => ts.trimStart(str, args?.char));
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return ts.trimStart(input, args?.char);
}

/**
 * Will trim the end of the input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * expect(fieldTransform.trimEnd('    Hello Bob    ')).toBe('    Hello Bob');
 * expect(fieldTransform.trimEnd('iiii-wordiwords-iii', { char: 'i' })).toBe('iiii-wordiwords');
 *
 *
 * @export
 * @param {StringInput} input string | string[]
 * @param {{ char: string }} [args]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function trimEnd(input: StringInput, args?: { char: string }) {
    if (ts.isNil(input)) return null;
    if (args?.char && !isString(args.char)) throw new Error(`Parameter char must be a string, received ${ts.getTypeOf(input)}`);

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: any) => ts.trimEnd(str, args?.char));
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return ts.trimEnd(input, args?.char);
}

/**
 * Will truncate the input down the size given
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * expect(fieldTransform.truncate('thisisalongstring', { size: 4 })).toBe('this');
 * expect(fieldTransform.truncate(['hello', null, 'world'], { size: 2 })).toEqual(['he', 'wo']);
 *
 * @export
 * @param {StringInput} input string | string[]
 * @param {{ size: number }} args
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function truncate(input: StringInput, args: { size: number }) {
    const { size } = args;

    if (ts.isNil(input)) return null;
    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: any) => str.slice(0, size));
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return input.slice(0, size);
}

function parsePhoneNumber(str: any) {
    let testNumber = ts.toString(str).trim();
    if (testNumber.charAt(0) === '0') testNumber = testNumber.slice(1);

    // needs to start with a +
    if (testNumber.charAt(0) !== '+') testNumber = `+${testNumber}`;

    const fullNumber = new PhoneValidator(testNumber).getNumber();
    if (fullNumber) return String(fullNumber).slice(1);

    throw Error('Could not determine the incoming phone number');
}

/**
 * Parses a string or number to a fully validated phone number
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * expect(fieldTransform.toISDN('+33-1-22-33-44-55')).toBe('33122334455');
 * expect(fieldTransform.toISDN('1(800)FloWErs')).toBe('18003569377');
 *
 * @export
 * @param {*} input string | string[] | number | number[]
 * @returns { String | String[] | null }  a fully validated phone number,
 * returns null if input is null/undefined
 */

export function toISDN(input: any) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(parsePhoneNumber);

    return parsePhoneNumber(input);
}

function convertToNumber(input: any, args?: { booleanLike?: boolean }) {
    let result = input;

    if (args?.booleanLike && ts.isBooleanLike(input)) {
        result = ts.toNumber(toBoolean(result));
    }

    result = ts.toNumber(result);

    if (Number.isNaN(result)) throw new Error(`Could not convert input of type ${ts.getTypeOf(input)} to a number`);
    return result;
}

/**
 * Convert a value to a number if possible
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * expect(fieldTransform.toNumber('12321')).toBe(12321);
 * expect(fieldTransform.toNumber('000011')).toBe(11);
 * expect(fieldTransform.toNumber('true', { booleanLike: true })).toBe(1);
 * expect(fieldTransform.toNumber(null, { booleanLike: true })).toBe(0);
 * expect(fieldTransform.toNumber(null)).toBe(null);
 *
 * @export
 * @param {*} input
 * @param {{ booleanLike?: boolean }} [args]
 * @returns { number | null } returns null if input is null/undefined
 */

export function toNumber(input: any, args?: { booleanLike?: boolean }) {
    if (ts.isNil(input) && args?.booleanLike !== true) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => convertToNumber(data, args));
    }

    return convertToNumber(input, args);
}

/**
 * decodes a base64 hashed value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * const str = 'hello world';
 * const encoded = encodeBase64(str);
 *
 * const results = fieldTransform.decodeBase64(encoded)
 * results === str
 *
 * @export
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function decodeBase64(input: any) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data, 'base64').toString('utf8'));
    }

    return Buffer.from(input, 'base64').toString('utf8');
}

/**
 * encodes a value into base64
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * const str = 'hello world';
 *
 * const encodedValue = fieldTransform.decodeBase64(str);
 *
 * @export
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeBase64(input: any) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data).toString('base64'));
    }

    return Buffer.from(input).toString('base64');
}

/**
 * decodes a url encoded value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * const source = 'HELLO AND GOODBYE';
 * const encoded = 'HELLO%20AND%20GOODBYE';
 *
 * expect(fieldTransform.decodeUrl(encoded)).toEqual(source);
 *
 * @export
 * @param {StringInput} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function decodeUrl(input: StringInput) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) return input.filter(ts.isNotNil).map(decodeURIComponent);
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return decodeURIComponent(input);
}

/**
 * url encodes a value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 * const source = 'HELLO AND GOODBYE';
 * const encoded = 'HELLO%20AND%20GOODBYE';
 *
 * expect(fieldTransform.encodeUrl(source)).toEqual(encoded);
 *
 * @export
 * @param {StringInput} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeUrl(input: StringInput) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) return input.filter(ts.isNotNil).map(encodeURIComponent);
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return encodeURIComponent(input);
}

/**
 * hex decodes the input
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * const source = 'hello world';
 * const encoded = encodeHex(source);
 *
 * expect(fieldTransform.decodeHex(encoded)).toEqual(source);
 *
 * @export
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function decodeHex(input: any) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data, 'hex').toString('utf8'));
    }

    return Buffer.from(input, 'hex').toString('utf8');
}

/**
 * hex encodes the input
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * const source = 'hello world';
 *
 * fieldTransform.encodeHex(source);
 *
 * @export
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeHex(input: any) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data).toString('hex'));
    }

    return Buffer.from(input).toString('hex');
}

/**
 * MD5 encodes the input
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * const source = 'hello world';
 *
 * fieldTransform.encodeMD5(source);
 *
 * @export
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeMD5(input: any) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => crypto.createHash('md5').update(data).digest('hex'));
    }

    return crypto.createHash('md5').update(input).digest('hex');
}

/**
* MD5 encodes the input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @export
 * @param {*} input
 * @param {*} [{ hash = 'sha256', digest = 'hex' }={}]
 *  possible digest values ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'hex', 'binary']
 *  possible hash values
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeSHA(input: any, { hash = 'sha256', digest = 'hex' } = {}) {
    if (ts.isNil(input)) return null;

    if (!['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'hex', 'binary'].includes(digest)) throw new Error('Parameter digest is misconfigured');

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            // @ts-ignore
            .map((data: any) => crypto.createHash(hash).update(data).digest('ascii'));
    }

    // @ts-ignore
    return crypto.createHash(hash).update(input).digest('ascii');
}

/**
 * SHA1 encodes the input
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * const source = 'hello world';
 *
 * fieldTransform.encodeSHA1(source);
 *
 * @export
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeSHA1(input: any) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => crypto.createHash('sha1').update(data).digest('hex'));
    }

    return crypto.createHash('sha1').update(input).digest('hex');
}

/**
 * Parses json input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 *
 * @export
 * @param {*} input
 * @returns { any | null } returns null if input is null/undefined
 */

export function parseJSON(input: any) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => JSON.parse(data));
    }

    return JSON.parse(input);
}

/**
 * Converts input to JSON
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @export
 * @param {*} input
 * @param {*} [{ pretty = false }={}] setting pretty to true will format the json ouput
 * @returns { string | string[] | null } returns null if input is null/undefined
 */
export function toJSON(input: any, { pretty = false } = {}) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => {
                if (pretty) return JSON.stringify(data, null, 2);
                return JSON.stringify(data);
            });
    }

    if (pretty) return JSON.stringify(input, null, 2);
    return JSON.stringify(input);
}

/**
 * returns an array with only unique values
 *
 * @example
 * const results = fieldTransform.dedupe([1, 2, 2, 3, 3, 3, undefined, 4])
 * results === [1, 2, 3, undefined, 4]
 *
 * @export
 * @param {any[]} input
 * @returns {any[] | null } returns null if input is null/undefined
 */

export function dedupe(input: any[]) {
    if (ts.isNil(input)) return null;
    // TODO: figure out if we need more than reference equality
    if (!isArray(input)) throw new Error(`Input must be an array, recieved ${ts.getTypeOf(input)}`);
    return ts.uniq(input);
}

/**
 * Converts the value into a geo-point
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @export
 * @param {*} input
 * @returns {{ lat: number, lon: number } | { lat: number, lon: number }[] | null }
 * returns null if input is null/undefined
 */

export function toGeoPoint(input: any) {
    if (ts.isNil(input)) return null;

    // a tuple of numbers is a form of geo-point, do not map it
    if (isArray(input) && !isNumberTuple(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => ts.parseGeoPoint(data, true));
    }

    return ts.parseGeoPoint(input, true);
}

/**
 * Can extract values from string input
 * if given an array it will convert everything in the array excluding null/undefined values

 *
 * @export
 * @param {*} input
 * @param {ExtractFieldConfig} {
 *         regex, isMultiValue = true, jexlExp, start, end
 *     }
 *  If regex is specified, it will run the regex against the value.
 *  If isMultiValue is true, then an array containing the return results will be returned.
 *  If it is set to false, then only the first possible extraction will be returned.
 *  start/end are used as boundaries for extraction, should not be used with jexlExp or regex
 *  jexlExp is a jexl expression  => https://github.com/TomFrost/Jexl
 * @returns { string | string[] | null } returns null if input is null/undefined
 *
 * @example
 *  const results1 = fieldTransform.extract('<hello>', { start: '<', end: '>' });
 *  expect(results1).toEqual('hello');
 *
 * const results2 = fieldTransform.extract({ foo: 'bar' }, { jexlExp: '[foo]' });
 * expect(results2).toEqual(['bar']);
 *
 * const results3 = fieldTransform.extract('hello', { regex: 'he.*' });
 * expect(results3).toEqual(['hello']);
 *
 * const results = fieldTransform.extract('hello', { regex: 'he.*', isMultiValue: false });
 * expect(results).toEqual('hello');
 *
 */

export function extract(
    input: any,
    {
        regex, isMultiValue = true, jexlExp, start, end
    }: ExtractFieldConfig
) {
    if (ts.isNil(input)) return null;

    function getSubslice() {
        const indexStart = input.indexOf(start);
        if (indexStart !== -1) {
            const sliceStart = indexStart + start.length;
            let endInd = input.indexOf(end, sliceStart);
            if (endInd === -1) endInd = input.length;
            const extractedSlice = input.slice(sliceStart, endInd);
            if (extractedSlice) return input.slice(sliceStart, endInd);
        }
        return null;
    }

    type Cb = (data: any) => string|string[]|null;

    function extractField(data: any, fn: Cb) {
        if (typeof data === 'string') {
            return fn(data);
        }

        if (isArray(data)) {
            const results: string[] = [];

            data.forEach((subData: any) => {
                if (typeof subData === 'string') {
                    const extractedSlice = fn(subData);
                    if (extractedSlice) {
                        if (Array.isArray(extractedSlice)) {
                            results.push(...extractedSlice);
                        } else {
                            results.push(extractedSlice);
                        }
                    }
                }
            });

            if (results.length > 0) {
                if (isMultiValue) return results;
                return results[0];
            }
        }

        return null;
    }

    function matchRegex() {
        const results = ts.matchAll(regex as string, input);
        if (isMultiValue) return results;
        return results ? results[0] : results;
    }

    function callExpression() {
        try {
            return jexl.evalSync(jexlExp as string, input);
        } catch (err) {
            const errMessage = `Invalid jexl expression: ${jexlExp}, error: ${err.message}`;
            throw new ts.TSError(errMessage);
        }
    }

    function extractAndTransferFields() {
        let extractedResult;

        if (regex) {
            extractedResult = extractField(input, matchRegex);
        } else if (start && end) {
            extractedResult = extractField(input, getSubslice);
        } else if (jexlExp) {
            extractedResult = callExpression();
        } else {
            extractedResult = input;
        }
        return extractedResult;
    }

    const results = extractAndTransferFields();
    if (results == null) return null;

    return results;
}

/**
 * This function replaces chars in a string based off the regex values provided
 * @example
 * const config1 =  { regex: 's|e', replace: 'd' };
 * const results1 = fieldTransform.replaceRegex('somestring', config1)
 * results1 === 'domestring'
 *
 * const config2 = { regex: 's|e', replace: 'd', global: true };
 * const results2 = fieldTransform.replaceRegex('somestring', config)
 * results2 === 'domddtring'
 *
 * const config3 = {
 *   regex: 'm|t', replace: 'W', global: true, ignoreCase: true
 * };
 * const results3 = fieldTransform.replaceRegex('soMesTring', config3))
 * results3 === 'soWesWring'
 *
 * @export
 * @param {StringInput} input
 * @param {ReplaceRegexConfig} {
 *     regex, replace, ignoreCase, global
 * }
 * @returns { string | string[] | null } returns null if input is null/undefined
 */
export function replaceRegex(input: StringInput, {
    regex, replace, ignoreCase, global
}: ReplaceRegexConfig) {
    if (ts.isNil(input)) return null;
    let options = '';

    if (ignoreCase) options += 'i';
    if (global) options += 'g';

    if (isArray(input)) {
        return input.filter(ts.isNotNil).map((data: any) => {
            if (!isString(data)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);
            const re = new RegExp(regex, options);
            return data.replace(re, replace);
        });
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    const re = new RegExp(regex, options);
    return input.replace(re, replace);
}

/**
 * This function replaces whole words
 *
 * @example
 *
 * fieldTransform.replaceLiteral('Hi bob', { search: 'bob', replace: 'mel' }) === 'Hi mel';
 * fieldTransform.replaceLiteral('Hi Bob', { search: 'bob', replace: 'Mel ' }) ===  'Hi Bob';
 *
 *
 * @export
 * @param {StringInput} input
 * @param {ReplaceLiteralConfig} { search, replace }
 * search is the word that is to be changed to the value specified with the paramter replace
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function replaceLiteral(input: StringInput, { search, replace }: ReplaceLiteralConfig) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input.filter(ts.isNotNil).map((data: any) => {
            if (!isString(data)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(data)}`);
            return data.replace(search, replace);
        });
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    try {
        return input.replace(search, replace);
    } catch (e) {
        throw new Error(`Could not replace ${search} with ${replace}`);
    }
}

/**
 * Converts a string to an array of characters split by the delimiter provided
 * @example
 * expect(fieldTransform.toArray('astring')).toEqual(['a', 's', 't', 'r', 'i', 'n', 'g']);
 * expect(fieldTransform.toArray('astring', { delimiter: ',' })).toEqual(['astring']);
 * expect(fieldTransform.toArray('a-stri-ng', { delimiter: '-' })).toEqual(['a', 'stri', 'ng']);
 *
 * @export
 * @param {*} input
 * @param {{ delimiter: string }} [args] delimter defaults to an empty string
 * @returns {(string[] | null)}
 */

export function toArray(input: any, args?: { delimiter: string }): string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) return input;

    if (isString(input)) {
        const delimiter = args ? args.delimiter : '';
        return input.split(delimiter);
    }

    throw new Error(`Input must be a string or an array, got ${ts.getTypeOf(input)}`);
}

function _makeUnitTime(input: any, { ms = false } = {}) {
    let time: boolean | number;

    if (ms) {
        time = ts.getTime(input);
    } else {
        time = ts.getUnixTime(input);
    }

    return time as number;
}

// option to specify, seconds, millisecond, microseconds?
/**
 * Converts a given date to its time in milliseconds or seconds
 *
 * @example
 *
 * expect(fieldTransform.toUnixTime('2020-01-01')).toBe(1577836800);
 * expect(fieldTransform.toUnixTime('Jan 1, 2020 UTC')).toBe(1577836800);
 * expect(fieldTransform.toUnixTime('2020 Jan, 1 UTC')).toBe(1577836800);
 *
 * expect(fieldTransform.toUnixTime(1580418907000)).toBe(1580418907);
 * expect(fieldTransform.toUnixTime(1580418907000, { ms: true })).toBe(1580418907000);
 *
 * @export
 * @param {*} input
 * @param {*} [{ ms = false }={}] set ms to true if you want time in milliseconds
 * @returns { number | number[] | null} returns null if input is null/undefined
 */

export function toUnixTime(input: any, { ms = false } = {}) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input.filter(ts.isNotNil).map((data: any) => {
            if (!isValidDate(data)) throw new Error(`Not a valid date, cannot transform ${data} to unix time`);

            return _makeUnitTime(data, { ms });
        });
    }

    if (!isValidDate(input)) throw new Error(`Not a valid date, cannot transform ${input} to unix time`);

    return _makeUnitTime(input, { ms });
}

function _makeIso(input: any, args?: { resolution?: 'seconds' | 'milliseconds' }) {
    let value = input;
    if (isNumber(input) && args && args.resolution) value *= 1000;

    return new Date(value).toISOString();
}

/**
 * Converts a date string or number to an ISO date
 *
 * @example
 * expect(fieldTransform.toISO8601('2020-01-01')).toBe('2020-01-01T00:00:00.000Z');
 *
 * const config = { resolution: 'seconds' };
 * expect(fieldTransform.toISO8601(1580418907, config)).toBe('2020-01-30T21:15:07.000Z');
 *
 * @export
 * @param {*} input
 * @param {({ resolution?: 'seconds' | 'milliseconds' })} [args]
 * if input is a number, you may specify the resolution of that number, defaults to seconds
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toISO8601(input: any, args?: { resolution?: 'seconds' | 'milliseconds' }) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => {
                if (!isValidDate(data)) {
                    throw new Error(`Input is not valid date, recieved ${data}`);
                }

                return _makeIso(data, args);
            });
    }

    if (!isValidDate(input)) {
        throw new Error(`Input is not valid date, recieved ${input}`);
    }

    return _makeIso(input, args);
}

interface FormatDateConfig {
    format: string;
    resolution?: 'seconds' | 'milliseconds';
}

function _formatDate(input: any, args: FormatDateConfig) {
    if (!isValidDate(input)) {
        throw new Error('Input is not valid date');
    }

    let value = input;
    const { format, resolution } = args;

    if (!isString(format)) throw new Error(`Invalid parameter format, must be a string, recieved ${ts.getTypeOf(input)}`);

    if (isString(value)) value = new Date(value);
    if (isNumber(value) && resolution === 'seconds') value *= 1000;

    return dateFormat(value, format);
}

/**
 * Function that will format a number or date string to a given date format provided
 *
 * @example
 *
 * const results1 = fieldTransform.formatDate('2020-01-14T20:34:01.034Z', { format: 'MMM do yy' })
 * results1 === 'Jan 14th 20';
 *
 * const results2 = fieldTransform.formatDate('March 3, 2019', { format: 'M/d/yyyy' })
 * results2 === '3/3/2019';
 *
 * const config =  { format: 'yyyy-MM-dd', resolution: 'seconds' };
 * const results3 = fieldTransform.formatDate(1581013130, config)
 * results3 === '2020-02-06';
 *
 * @export
 * @param {*} input
 * @param {{ format: string, resolution?: 'seconds' | 'milliseconds' }} args
 * format is the shape that the date will be, resolution is only needed when input is a number
 * @returns { string | string[] | null } returns null if input is null/undefined
 */
export function formatDate(input: any, args: FormatDateConfig) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => _formatDate(data, args));
    }

    return _formatDate(input, args);
}

interface ParseDateConfig {
    format: string;
}

function _parseDate(input: any, args: ParseDateConfig) {
    if (ts.isNil(input)) return null;

    const { format } = args;
    if (!isString(format)) throw new Error(`Invalid parameter format, must be a string, recieved ${ts.getTypeOf(input)}`);

    const parsed = parse(input, format, new Date());

    if (String(parsed) === 'Invalid Date') {
        throw new Error('Cannot parse date');
    }

    return parsed;
}

/**
 * Will use date-fns parse against the input and return a date object
 *
 * @example
 *
 * const result = fieldTransform.parseDate('2020-01-10-00:00', { format: 'yyyy-MM-ddxxx' })
 * result === new Date('2020-01-10T00:00:00.000Z');
 *
 * const result = fieldTransform.parseDate('Jan 10, 2020-00:00', { format: 'MMM dd, yyyyxxx' })
 * result === new Date('2020-01-10T00:00:00.000Z');
 *
 * const result = fieldTransform.parseDate(1581025950223, { format: 'T' })
 * result === new Date('2020-02-06T21:52:30.223Z');
 *
 * const result = fieldTransform.parseDate(1581025950, { format: 't' })
 * result === new Date('2020-02-06T21:52:30.000Z');
 *
 * const result = fieldTransform.parseDate('1581025950', { format: 't' })
 * result === new Date('2020-02-06T21:52:30.000Z');
 *
 * @export
 * @param {*} input
 * @param { format: string } args
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function parseDate(input: any, args: ParseDateConfig) {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => _parseDate(data, args));
    }

    return _parseDate(input, args);
}

/**
 * will camelcase a string
 *
 * @example
 * expect(fieldTransform.toCamelCase('I need camel case')).toBe('iNeedCamelCase');
 * expect(fieldTransform.toCamelCase('happyBirthday')).toBe('happyBirthday');
 * expect(fieldTransform.toCamelCase('what_is_this')).toBe('whatIsThis');
 *
 * @export
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toCamelCase(input: string) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toCamelCase);

    return ts.toCamelCase(input);
}

/**
 * Will convert a string to kebab case
 * @example
 *
 * expect(fieldTransform.toKebabCase('I need kebab case')).toBe('i-need-kebab-case');
 * expect(fieldTransform.toKebabCase('happyBirthday')).toBe('happy-birthday');
 * expect(fieldTransform.toKebabCase('what_is_this')).toBe('what-is-this');
 * expect(fieldTransform.toKebabCase('this-should-be-kebab')).toBe('this-should-be-kebab');

 * @export
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toKebabCase(input: string) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toKebabCase);

    return ts.toKebabCase(input);
}

/**
 * Converts a string to pascal case
 *
 * @example
 * expect(fieldTransform.toPascalCase('I need pascal case')).toBe('INeedPascalCase');
 * expect(fieldTransform.toPascalCase('happyBirthday')).toBe('HappyBirthday');
 * expect(fieldTransform.toPascalCase('what_is_this')).toBe('WhatIsThis');
 *
 * @export
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */
export function toPascalCase(input: string) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toPascalCase);

    return ts.toPascalCase(input);
}

/**
 * Converts a string to snake case
 * @example
 * expect(fieldTransform.toSnakeCase('I need snake case')).toBe('i_need_snake_case');
 * expect(fieldTransform.toSnakeCase('happyBirthday')).toBe('happy_birthday');
 * expect(fieldTransform.toSnakeCase('what_is_this')).toBe('what_is_this');
 *
 * @export
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toSnakeCase(input: string) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toSnakeCase);

    return ts.toSnakeCase(input);
}

/**
 * Converts a string to title case
 * @example
 * expect(fieldTransform.toTitleCase('I need some capitols')).toBe('I Need Some Capitols');
 * expect(fieldTransform.toTitleCase('happyBirthday')).toBe('Happy Birthday');
 * expect(fieldTransform.toTitleCase('what_is_this')).toBe('What Is This');
 *
 * @export
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toTitleCase(input: string) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toTitleCase);

    return ts.toTitleCase(input);
}
