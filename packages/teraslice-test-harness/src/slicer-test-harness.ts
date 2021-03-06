import {
    SlicerExecutionContext,
    JobConfig,
    Slice,
    SliceRequest,
    SliceResult,
    ExecutionStats,
    SlicerCore,
    TSError,
    SlicerRecoveryData,
    times,
    isPlainObject,
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness';
import { JobHarnessOptions } from './interfaces';

/**
 * A test harness for testing Operations that run on
 * the Execution Controller, mainly the Slicer.
 * This is useful for testing Slicers.
*/
export default class SlicerTestHarness extends BaseTestHarness<SlicerExecutionContext> {
    readonly stats: ExecutionStats = {
        workers: {
            available: 1,
            connected: 1,
        },
        slices: {
            processed: 0,
            failed: 0,
        }
    };

    private _emitInterval: any;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        super(job, options, 'execution_controller');

        const { config } = this.executionContext;
        if (config.recovered_execution && !this.slicer().isRecoverable()) {
            throw new Error('Slicer is not recoverable');
        }
    }

    slicer<T extends SlicerCore = SlicerCore>(): T {
        return this.executionContext.slicer<T>();
    }

    /**
     * Initialize the Operations on the ExecutionContext
     * @param recoveryData is an array of starting points to recover from
    */
    async initialize(recoveryData: SlicerRecoveryData[] = []) {
        await super.initialize();
        // teraslice checks to see if slicer is recoverable
        // should throw test recoveryData if slicer is not recoverable
        if (recoveryData.length > 0) {
            if (!this.executionContext.slicer().isRecoverable()) throw new TSError('Slicer is not recoverable, please create the isRecoverable method and return true to enable recovery');
            if (!recoveryData.every(isPlainObject)) throw new Error('recoveryData is malformed');
        }

        await this.executionContext.initialize(recoveryData);
        this.executionContext.onExecutionStats(this.stats);
        this._emitInterval = setInterval(() => {
            this.executionContext.onExecutionStats(this.stats);
        }, 100);
    }

    /**
     * Create Slices, always returns an Array of slices or slice requests.
     * To adjust the number of slicers change the job configuration
     * when constructing this class.
     *
     * If the slicers are done, you should expect a null value for every slicer
     *
     * @param options an optional object of additional configruation
     * @param options.fullResponse if specified the full slice result
     * including the slice_id, slicer_id, slicer_order.
     *
     * @returns an array of Slices including the metadata or the just the Slice Request.
    */
    async createSlices(): Promise<SliceRequest[]>;
    async createSlices(options: { fullResponse: false }): Promise<SliceRequest[]>;
    async createSlices(options: { fullResponse: true }): Promise<Slice[]>;
    async createSlices({ fullResponse = false } = {}): Promise<SliceRequest[]|Slice[]> {
        const slicers = this.slicer().slicers();
        await this.slicer().handle();

        const slices = this.slicer().getSlices(10000);
        const sliceRequests = [];
        const slicesBySlicers: (Slice[])[] = [];

        for (const slice of slices) {
            if (slicesBySlicers[slice.slicer_id] == null) {
                slicesBySlicers[slice.slicer_id] = [];
            }
            slicesBySlicers[slice.slicer_id].push(slice);
        }

        for (const perSlicer of slicesBySlicers) {
            const sorted = perSlicer.sort((a, b) => a.slicer_order - b.slicer_order);
            sorted.forEach((slice) => {
                this.executionContext.onSliceEnqueued(slice);
            });

            if (fullResponse) {
                sliceRequests.push(...sorted);
            } else {
                const mapped = sorted.map(({ request }) => request);
                sliceRequests.push(...mapped);
            }
        }

        const remaining = slicers - sliceRequests.length;
        if (remaining > 0) {
            const nulls = times(remaining, () => null);
            return sliceRequests.concat(nulls);
        }

        return sliceRequests;
    }

    setWorkers(count: number) {
        this.stats.workers.connected = count;
        this.stats.workers.available = count;
        this.executionContext.onExecutionStats(this.stats);
    }

    onSliceDispatch(slice: Slice) {
        this.executionContext.onSliceDispatch(slice);
    }

    onSliceComplete(result: SliceResult) {
        this.executionContext.onSliceComplete(result);
    }

    /**
     * Shutdown the Operations on the ExecutionContext
    */
    async shutdown() {
        if (this._emitInterval) {
            clearInterval(this._emitInterval);
        }
        await super.shutdown();
        await this.executionContext.shutdown();
    }
}
