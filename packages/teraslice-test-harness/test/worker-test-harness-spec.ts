import 'jest-extended';
import path from 'path';
import {
    newTestJobConfig,
    newTestSlice,
    DataEntity,
    Fetcher,
    BatchProcessor,
    NoopProcessor,
    RunSliceResult
} from '@terascope/job-components';
import { WorkerTestHarness } from '../src';

describe('WorkerTestHarness', () => {
    const clients = [
        {
            type: 'example',
            create: () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                }
            })
        }
    ];

    describe('when given a valid job config', () => {
        const job = newTestJobConfig();
        job.max_retries = 2;
        job.analytics = true;
        job.operations = [
            {
                _op: 'test-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const workerHarness = new WorkerTestHarness(job, {
            assetDir: path.join(__dirname, 'fixtures'),
            clients
        });

        workerHarness.processors[0].handle = jest.fn(async (data: DataEntity[]) => {
            return data;
        });

        it('should be able to call initialize', () => {
            return expect(workerHarness.initialize()).resolves.toBeNil();
        });

        it('should have fetcher', () => {
            expect(workerHarness.fetcher()).toBeInstanceOf(Fetcher);
        });

        it('should have on processor', () => {
            expect(workerHarness.processors).toBeArrayOfSize(1);
            expect(workerHarness.processors[0]).toBeInstanceOf(BatchProcessor);
        });

        it('should be able to call runSlice', async () => {
            const result = await workerHarness.runSlice(newTestSlice());
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should be able to call runSlice with just a request object', async () => {
            const result = await workerHarness.runSlice({ hello: true });
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should call slice retry', async () => {
            const onSliceRetryEvent = jest.fn();
            workerHarness.events.on('slice:retry', onSliceRetryEvent);
            const err = new Error('oh no');

            workerHarness.processors[0].handle
                // @ts-ignore
                .mockClear()
                // @ts-ignore
                .mockRejectedValueOnce(err)
                // @ts-ignore
                .mockRejectedValueOnce(err);

            const results = await workerHarness.runSlice({ });
            expect(results).toBeArray();

            expect(onSliceRetryEvent).toHaveBeenCalledTimes(2);
            expect(workerHarness.getOperation<NoopProcessor>('noop').handle).toHaveBeenCalledTimes(3);
        });

        it('should be able to call runSlice with fullResponse', async () => {
            const result = await workerHarness.runSlice(newTestSlice(), { fullResponse: true });
            expect(result.analytics).not.toBeNil();
            expect(result.results).toBeArray();
        });

        it('should be able to call shutdown', () => {
            return expect(workerHarness.shutdown()).resolves.toBeNil();
        });
    });

    describe('can use static helper shorthand methods', () => {
        const options = { assetDir: path.join(__dirname, 'fixtures') };

        it('can call testProcessor for easy instantiation', async() => {
            const data = { some: 'data' };
            const data2 = [{ some: 'data' }];

            const harness = WorkerTestHarness.testProcessor({ _op: 'noop' }, options);
            await harness.initialize();

            const results1 = await harness.runSlice(data);
            expect(results1).toEqual(data2);

            const results2 = await harness.runSlice(data2);
            expect(results2).toEqual(data2);

            await harness.shutdown();
        });

        it('can call testFetcher for easy instantiation', async() => {
            const data = { some: 'data' };
            const data2 = [{ some: 'data' }];

            const harness = WorkerTestHarness.testFetcher({ _op: 'test-reader' }, options);
            await harness.initialize();

            const results1 = await harness.runSlice(data);
            expect(results1).toEqual(data2);

            const results2 = await harness.runSlice(data2);
            expect(results2).toEqual(data2);

            await harness.shutdown();
        });
    });

    describe('can call lifecyle events', () => {
        const options = { assetDir: path.join(__dirname, 'fixtures') };

        it('can call flush', async() => {
            const data = [{ some: 'data' }, { other: 'data' }];
            const harness = WorkerTestHarness.testProcessor({ _op: 'simple-flush' }, options);

            await harness.initialize();

            const results1 = await harness.runSlice(data);
            expect(results1).toEqual([]);

            const results2 = await harness.flush();
            expect(results2).toEqual(data);
        });

        it('can get full flush response', async() => {
            const data = [{ some: 'data' }, { other: 'data' }];

            const job = newTestJobConfig({
                max_retries: 0,
                analytics: true,
                operations: [
                    {
                        _op: 'test-reader',
                    },
                    { _op: 'simple-flush' }
                ],
            });
            const harness =  new WorkerTestHarness(job, options);

            await harness.initialize();

            const results1 = await harness.runSlice(data);
            expect(results1).toEqual([]);

            const flushedData = await harness.flush({ fullResponse: true }) as RunSliceResult;

            expect(flushedData).toBeDefined();
            expect(flushedData.results).toEqual(data);
            expect(flushedData.status).toEqual('flushed');
            expect(flushedData.analytics).toBeDefined();
            expect(flushedData.analytics!.time).toBeDefined();
            expect(flushedData.analytics!.memory).toBeDefined();
            expect(flushedData.analytics!.size).toBeDefined();
        });

    });
});
