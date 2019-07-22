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
            const template = 'foo';
            const templateVersion = 1;
            const dataType = new DataType({
                version: LATEST_VERSION,
                fields: {
                    foo: { type: 'Keyword' },
                },
            });

            const overrides = {
                template,
                version: templateVersion,
                settings: {
                    'index.number_of_shards': 1,
                    'index.number_of_replicas': 0,
                },
            };

            const mapping = dataType.toESMapping({ typeName: 'foo', overrides });

            beforeAll(() => client.indexCreate(index, mapping));
            afterAll(async () => {
                await client.indexDelete(index);
                await client.templateDelete(template);
            });

            it('should exist', async () => {
                return expect(client.indexExists(index)).resolves.toBeTrue();
            });

            it('should be available', async () => {
                return expect(client.indexAvailable(index)).resolves.toBeTrue();
            });

            it('should NOT be to create it again', async () => {
                return expect(client.indexCreate(index, mapping)).rejects.toThrow();
            });

            it('should be able to create a template', () => {
                return expect(client.templateUpsert(mapping)).resolves.toBeTrue();
            });

            it('should be able to update a template', () => {
                return expect(client.templateUpsert(mapping)).resolves.toBeFalse();
            });
        });
    });

    describe('when using the document apis', () => {
        const index = 'test_foo_bar_2';
        const typeName = 'foo';
        const dataType = new DataType({
            version: LATEST_VERSION,
            fields: {
                id: { type: 'Keyword' },
                foo: { type: 'Keyword' },
                bar: { type: 'Keyword' },
            },
        });

        const overrides = {
            settings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0,
            },
        };

        const mapping = dataType.toESMapping({ typeName, overrides });

        beforeAll(() => client.indexCreate(index, mapping));
        afterAll(async () => {
            await client.indexDelete(index);
        });

        describe('when the document does not exist', () => {
            it('should be able to upsert a record without an id', () => {
                return expect(
                    client.docUpsert({
                        doc: {
                            id: 'unique-id-0',
                            foo: 'hello',
                            bar: 'hi',
                        },
                        refresh: true,
                        type: typeName,
                        index,
                    })
                ).resolves.toMatchObject({
                    created: true,
                    version: 1,
                });
            });

            it('should be able to upsert a record with an id', () => {
                const id = 'unique-id-1';
                return expect(
                    client.docUpsert({
                        id,
                        doc: {
                            id,
                            foo: 'hello',
                            bar: 'hi',
                        },
                        refresh: true,
                        type: typeName,
                        index,
                    })
                ).resolves.toMatchObject({
                    id,
                    created: true,
                    version: 1,
                });
            });
        });

        describe('when the document does exist', () => {
            const id = 'unique-id-2';
            const doc = {
                id,
                foo: 'howdy',
                bar: 'sup',
            };

            beforeAll(() => {
                return client.docUpsert({
                    id,
                    doc,
                    refresh: true,
                    type: typeName,
                    index,
                });
            });

            it('should be able to update it', () => {
                return expect(
                    client.docUpsert({
                        id,
                        doc: {
                            ...doc,
                            bar: 'aloha',
                        },
                        refresh: true,
                        type: typeName,
                        index,
                    })
                ).resolves.toMatchObject({
                    id,
                    created: false,
                    version: 2,
                });
            });
        });
    });
});
