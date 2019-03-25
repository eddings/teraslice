import 'jest-extended';
import get from 'lodash/get';
import { debugLogger } from '@terascope/utils';
import { Translator, TypeConfig, LuceneQueryParser } from '../src';
import { getJoinType } from '../src/translator/utils';

const logger = debugLogger('translator-spec');

describe('Translator', () => {
    it('should have a query property', () => {
        const query = 'foo:bar';
        const translator = new Translator(query);

        expect(translator).toHaveProperty('query', query);
    });

    it('should have a types property', () => {
        const query = 'foo:bar';
        const types: TypeConfig = {
            location: 'geo',
        };

        const translator = new Translator(query, types);

        expect(translator).toHaveProperty('types', types);
    });

    describe.each([
        [
            '*',
            'query.constant_score.filter.bool.filter',
            []
        ],
        [
            'hello:world',
            'query.constant_score.filter.bool.filter',
            [
                {
                    term: {
                        hello: 'world'
                    }
                }
            ]
        ],
        [
            'hello:w?rld',
            'query.constant_score.filter.bool.filter',
            [
                {
                    wildcard: {
                        hello: 'w?rld'
                    }
                }
            ]
        ],
        [
            '_exists_:hello',
            'query.constant_score.filter.bool.filter',
            [
                {
                    exists: {
                        field: 'hello'
                    }
                }
            ]
        ],
        [
            'hello:/w.*ld/',
            'query.constant_score.filter.bool.filter',
            [
                {
                    regexp: {
                        hello: 'w.*ld'
                    }
                }
            ]
        ],
        [
            'example_count:>=30',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            gte: 30
                        }
                    }
                }
            ]
        ],
        [
            'example_count:>30',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            gt: 30
                        }
                    }
                }
            ]
        ],
        [
            'example_count:<50',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            lt: 50
                        }
                    }
                }
            ]
        ],
        [
            'example_count:<=50',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            lte: 50
                        }
                    }
                }
            ]
        ],
        [
            'any_count:(50 OR 40 OR 30)',
            'query.constant_score.filter.bool',
            {
                filter: [],
                should: [
                    {
                        term: {
                            any_count: 50,
                        }
                    },
                    {
                        term: {
                            any_count: 40,
                        }
                    },
                    {
                        term: {
                            any_count: 30,
                        }
                    }
                ],
                must_not: [],
            }
        ],
        [
            'id:(hi OR hello OR howdy OR aloha OR hey OR sup)',
            'query.constant_score.filter.bool',
            {
                filter: [],
                should: [
                    {
                        term: {
                            id: 'hi',
                        }
                    },
                    {
                        term: {
                            id: 'hello',
                        }
                    },
                    {
                        term: {
                            id: 'howdy',
                        }
                    },
                    {
                        term: {
                            id: 'aloha',
                        }
                    },
                    {
                        term: {
                            id: 'hey',
                        }
                    },
                    {
                        term: {
                            id: 'sup',
                        }
                    }
                ],
                must_not: [],
            }
        ],
        [
            'some:query AND other:thing',
            'query.constant_score.filter.bool.filter',
            [
                {
                    term: {
                        some: 'query',
                    }
                },
                {
                    term: {
                        other: 'thing',
                    }
                }
            ]
        ],
        [
            'NOT value:awesome AND other:thing',
            'query.constant_score.filter.bool',
            {
                filter: [
                    {
                        term: {
                            other: 'thing'
                        }
                    }
                ],
                must_not: [
                    {
                        term: {
                            value: 'awesome'
                        }
                    }
                ],
                should: []
            }
        ],
        [
            '_exists_:howdy AND other:>=50 OR foo:bar NOT bar:foo',
            'query.constant_score.filter.bool',
            {
                filter: [
                    {
                        exists: {
                            field: 'howdy'
                        }
                    },
                    {
                        range: {
                            other: {
                                gte: 50
                            }
                        }
                    },
                ],
                must_not: [
                    {
                        term: {
                            bar: 'foo'
                        }
                    }
                ],
                should: [
                    {
                        term: {
                            foo: 'bar'
                        }
                    },
                ],
            }
        ],
        [
            'some:key AND (_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322))',
            'query.constant_score.filter.bool.filter',
            [
                {
                    term: {
                        some: 'key'
                    }
                },
                {
                    range: {
                        _created: {
                            gte: '2018-10-18T18:13:20.683Z'
                        }
                    }
                },
                {
                    range: {
                        bytes: {
                            gte: 150000,
                            lte: 1232322
                        }
                    }
                }
            ]
        ],
        [
            'some:query OR other:thing',
            'query.constant_score.filter.bool',
            {
                filter: [],
                must_not: [],
                should: [
                    {
                        term: {
                            some: 'query'
                        }
                    },
                    {
                        term: {
                            other: 'thing'
                        }
                    },
                ]
            }
        ],
        [
            'some:query NOT other:thing',
            'query.constant_score.filter.bool',
            {
                filter: [
                    {
                        term: {
                            some: 'query'
                        }
                    }
                ],
                must_not: [
                    {
                        term: {
                            other: 'thing'
                        }
                    }
                ],
                should: []
            }
        ],
        [
            'location:(_geo_box_top_left_:"34.5234,79.42345" _geo_box_bottom_right_:"54.5234,80.3456")',
            'query.constant_score.filter.bool.filter',
            [
                {
                    geo_bounding_box: {
                        location: {
                            top_left: '34.5234,79.42345',
                            bottom_right: '54.5234,80.3456'
                        }
                    }
                }
            ]
        ],
        [
            'loc:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)',
            'query.constant_score.filter.bool.filter',
            [
                {
                    geo_distance: {
                        distance: '5000m',
                        loc: '33.435518,-111.873616'
                    }
                }
            ]
        ]
    // @ts-ignore because the types for test.each for some reason
    ])('when given %s', (query: string, property: string, expected: any, types: TypeConfig) => {
        it('should translate the query correctly', () => {
            const translator = new Translator(query, types);
            const result = translator.toElasticsearchDSL();

            logger.trace('test result', JSON.stringify({
                query,
                expected,
                property,
                actual: get(result, property),
            }, null, 4));

            expect(result).toHaveProperty(property, expected);
        });
    });

    describe('when getting the join type', () => {
        describe('when given a complex AND/OR/NOT AST', () => {
            const parser = new LuceneQueryParser();
            parser.parse('_exists_:howdy AND other:>=50 OR foo:bar NOT bar:foo');
            const node = parser._ast;

            it('should correctly handle the AND join type', () => {
                expect(getJoinType(node, 'left')).toEqual('filter');
                expect(getJoinType(node, 'right')).toEqual('filter');
            });

            it('should correctly handle the OR join type', () => {
                expect(getJoinType(node.right!, 'left')).toEqual('filter');
                expect(getJoinType(node.right!, 'right')).toEqual('should');
            });

            it('should correctly handle the NOT join type', () => {
                expect(getJoinType(node.right!.right!, 'left')).toEqual('should');
                expect(getJoinType(node.right!.right!, 'right')).toEqual('must_not');
            });
        });

        describe('when given a chained OR statement AST', () => {
            const parser = new LuceneQueryParser();
            parser.parse('any_count:(50 OR 40 OR 30)');
            const node = parser._ast;

            it('should correctly handle the first OR join type', () => {
                expect(getJoinType(node, 'left')).toEqual('should');
            });

            it('should correctly handle the second OR join type', () => {
                expect(getJoinType(node.left!, 'left')).toEqual('should');
                expect(getJoinType(node.left!, 'right')).toEqual('should');
            });

            it('should correctly handle the third OR join type', () => {
                expect(getJoinType(node.left!.right!, 'left')).toEqual('should');
                expect(getJoinType(node.left!.right!, 'right')).toEqual('should');
            });
        });

        describe('when given a simple OR statement AST', () => {
            const parser = new LuceneQueryParser();
            parser.parse('some:query OR other:thing');
            const node = parser._ast;

            it('should correctly handle the OR join type', () => {
                expect(getJoinType(node, 'left')).toEqual('should');
                expect(getJoinType(node, 'right')).toEqual('should');
            });
        });
    });
});
