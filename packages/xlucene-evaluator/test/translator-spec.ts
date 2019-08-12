import 'jest-extended';
import { debugLogger, get, times } from '@terascope/utils';
import { buildAnyQuery } from '../src/translator/utils';
import { Translator, TypeConfig } from '../src';
import { AST, Parser } from '../src/parser';
import allTestCases from './cases/translator';

const logger = debugLogger('translator-spec');

describe('Translator', () => {
    it('should have a query property', () => {
        const query = 'foo:bar';
        const translator = new Translator(query);

        expect(translator).toHaveProperty('query', query);
    });

    it('should return undefined when given an invalid query', () => {
        const node: unknown = { type: 'idk', field: 'a', val: true };
        expect(buildAnyQuery(node as AST, new Parser(''))).toBeUndefined();
    });

    it('should have a types property', () => {
        const query = 'foo:bar';
        const typeConfig: TypeConfig = {
            location: 'geo',
        };

        const translator = new Translator(query, typeConfig);

        expect(translator).toHaveProperty('typeConfig', typeConfig);
    });

    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, property, expected, types) => {
                it('should translate the query correctly', () => {
                    const translator = new Translator(query, types);
                    const result = translator.toElasticsearchDSL();

                    const actual = get(result, property);
                    logger.trace(
                        'test result',
                        JSON.stringify(
                            {
                                query,
                                expected,
                                property,
                                actual,
                            },
                            null,
                            4
                        )
                    );

                    if (!actual) {
                        expect(result).toHaveProperty(property);
                    } else {
                        expect(actual).toEqual(expected);
                    }
                });
            });
        });
    }

    describe('when testing edge cases', () => {
        describe('given a gigantic query', () => {
            it('should be able to translate it', () => {
                const randomFloat = (n: number) => {
                    return Math.random() * n;
                };

                const randomInt = (n: number) => {
                    return Math.round(randomFloat(n));
                };

                const randomVal = (n: number): string => {
                    if (Math.random() < Math.random()) {
                        return `(${randomInt(n)} ${randomInt(n)} ${randomInt(n)})`;
                    }
                    if (Math.random() < Math.random()) {
                        return `[* TO ${randomInt(n)}}`;
                    }
                    if (Math.random() < Math.random()) {
                        return '/[a-z]+/';
                    }
                    if (Math.random() < Math.random()) {
                        return 'hi:the?e';
                    }
                    if (Math.random() < Math.random()) {
                        return `>=${randomInt(n)}`;
                    }
                    if (Math.random() < Math.random()) {
                        return `<${randomFloat(n)}`;
                    }
                    if (Math.random() < Math.random()) {
                        return '[2012-01-01 TO 2012-12-31]';
                    }
                    if (Math.random() < Math.random()) {
                        return `[* TO ${randomInt(n)}}`;
                    }
                    if (Math.random() < Math.random()) {
                        return `(_geo_point_:"${randomFloat(n)},${randomFloat(n)}" _geo_distance_:${randomInt(n)}m)`;
                    }
                    return '"some-random-string"';
                };

                const joinParts = (parts: string[]) => {
                    return parts
                        .map((part, i, arr) => {
                            if (i + 1 === arr.length) return `${part}`;
                            if (i % 2 === 0) return `(${part}) OR`;
                            if (i % 5 === 0) return `${part} OR`;
                            if (i % 7 === 0) return `${part} AND NOT`;
                            return `(${part}) AND`;
                        })
                        .join(' ');
                };

                const joinOR = (s: string[], n: number) => s.join(n % 10 === 0 ? ') OR (' : ' OR ');

                const partsA = times(20, (n) => joinOR(times(20, (i) => `example_a_${n}_${i}:${randomVal(n)}`), n));
                const partsB = times(20, (n) => joinOR(times(20, (i) => `example_b_${n}_${i}:${randomVal(n)}`), n));
                const partsC = times(20, (n) => joinOR(times(20, (i) => `example_c_${n}_${i}:${randomVal(n)}`), n));
                const query = joinParts([partsA, partsB, partsC].map(joinParts));

                const translator = new Translator(query);
                const result = translator.toElasticsearchDSL();
                expect(result).toMatchObject({
                    query: {
                        constant_score: {
                            filter: {
                                bool: {},
                            },
                        },
                    },
                });
            });
        });
    });

    describe('when given an empty string', () => {
        it('should translate it to an empty query', () => {
            const translator = new Translator('');
            const result = translator.toElasticsearchDSL();
            expect(result).toEqual({
                query: {
                    match_all: {},
                },
            });
        });
    });
});
