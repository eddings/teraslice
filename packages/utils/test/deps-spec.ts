/* eslint-disable max-classes-per-file */
import 'jest-extended';
import { DataEntity } from '../src/entities';
import {
    getTypeOf,
    isPlainObject,
    cloneDeep
} from '../src/deps';

describe('Dependency Utils', () => {
    class TestObj {
        hi = true
        has() {}
    }

    class TestEntity extends DataEntity {
        test = true
    }

    describe('isPlainObject', () => {
        it('should correctly detect the an object type', () => {
            // @ts-ignore
            expect(isPlainObject()).toBeFalse();
            expect(isPlainObject(null)).toBeFalse();
            expect(isPlainObject(true)).toBeFalse();
            expect(isPlainObject([])).toBeFalse();
            expect(isPlainObject([{ hello: true }])).toBeFalse();
            expect(isPlainObject('some-string')).toBeFalse();
            expect(isPlainObject(Buffer.from('some-string'))).toBeFalse();
            expect(isPlainObject(new TestObj())).toBeFalse();
            expect(isPlainObject(new DataEntity({}))).toBeFalse();
            expect(isPlainObject(Promise.resolve())).toBeFalse();
            expect(isPlainObject(Object.create({}))).toBeTrue();
            expect(isPlainObject(Object.create({ hello: true }))).toBeTrue();
            expect(isPlainObject({})).toBeTrue();
            expect(isPlainObject({ hello: true })).toBeTrue();
        });
    });

    describe('getTypeOf', () => {
        it('should return the correct kind', () => {
            expect(getTypeOf({})).toEqual('Object');

            expect(getTypeOf(new DataEntity({}))).toEqual('DataEntity');
            expect(getTypeOf(DataEntity.make({}))).toEqual('DataEntity');
            expect(getTypeOf(new TestEntity({}))).toEqual('TestEntity');

            expect(getTypeOf([])).toEqual('Array');

            const fn = () => 123;

            function hello() {
                return 'hello';
            }

            expect(getTypeOf(fn)).toEqual('Function');
            expect(getTypeOf(hello)).toEqual('Function');

            expect(getTypeOf(Buffer.from('hello'))).toEqual('Buffer');
            expect(getTypeOf('hello')).toEqual('String');

            expect(getTypeOf(123)).toEqual('Number');

            expect(getTypeOf(null)).toEqual('null');
            expect(getTypeOf(undefined)).toEqual('undefined');

            const error = new Error('Hello');
            expect(getTypeOf(error)).toEqual('Error');
        });
    });

    describe('cloneDeep', () => {
        it('should clone deep a plain object', () => {
            const input = { a: 1, b: { c: 2 } };
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            expect(output.b).not.toBe(input.b);
            output.b.c = 3;
            expect(output.b.c).toBe(3);
            expect(input.b.c).toBe(2);
        });

        it('should clone deep an array of objects', () => {
            const input = [{ foo: { bar: 1 } }, { foo: { bar: 1 } }];
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            let i = 0;
            for (const inputItem of input) {
                const outputItem = output[i++];
                expect(outputItem).not.toBe(inputItem);
                outputItem.foo.bar = 10;
                expect(outputItem.foo.bar).toBe(10);
                expect(inputItem.foo.bar).toBe(1);
            }
        });

        it('should clone deep a DataEntity', () => {
            const input = new DataEntity({ a: 1, b: { c: 2 } }, { _key: 'foo' });
            const buf = Buffer.from('foo-bar');
            input.setRawData(buf);
            const output = cloneDeep(input);
            expect(output).toBeInstanceOf(DataEntity);
            // Test data mutation
            expect(output).not.toBe(input);
            expect(output.b).not.toBe(input.b);
            output.b.c = 3;
            expect(output.b.c).toBe(3);
            expect(input.b.c).toBe(2);

            // Test metadata mutation
            expect(output.getMetadata('_key')).toBe('foo');
            output.setMetadata('_key', 'bar');
            expect(output.getMetadata('_key')).toBe('bar');
            expect(input.getMetadata('_key')).toBe('foo');

            // Test raw data mutation
            expect(output.getRawData()).not.toBe(input.getRawData());
            expect(output.getRawData().toString('utf-8'))
                .toEqual(input.getRawData().toString('utf-8'));

            output.setRawData(Buffer.from('changed'));
            expect(output.getRawData().toString('utf-8')).toEqual('changed');
            expect(input.getRawData().toString('utf-8')).toEqual('foo-bar');
        });
    });
});
