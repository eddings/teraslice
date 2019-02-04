import 'jest-extended';
import { LuceneQueryAccess } from '../src';

describe('LuceneQueryAccess', () => {
    describe('when constructed with exclusive fields', () => {
        // @ts-ignore
        const queryAccess = new LuceneQueryAccess({
            exclude: [
                'bar',
                'moo',
                'baa.maa',
                'a.b',
            ]
        });

        describe('when passed queries with foo in field', () => {
            it('should return the input query', () => {
                const query = 'foo:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed queries with bar in field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'bar:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field bar is restricted');
            });

            it('should throw when input query is restricted with nested fields', () => {
                const query = 'bar.hello:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field bar.hello is restricted');
            });
        });

        describe('when passed queries with moo in field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'moo:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field moo is restricted');
            });
        });

        describe('when passed queries with a nested baa.maa field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'baa.maa:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field baa.maa is restricted');
            });
        });

        describe('when passed queries with baa.chaa field', () => {
            it('should return the input query', () => {
                const query = 'baa.chaa:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed queries with a nested a.b.c field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'a.b.c:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field a.b.c is restricted');
            });
        });

        describe('when passed queries with a.b.e field', () => {
            it('should return the input query', () => {
                const query = 'a.b.e:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed queries with a.b.c field', () => {
            it('should return the input query', () => {
                const query = 'a.b.c:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });
    });
});
