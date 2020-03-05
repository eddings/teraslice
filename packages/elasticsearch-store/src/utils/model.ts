import * as dt from '@terascope/data-types';
import * as ts from '@terascope/utils';

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
    required: ['_key', 'client_id'],
};

export function makeRecordDataType(arg: {
    name: string;
    description?: string;
    fields: dt.TypeConfigFields;
}): dt.DataType {
    return new dt.DataType({
        fields: {
            ...arg.fields,
            _created: { type: 'Date', description: 'Record creation time' },
            _updated: { type: 'Date', description: 'Last record modified time' },
            _deleted: { type: 'Boolean', description: 'A flag to indicate whether the record is deleted' },
            _key: { type: 'Keyword', description: 'The unique ID for the record (autogenerated on creation)' },
            client_id: { type: 'Integer', description: 'The client id namespace, 0 is global' },
        },
        version: dt.LATEST_VERSION
    }, arg.name, arg.description);
}

export function addDefaultSchema(input: object) {
    return mergeDefaults(input, schema);
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
    return ts.getWordParts(name).map(ts.firstToUpper).join('');
}

const _wildcardRegex = /[^A-Za-z0-9]/gm;
export function uniqueFieldQuery(field: string): string {
    if (!_wildcardRegex.test(field)) return `"${field}"`;
    return field.replace(_wildcardRegex, '?');
}
