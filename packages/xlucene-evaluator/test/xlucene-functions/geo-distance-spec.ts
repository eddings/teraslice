import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Parser } from '../../src';
import { UtilsTranslateQueryOptions } from '../../src/translator';
import { TypeConfig, FieldType, GeoShapeType } from '../../src/interfaces';

describe('geoDistance', () => {
    const typeConfig: TypeConfig = { location: FieldType.GeoPoint };
    const options: UtilsTranslateQueryOptions = {
        logger: debugLogger('test'),
        geo_sort_order: 'asc',
        geo_sort_unit: 'meters',
        type_config: {}
    };

    it('can make a function ast', () => {
        const query = 'location:geoDistance(point:"33.435518,-111.873616" distance:"5000m")';
        const {
            ast: {
                name, type, field, instance
            }
        } = new Parser(query, {
            type_config: typeConfig
        });

        expect(name).toEqual('geoDistance');
        expect(type).toEqual('function');
        expect(field).toEqual('location');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    it('can instantiate with variables', () => {
        const variables = {
            point1: { lat: 33.435518, lon: -111.873616 },
            distance1: '5000m'
        };
        const query = 'location:geoDistance(point:$point1 distance: $distance1)';
        const {
            ast: {
                name, type, field, instance
            }
        } = new Parser(query, {
            type_config: typeConfig,
            variables
        });

        expect(name).toEqual('geoDistance');
        expect(type).toEqual('function');
        expect(field).toEqual('location');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    describe('elasticsearch dsl', () => {
        it('can produce proper elasticsearch DSL (variable queries included)', () => {
            expect.hasAssertions();

            const variables = {
                point1: { lat: 33.435518, lon: -111.873616 },
                point2: '33.435518, -111.873616',
                point3: [-111.873616, 33.435518],
                point4: {
                    type: GeoShapeType.Point,
                    coordinates: [-111.873616, 33.435518]
                },
                distance1: '5000m'
            };

            const results = {
                geo_distance: {
                    distance: '5000meters',
                    location: {
                        lat: 33.435518,
                        lon: -111.873616
                    }
                }
            };

            const sortingResults = {
                _geo_distance: {
                    order: 'asc',
                    unit: 'meters',
                    location: {
                        lat: 33.435518,
                        lon: -111.873616
                    }
                }
            };

            const queries = [
                'location:geoDistance(point:"33.435518,-111.873616" distance:"5000m")',
                'location:geoDistance (point:"33.435518,-111.873616" distance:"5000m")',
                'location: geoDistance (point:"33.435518,-111.873616" distance:"5000m")',
                'location:geoDistance (point:"33.435518,-111.873616", distance:"5000m")',
                'location:geoDistance (distance:"5000m", point:"33.435518,-111.873616" )',
                "location:geoDistance (point:'33.435518,-111.873616' distance:'5000m')",
                'location:geoDistance(point:$point1 distance: $distance1)',
                'location:geoDistance(point:$point2 distance: $distance1)',
                'location:geoDistance(point:$point3 distance: $distance1)',
                'location:geoDistance(point:$point4 distance: $distance1)'
            ];

            const astResults = queries
                .map((query) => new Parser(query, { type_config: typeConfig, variables }))
                .map((parser) => parser.ast.instance.toElasticsearchQuery('location', options));

            astResults.forEach((ast) => {
                expect(ast.query).toEqual(results);
                expect(ast.sort).toEqual(sortingResults);
            });
        });
    });

    describe('matcher', () => {
        it('can match results', () => {
            const query = 'location:geoDistance(point:"33.435518,-111.873616", distance:5000m)';

            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig
            });

            const geoPoint1 = '33.435967,-111.867710';
            const geoPoint2 = '22.435967,-150.867710';

            expect(match(geoPoint1)).toEqual(true);
            expect(match(geoPoint2)).toEqual(false);
        });

        it('can match results with variables (geo-point object)', () => {
            const variables = {
                point1: { lat: 33.435518, lon: -111.873616 },
                distance1: '5000m'
            };
            const query = 'location:geoDistance(point:$point1 distance: $distance1)';
            const { ast: { instance: { match } } } = new Parser(query, {
                type_config: typeConfig,
                variables
            });

            const geoPoint1 = '33.435967,-111.867710';
            const geoPoint2 = '22.435967,-150.867710';

            expect(match(geoPoint1)).toEqual(true);
            expect(match(geoPoint2)).toEqual(false);
        });
    });
});
