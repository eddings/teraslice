import 'jest-extended';
import es from 'elasticsearch';
import { times, pDelay, DataEntity } from '@terascope/utils';
import simpleMapping from './fixtures/simple-mapping.json';
import { SimpleRecord } from './helpers/simple-index';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexStore } from '../src';

describe('IndexStore', () => {
    const client = new es.Client({});

    describe('when constructed with nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new IndexStore();
            }).toThrowError('IndexStore requires elasticsearch client');
        });
    });

    describe('when constructed without a config', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new IndexStore(client);
            }).toThrowError('IndexStore requires a valid config');
        });
    });

    describe('when constructed', () => {
        const index = 'test__store-v1-s1';

        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const indexStore = new IndexStore<SimpleRecord>(client, {
            index: 'test__store',
            indexSchema: {
                version: 'v1.0.0',
                mapping: simpleMapping,
                strict: true,
            },
            version: 'v1.0.0',
            indexSettings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 1
            },
            bulkMaxSize: 4,
            bulkMaxWait: 300
        });

        beforeAll(async () => {
            await client.indices.delete({
                index
            }).catch(() => {});

            await indexStore.initialize();
        });

        afterAll(async () => {
            await client.indices.delete({
                index
            }).catch(() => {});

            await indexStore.shutdown();
        });

        it('should create the versioned index', async () => {
            const exists = await client.indices.exists({ index });

            expect(exists).toBeTrue();
        });

        describe('when dealing with a record', () => {
            const record = {
                test_id: 'hello-1234',
                test_keyword: 'hello',
                test_object: {
                    some_obj: true,
                },
                test_number: 1234,
                test_boolean: false,
            };

            beforeAll(() => {
                return indexStore.create(record, record.test_id);
            });

            it('should not be able to create a record again', () => {
                return expect(indexStore.create(record, record.test_id))
                    .rejects.toThrowError('Document Already Exists');
            });

            it('should be able to index the same record', () => {
                return indexStore.indexWithId(record, record.test_id);
            });

            it('should be able to index the record without an id', async () => {
                const lonelyRecord = {
                    test_id: 'lonely-1234',
                    test_keyword: 'other',
                    test_object: {},
                    test_number: 1234,
                    test_boolean: false,
                };

                await indexStore.index(lonelyRecord);

                const count = await indexStore.count(`test_id: ${lonelyRecord.test_id}`);
                expect(count).toBe(1);
            });

            it('should be able to index a different record with id', async () => {
                const otherRecord = {
                    test_id: 'other-1234',
                    test_keyword: 'other',
                    test_object: {},
                    test_number: 1234,
                    test_boolean: false,
                };

                await indexStore.indexWithId(otherRecord, otherRecord.test_id);

                const count = await indexStore.count(`test_id: ${otherRecord.test_id}`);
                expect(count).toBe(1);
            });

            it('should be able to get the count', () => {
                return expect(indexStore.count(`test_id: ${record.test_id}`))
                    .resolves.toBe(1);
            });

            it('should get zero when the using the wrong id', () => {
                return expect(indexStore.count('test_id: wrong-id'))
                    .resolves.toBe(0);
            });

            it('should be able to update the record', async () => {
                await indexStore.update({
                    test_number: 4231
                }, record.test_id);

                const updated = await indexStore.get(record.test_id);
                expect(updated).toHaveProperty('test_number', 4231);

                await indexStore.update(record, record.test_id);
            });

            it('should throw when updating a record that does not exist', () => {
                return expect(indexStore.update({
                    test_number: 1,
                }, 'wrong-id')).rejects.toThrowError('Not Found');
            });

            it('should be able to get the record by id', async () => {
                const r = await indexStore.get(record.test_id);

                expect(DataEntity.isDataEntity(r)).toBeTrue();
                expect(r).toEqual(record);
                expect(r.getMetadata()).toMatchObject({
                    _index: index,
                    _id: record.test_id,
                    _type: 'test__store'
                });
            });

            it('should throw when getting a record that does not exist', () => {
                return expect(indexStore.get('wrong-id'))
                    .rejects.toThrowError('Not Found');
            });

            it('should be able to remove the record', () => {
                return indexStore.remove(record.test_id);
            });

            it('should throw when trying to remove a record that does not exist', () => {
                return expect(indexStore.remove('wrong-id'))
                    .rejects.toThrowError('Not Found');
            });
        });

        describe('when dealing with multiple a records', () => {
            const keyword = 'example-record';
            const records = [
                {
                    test_id: 'example-1',
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_number: 5555,
                    test_boolean: true,
                },
                {
                    test_id: 'example-2',
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_number: 3333,
                    test_boolean: true,
                },
                {
                    test_id: 'example-3',
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_number: 999,
                    test_boolean: true,
                }
            ];

            beforeAll(async () => {
                await Promise.all(records.map((record) => {
                    return indexStore.create(record, record.test_id, {
                        refresh: false
                    });
                }));

                await indexStore.refresh();
            });

            it('should be able to mget all of the records', async () => {
                const docs = records.map((r) => ({
                    _id: r.test_id
                }));

                const result = await indexStore.mget({ docs });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toEqual(records);
            });

            it('should be able to search the records', async () => {
                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_id'
                });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toEqual(records);
            });
        });

        describe('when bulk sending records', () => {
            const keyword = 'bulk-record';
            const records = times(9, (n) => ({
                test_id: `bulk-${n + 1}`,
                test_keyword: keyword,
                test_object: { bulk: true },
                test_number: (n + 10) * 2,
                test_boolean: true,
            }));

            beforeAll(async () => {
                for (const record of records) {
                    await indexStore.bulk(record);
                }

                await pDelay(500);
                await indexStore.refresh();
            });

            it('should be able to search the records', async () => {
                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_id'
                });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toBeArrayOfSize(records.length);
            });
        });
    });
});
