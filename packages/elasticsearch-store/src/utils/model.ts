import { ESTypeMappings } from '@terascope/data-types';
import * as ts from '@terascope/utils';
import generate from 'nanoid/generate';
import nanoid from 'nanoid/async';

/** ElasticSearch Mapping */
export const mapping: ESTypeMappings = {
    _all: {
        enabled: false,
    },
    dynamic: false,
    properties: {
        _key: {
            type: 'keyword',
        },
        client_id: {
            type: 'integer',
        },
        _deleted: {
            type: 'boolean',
        },
        _created: {
            type: 'date',
        },
        _updated: {
            type: 'date',
        },
    },
};

/** JSON Schema */
export const schema = {
    additionalProperties: false,
    properties: {
        _key: {
            type: 'string',
        },
        client_id: {
            type: 'number',
            multipleOf: 1.0,
            minimum: 0,
            default: 1,
        },
        _deleted: {
            type: 'boolean',
            default: false
        },
        _created: {
            format: 'date-time',
        },
        _updated: {
            format: 'date-time',
        },
    },
    required: ['_key', 'client_id', '_created', '_updated'],
};

export function addDefaultMapping(input: ESTypeMappings): ESTypeMappings {
    return mergeDefaults(input, mapping);
}

export function addDefaultSchema(input: object) {
    return mergeDefaults(input, schema);
}

const badIdRegex = new RegExp(/^[-_]+/);

/**
 * Make unique URL friendly id
 */
export async function makeId(len = 12): Promise<string> {
    const id = await nanoid(len);
    const result = badIdRegex.exec(id);
    if (result && result[0].length) {
        const chars = generate('1234567890abcdef', result[0].length);
        return id.replace(badIdRegex, chars);
    }
    return id;
}

/**
 * Deep copy two levels deep (useful for mapping and schema)
 */
export function mergeDefaults<T>(source: T, from: Partial<T>): T {
    const output = ts.cloneDeep(source);
    const _mapping = from ? ts.cloneDeep(from) : {};

    for (const [key, val] of Object.entries(_mapping)) {
        if (output[key] != null) {
            if (ts.isPlainObject(val)) {
                output[key] = Object.assign(output[key], val);
            } else if (Array.isArray(val)) {
                output[key] = ts.concat(output[key], val);
            } else {
                output[key] = val;
            }
        }
    }

    return output;
}

export function toInstanceName(name: string): string {
    let s = ts.trim(name);
    s = s.replace(/[_-\s]+/g, ' ');
    s = s.replace(/s$/, '');
    return s
        .split(' ')
        .map(ts.firstToUpper)
        .join('');
}
