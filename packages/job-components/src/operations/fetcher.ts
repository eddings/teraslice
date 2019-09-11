import { EntityResult, DataWindow, makeWindowResult } from '@terascope/utils';
import { OpConfig } from '../interfaces';
import FetcherCore from './core/fetcher-core';

/**
 * The simpliest varient of "Fetcher"
 */

export default abstract class Fetcher<T = OpConfig> extends FetcherCore<T> {
    /**
     * A method called by {@link Fetcher#handle}
     * @returns a DataEntity compatible array
    */
    abstract async fetch(sliceRequest?: any): Promise<EntityResult>;

    async handle(sliceRequest?: any): Promise<DataWindow|DataWindow[]> {
        return makeWindowResult(await this.fetch(sliceRequest));
    }
}
