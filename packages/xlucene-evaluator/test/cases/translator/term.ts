import { TestCase } from './interfaces';

export default [
    [
        '*',
        'query.constant_score.filter',
        {
            bool: {
                filter: [],
            },
        },
    ],
    [
        'hello:world',
        'query.constant_score.filter',
        {
            match: {
                operator: 'and',
                hello: 'world',
            },
        },
    ],
    [
        'hello:w?rld',
        'query.constant_score.filter',
        {
            wildcard: {
                hello: 'w?rld',
            },
        },
    ],
    [
        'hello:/w.*ld/',
        'query.constant_score.filter',
        {
            regexp: {
                hello: 'w.*ld',
            },
        },
    ],
    [
        '_exists_:hello',
        'query.constant_score.filter',
        {
            exists: {
                field: 'hello',
            },
        },
    ],
    [
        'example_count:>=30',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    gte: 30,
                },
            },
        },
    ],
    [
        'example_count:>30',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    gt: 30,
                },
            },
        },
    ],
    [
        'example_count:<50',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    lt: 50,
                },
            },
        },
    ],
    [
        'example_count:<=50',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    lte: 50,
                },
            },
        },
    ],
    [
        'hello-there',
        'query.constant_score.filter',
        {
            multi_match: {
                query: 'hello-there',
            },
        },
    ],
    [
        'nested.*:hello-there',
        'query.constant_score.filter',
        {
            match: {
                operator: 'and',
                'nested.*': 'hello-there',
            },
        },
    ],
    [
        'field.subfield:"value=something=*"',
        'query.constant_score.filter',
        {
            match: {
                operator: 'and',
                'field.subfield': 'value=something=*',
            },
        },
    ],
] as TestCase[];
