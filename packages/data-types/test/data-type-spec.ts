import 'jest-extended';
import { DataType, DataTypeConfig, LATEST_VERSION } from '../src';
import { TSError } from '@terascope/utils';

describe('DataType', () => {
    it('it will throw without versioning', () => {
        expect.hasAssertions();
        try {
            // @ts-ignore
            new DataType({});
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('No version was specified in type config');
        }
    });

    it('it can instantiate correctly', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: { hello: { type: 'Keyword' } },
        };

        expect(() => new DataType(typeConfig)).not.toThrow();
    });

    it('it can return an xlucene ready typeconfig', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const results = {
            hello: 'string',
            location: 'geo',
            date: 'date',
            ip: 'ip',
            someNum: 'number',
        };

        const xluceneConfig = new DataType(typeConfig).toXlucene();
        expect(xluceneConfig).toEqual(results);
    });

    it('it can return graphql results', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const dataType = new DataType(typeConfig, 'myType');
        const { baseType, customTypes } = dataType.toGraphQLTypes();
        const results = dataType.toGraphQL();

        [
            'type myType {',
            'hello: String',
            'location: GeoPointType',
            'date: DateTime',
            'ip: String',
            'someNum: Int',
            'type GeoPointType {',
            'lat: String!',
            'lon: String!',
        ].forEach((str: string) => {
            expect(results).toInclude(str);
        });

        ['type myType {', 'hello: String', 'location: GeoPointType', 'date: DateTime', 'ip: String', 'someNum: Int'].forEach(
            (str: string) => {
                expect(baseType).toInclude(str);
            }
        );

        expect(customTypes).toBeArrayOfSize(1);
        const customType = customTypes[0];

        ['type GeoPointType {', 'lat: String!', 'lon: String!'].forEach((str: string) => {
            expect(customType).toInclude(str);
        });
    });

    it('it can add type name at toGraphQL call', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const results = new DataType(typeConfig, 'myType').toGraphQL({ typeName: 'otherType' });

        expect(results).toInclude('type otherType {');
        expect(results).not.toInclude('type myType {');
    });

    it('it can add default types for toGraphQL', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };
        const typeInjection = 'world: String';
        const results = new DataType(typeConfig, 'myType').toGraphQL({ typeInjection });

        expect(results).toInclude(typeInjection);
    });

    it('it throws when no name is provided with a toGraphQL call', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        try {
            new DataType(typeConfig).toGraphQL();
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('No typeName was specified to create the graphql type representing this data structure');
        }
    });

    it('elasticsearch mapping requires providing a type name', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        try {
            // @ts-ignore
            new DataType(typeConfig).toESMapping();
        } catch (err) {
            expect(err.message).toInclude("Cannot destructure property `typeName` of 'undefined' or 'null'.");
        }
    });

    it('can create an elasticsearch mapping', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const results = {
            mappings: {
                events: {
                    properties: {
                        hello: { type: 'text' },
                        location: { type: 'geo_point' },
                        date: { type: 'date' },
                        ip: { type: 'ip' },
                        someNum: { type: 'long' },
                    },
                },
            },
            settings: {
                analysis: {
                    analyzer: {},
                    tokenizer: {},
                },
            },
        };

        const mapping = new DataType(typeConfig).toESMapping({ typeName: 'events' });
        expect(mapping).toEqual(results);
    });

    it('can add additional settings to a elasticsearch mapping', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const settings = {
            'index.number_of_shards': 5,
            'index.number_of_replicas': 1,
            analysis: {
                analyzer: {
                    lowercase_keyword_analyzer: {
                        tokenizer: 'keyword',
                        filter: 'lowercase',
                    },
                },
            },
        };

        const results = {
            mappings: {
                events: {
                    properties: {
                        hello: { type: 'text' },
                        location: { type: 'geo_point' },
                        date: { type: 'date' },
                        ip: { type: 'ip' },
                        someNum: { type: 'long' },
                    },
                },
            },
            settings: {
                'index.number_of_shards': 5,
                'index.number_of_replicas': 1,
                analysis: {
                    analyzer: {
                        lowercase_keyword_analyzer: {
                            tokenizer: 'keyword',
                            filter: 'lowercase',
                        },
                    },
                    tokenizer: {},
                },
            },
        };

        const mapping = new DataType(typeConfig).toESMapping({ typeName: 'events', settings });
        expect(mapping).toEqual(results);
    });

    it('can build a single graphql type from multiple types', () => {
        const typeConfig1: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const typeConfig2: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'Geo' },
                otherLocation: { type: 'Geo' },
                bool: { type: 'Boolean' },
            },
        };

        const types = [new DataType(typeConfig1, 'firstType'), new DataType(typeConfig2, 'secondType')];

        const results = DataType.mergeGraphQLDataTypes(types);

        const fields = [
            'type firstType {',
            'hello: String',
            'location: GeoPointType',
            'date: DateTime',
            'ip: String',
            'someNum: Int',

            'type secondType {',
            'otherLocation: GeoPointType',
            'bool: Boolean',

            'type GeoPointType {',
            'lat: String!',
            'lon: String!',
        ];

        fields.forEach((str: string) => {
            expect(results).toInclude(str);
        });

        expect(results).toIncludeRepeated('type GeoPointType {', 1);
    });
});
