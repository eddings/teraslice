import 'jest-extended';
import { XluceneTypeConfig, XluceneFieldType } from '@terascope/types';
import {
    DataType, DataTypeConfig, LATEST_VERSION
} from '../src';

describe('DataType (xlucene)', () => {
    describe('->toXlucene', () => {
        it('should return a valid xlucene type config', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const xluceneConfig = new DataType(typeConfig).toXlucene();
            expect(xluceneConfig).toEqual({
                hello: 'string',
                location: 'geo-point',
                date: 'date',
                ip: 'ip',
                someNum: 'integer',
            });
        });

        it('should be able to work with nested field', () => {
            const expected: XluceneTypeConfig = {
                hello: XluceneFieldType.Object,
                'hello.there': XluceneFieldType.String
            };

            expect(new DataType({
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Object' },
                    'hello.there': { type: 'Text' },
                },
            }).toXlucene()).toEqual(expected);

            expect(new DataType({
                version: LATEST_VERSION,
                fields: {
                    'hello.there': { type: 'Text' },
                },
            }).toXlucene()).toEqual(expected);
        });
    });
});
