import 'jest-extended';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import SimpleESClient from '../src/simple-es-client';
import { ELASTICSEARCH_HOST } from './helpers/config';

describe('SimpleESClient', () => {
    let client: SimpleESClient;

    beforeAll(() => {
        client = new SimpleESClient(
            {
                nodes: ELASTICSEARCH_HOST,
            },
            6
        );
    });

    afterAll(() => {
        client.close();
    });

    describe('index apis', () => {
        describe('when refering to index that does NOT exist', () => {
            const index = 'test_none_existant_index';

            it('should NOT exist', () => {
                return expect(client.indexExists(index)).resolves.toBeFalse();
            });

            it('should reject with an timeout since it is NOT available', () => {
                const timeout = 100;
                return expect(client.indexAvailable(index, timeout)).rejects.toThrowError(/Index \w+ is unavailable/);
            });
        });

        describe('when creating the index', () => {
            const index = 'test_foo_bar_1';
            const dataType = new DataType({
                version: LATEST_VERSION,
                fields: {
                    foo: { type: 'Keyword' },
                },
            });

            const settings = {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0,
            };
            const mappingMetaData = {
                _all: {
                    enabled: false,
                },
                dynamic: false,
            };

            const mapping = dataType.toESMapping({ typeName: 'foo', settings, mappingMetaData });

            beforeAll(() => client.indexCreate(index, mapping));
            afterAll(() => client.indexDelete(index));

            it('should exist', async () => {
                return expect(client.indexExists(index)).resolves.toBeTrue();
            });

            it('should be available', async () => {
                return expect(client.indexAvailable(index)).resolves.toBeTrue();
            });

            it('should NOT be to create it again', async () => {
                return expect(client.indexCreate(index, mapping)).toReject();
            });
        });
    });
});
