
/** Schema Version */
export const version = 1;

/** Name of Data Type */
export const name = 'views';

/** ElasticSearch Mapping */
export const mapping = {
    properties: {
        name: {
            type: 'keyword',
            fields: {
                text: {
                    type: 'text',
                    analyzer: 'lowercase_keyword_analyzer'
                }
            }
        },
        space: {
            type: 'keyword'
        },
        constraint: {
            type: 'keyword'
        },
        roles: {
            type: 'keyword'
        },
        excludes: {
            type: 'keyword'
        },
        includes: {
            type: 'keyword'
        },
        prevent_prefix_wildcard: {
            type: 'boolean'
        },
    }
};

/** JSON Schema */
export const schema = {
    properties: {
        name: {
            type: 'string',
            fields: {
                text: {
                    type: 'text',
                    analyzer: 'lowercase_keyword_analyzer'
                }
            },
        },
        description: {
            type: 'string'
        },
        space: {
            type: 'string'
        },
        roles: {
            type: 'array',
            items: {
                type: 'string'
            },
            uniqueItems: true,
            default: []
        },
        excludes: {
            type: 'array',
            items: {
                type: 'string'
            },
            uniqueItems: true,
            default: []
        },
        includes: {
            type: 'array',
            items: {
                type: 'string'
            },
            uniqueItems: true,
            default: []
        },
        constraint: {
            type: 'string'
        },
        prevent_prefix_wildcard: {
            type: 'boolean',
            default: true
        }
    },
    required: ['name', 'space']
};
