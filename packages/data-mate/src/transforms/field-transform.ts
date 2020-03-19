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
    isNumber
} from '../validations/field-validator';
import { Repository } from '../interfaces';

export const repository: Repository = {
    toString: {
        fn: toString,
        config: {},
        output: 'String' as AvailableType
    },
    toBoolean: { fn: toBoolean, config: {}, output: 'Boolean' as AvailableType },
    toUpperCase: { fn: toUpperCase, config: {}, output: 'String' as AvailableType },
    toLowerCase: { fn: toLowerCase, config: {}, output: 'String' as AvailableType },
    trim: {
        fn: trim,
        config: {
            char: { type: 'String' }
        },
        output: 'String' as AvailableType
    },
    truncate: {
        fn: truncate,
        config: {
            size: { type: 'Number' }
        },
        output: 'String' as AvailableType
    },
    toISDN: { fn: toISDN, config: {}, output: 'String' as AvailableType },
    toNumber: {
        fn: toNumber,
        config: {
            booleanLike: { type: 'Boolean' }
        },
        output: 'Number' as AvailableType
    },
    decodeBase64: { fn: decodeBase64, config: {}, output: 'String' as AvailableType },
    encodeBase64: { fn: encodeBase64, config: {}, output: 'String' as AvailableType },
    decodeUrl: { fn: decodeUrl, config: {}, output: 'String' as AvailableType },
    encodeUrl: { fn: encodeUrl, config: {}, output: 'String' as AvailableType },
    decodeHex: { fn: decodeHex, config: {}, output: 'String' as AvailableType },
    encodeHex: { fn: encodeHex, config: {}, output: 'String' as AvailableType },
    encodeMD5: { fn: encodeMD5, config: {}, output: 'String' as AvailableType },
    encodeSHA: {
        fn: encodeSHA,
        config: {
            hash: { type: 'String' },
            digest: { type: 'String' }
        },
        output: 'String' as AvailableType
    },
    encodeSHA1: { fn: encodeSHA1, config: {}, output: 'String' as AvailableType },
    decodeSHA1: { fn: decodeSHA1, config: {}, output: 'String' as AvailableType },
    parseJSON: { fn: parseJSON, config: {}, output: 'Any' as AvailableType },
    dedupe: { fn: dedupe, config: {}, output: 'Any' as AvailableType },
    toGeoPoint: { fn: toGeoPoint, config: {}, output: 'GeoPoint' as AvailableType },
    extract: {
        fn: extract,
        config: {
            regex: { type: 'String' },
            isMultiValue: { type: 'Boolean' },
            jexlExp: { type: 'String' },
            start: { type: 'String' },
            end: { type: 'String' }
        },
        output: 'Any' as AvailableType
    },
    replaceRegex: {
        fn: replaceRegex,
        config: {
            regex: { type: 'String' },
            replace: { type: 'String' },
            global: { type: 'String' },
            ignore_case: { type: 'Boolean' }
        },
        output: 'String' as AvailableType
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
        output: 'String' as AvailableType
    },
    toUnixTime: { fn: toUnixTime, config: {}, output: 'Number' as AvailableType },
    toISO8601: {
        fn: toISO8601,
        config: {
            resolution: {
                type: 'String',
                description: 'may be set to seconds | milliseconds'
            }
        },
        output: 'String' as AvailableType
    },
    formatDate: {
        fn: formatDate,
        config: {
            format: { type: 'String' },
            resolution: { type: 'String', description: 'may be set to seconds | milliseconds' },
        },
        output: 'String' as AvailableType
    },
    parseDate: {
        fn: parseDate,
        config: {
            format: { type: 'String' },
        },
        output: 'Date' as AvailableType
    },
    trimStart: {
        fn: trimStart,
        config: {
            char: { type: 'String' }
        },
        output: 'String' as AvailableType
    },
    trimEnd: {
        fn: trimEnd,
        config: {
            char: { type: 'String' }
        },
        output: 'String' as AvailableType
    },
    toCamelCase: { fn: toCamelCase, config: {}, output: 'String' as AvailableType },
    toKebabCase: { fn: toKebabCase, config: {}, output: 'String' as AvailableType },
    toPascalCase: { fn: toPascalCase, config: {}, output: 'String' as AvailableType },
    toSnakeCase: { fn: toSnakeCase, config: {}, output: 'String' as AvailableType },
    toTitleCase: { fn: toTitleCase, config: {}, output: 'String' as AvailableType },
};

export function toString(input: any) {
    return ts.toString(input);
}

export function toBoolean(input: any) {
    return ts.toBoolean(input);
}

export function toUpperCase(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return input.toUpperCase();
}

export function toLowerCase(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return input.toLowerCase();
}

export function trim(input: string, args?: { char: string }) {
    const char = args ? args.char : ' ';
    return trimEnd(trimStart(input, { char }), { char });
}

export function trimStart(input: string, args?: { char: string }): string {
    if (!isString(input)) throw new Error('Input must be a string');
    if (args?.char && !isString(args.char)) throw new Error('Input must be a string');

    return ts.trimStart(input, args?.char);
}

export function trimEnd(input: string, args?: { char: string }): string {
    if (!isString(input)) throw new Error('Input must be a string');
    if (args?.char && !isString(args.char)) throw new Error('Input must be a string');

    return ts.trimEnd(input, args?.char);
}

export function truncate(input: string, args: { size: number }) {
    if (!isString(input)) throw new Error('Input must be a string');
    const { size } = args;

    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');
    return input.slice(0, size);
}

export function toISDN(input: any) {
    let testNumber = ts.toString(input).trim();
    if (testNumber.charAt(0) === '0') testNumber = testNumber.slice(1);

    // needs to start with a +
    if (testNumber.charAt(0) !== '+') testNumber = `+${testNumber}`;

    const fullNumber = new PhoneValidator(testNumber).getNumber();
    if (fullNumber) return String(fullNumber).slice(1);

    throw Error('Could not determine the incoming phone number');
}

export function toNumber(input: any, args?: { booleanLike?: boolean }) {
    let result = input;

    if (args?.booleanLike && ts.isBooleanLike(input)) {
        result = ts.toNumber(toBoolean(result));
    }

    result = ts.toNumber(result);

    if (Number.isNaN(result)) throw new Error('could not convert to a number');
    return result;
}

export function decodeBase64(input: any) {
    return Buffer.from(input, 'base64').toString('utf8');
}

export function encodeBase64(input: any) {
    return Buffer.from(input).toString('base64');
}

export function decodeUrl(input: string) {
    return decodeURIComponent(input);
}

export function encodeUrl(input: string) {
    return encodeURIComponent(input);
}

export function decodeHex(input: any) {
    return Buffer.from(input, 'hex').toString('utf8');
}

export function encodeHex(input: any) {
    return Buffer.from(input).toString('hex');
}

export function encodeMD5(input: any) {
    return crypto.createHash('md5').update(input).digest('hex');
}

// TODO: better types for this
export function encodeSHA(input: any, { hash = 'sha256', digest = 'hex' } = {}) {
    // TODO: guard for hash ??
    if (!['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'hex', 'binary'].includes(digest)) throw new Error('Parameter digest is misconfigured');
    // @ts-ignore
    return crypto.createHash(hash).update(input).digest('ascii');
}

export function encodeSHA1(input: any) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

export function decodeSHA1(input: any) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

export function parseJSON(input: any) {
    return JSON.parse(input);
}

export function dedupe(input: any[]) {
    // TODO: figure out if we need more than reference equality
    if (!Array.isArray(input)) throw new Error('Input must be an array');
    return ts.uniq(input);
}

export function toGeoPoint(input: any) {
    return ts.parseGeoPoint(input, true);
}

export function extract(
    input: any,
    {
        regex, isMultiValue = true, jexlExp, start, end
    }: ExtractFieldConfig
) {
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

        if (Array.isArray(data)) {
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
    if (results == null) throw new Error('Nothing to extract');
}

export function replaceRegex(input: string, {
    regex, replace, ignoreCase, global
}: ReplaceRegexConfig): string {
    let options = '';

    if (ignoreCase) options += 'i';
    if (global) options += 'g';

    try {
        const re = new RegExp(regex, options);
        return input.replace(re, replace);
    } catch (e) {
        throw new Error(e.message);
    }
}

export function replaceLiteral(input: string, { search, replace }: ReplaceLiteralConfig): string {
    try {
        return input.replace(search, replace);
    } catch (e) {
        throw new Error(`Could not replace ${search} with ${replace}`);
    }
}

export function toArray(input: string, args?: { delimiter: string }): any[] {
    const delimiter = args ? args.delimiter : '';

    return input.split(delimiter);
}

// option to specify, seconds, millisecond, microseconds?
export function toUnixTime(input: any, { ms = false } = {}): number {
    if (!isValidDate(input)) throw new Error('Not a valid date, cannot transform to unix time');
    let time: boolean | number;

    if (ms) {
        time = ts.getTime(input);
    } else {
        time = ts.getUnixTime(input);
    }

    return time as number;
}

export function toISO8601(input: any, args?: { resolution?: 'seconds' | 'milliseconds' }): string {
    if (!isValidDate(input)) {
        throw new Error('Not a valid date');
    }

    let value = input;
    if (isNumber(input) && args && args.resolution) value *= 1000;

    return new Date(value).toISOString();
}

export function formatDate(input: any, args: { format: string; resolution?: 'seconds' | 'milliseconds' }): string {
    const { format, resolution } = args;
    if (!isString(format)) throw new Error('Invalid parameter format, must be a string');
    // convert string to date
    // validate input as datelike
    if (!isValidDate(input)) {
        throw new Error('Not a valid date');
    }

    let value = input;

    if (isString(value)) value = new Date(value);
    if (isNumber(value) && resolution === 'seconds') value *= 1000;

    return dateFormat(value, format);
}

export function parseDate(input: any, args: { format: string }) {
    const { format } = args;
    if (!isString(format)) throw new Error('Invalid parameter format, must be a string');

    const parsed = parse(input, format, new Date());

    if (String(parsed) === 'Invalid Date') {
        throw new Error('Cannot parse date');
    }

    return parsed;
}

export function toCamelCase(input: string): string {
    return ts.toCamelCase(input);
}

export function toKebabCase(input: string): string {
    return ts.toKebabCase(input);
}

export function toPascalCase(input: string): string {
    return ts.toPascalCase(input);
}

export function toSnakeCase(input: string): string {
    return ts.toSnakeCase(input);
}

export function toTitleCase(input: string): string {
    return ts.toTitleCase(input);
}
