import { DataEntity } from '@terascope/utils';
import { Base64Decode } from '../../../src/operations';

describe('Base64Decode operator', () => {
    function encode(str: string) {
        return Buffer.from(str).toString('base64');
    }

    it('can instantiate', () => {
        const opConfig = {
            target: 'final', source: 'source', __id: 'someId', follow: 'otherId'
        };
        expect(() => new Base64Decode(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { target: 1324, __id: 'someId', follow: 'otherId' };
        const badConfig2 = { target: '', __id: 'someId', follow: 'otherId' };
        const badConfig3 = { target: {}, __id: 'someId', follow: 'otherId' };
        const badConfig4 = { target: null, __id: 'someId', follow: 'otherId' };
        const badConfig5 = { source: [], __id: 'someId', follow: 'otherId' };
        const badConfig6 = { source: {}, __id: 'someId', follow: 'otherId' };
        const badConfig7 = { source: null, __id: 'someId', follow: 'otherId' };
        const badConfig8 = {
            source: '', target: '', __id: 'someId', follow: 'otherId'
        };
        // @ts-ignore
        expect(() => new Base64Decode(badConfig1)).toThrow();
        expect(() => new Base64Decode(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig4)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig5)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig6)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig7)).toThrow();
        expect(() => new Base64Decode(badConfig8)).toThrow();
    });

    it('can base64 decode fields', () => {
        const opConfig = {
            source: 'source', target: 'source', __id: 'someId', follow: 'otherId'
        };
        const test = new Base64Decode(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ source: 123423 }, metaData);
        const data2 = new DataEntity({ source: null }, metaData);
        const data3 = new DataEntity({ source: [1324] });
        const data4 = new DataEntity({ source: { some: 'data' } });
        const data5 = new DataEntity({ source: true }, metaData);
        const data6 = new DataEntity({});
        const data7 = new DataEntity({ source: encode('http:// google.com') });
        const data8 = new DataEntity({ source: encode('ha3ke5@pawnage.com') }, metaData);
        const data9 = new DataEntity({ source: encode('::') });
        const data10 = new DataEntity({ source: encode('193.0.0.23') }, metaData);
        const data11 = new DataEntity({ source: encode('hello world') }, metaData);
        const data12 = new DataEntity({ source: [encode('hello world'), encode('other things')] }, metaData);

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);
        const results9 = test.run(data9);
        const results10 = test.run(data10);
        const results11 = test.run(data11);
        const results12 = test.run(data12);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({});
        expect(results2.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(results7).toEqual({ source: 'http:// google.com' });
        expect(results8).toEqual({ source: 'ha3ke5@pawnage.com' });
        expect(results9).toEqual({ source: '::' });
        expect(results10).toEqual({ source: '193.0.0.23' });
        expect(results11.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results11).toEqual({ source: 'hello world' });
        expect(results12).toEqual({ source: ['hello world', 'other things'] });
    });

    it('can base64 decode nested fields', () => {
        const opConfig = {
            source: 'source.field', target: 'source.field', __id: 'someId', follow: 'otherId'
        };
        const test = new Base64Decode(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data = new DataEntity({ source: { field: encode('hello world') } }, metaData);

        const results = test.run(data);

        expect(results.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results).toEqual({ source: { field: 'hello world' } });
    });
});
