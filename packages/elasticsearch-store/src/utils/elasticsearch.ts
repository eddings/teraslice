import { Client } from 'elasticsearch';
import * as ts from '@terascope/utils';
import { getErrorType } from './errors';
import * as i from '../interfaces';

export function getTimeByField(field = ''): (input: any) => number {
    return (input) => ts.getTime(ts.get(input, field)) || Date.now();
}

export function shardsPath(index: string): (stats: any) => i.Shard[] {
    return (stats) => ts.get(stats, [index, 'shards'], []);
}

export function verifyIndexShards(shards: i.Shard[]): boolean {
    return ts.castArray(shards)
        .filter((shard) => shard.primary)
        .every((shard) => shard.stage === 'DONE');
}

export function timeseriesIndex(index: string, timeSeriesFormat: i.TimeSeriesFormat = 'monthly'): string {
    const formatter = {
        daily: 10,
        monthly: 7,
        yearly: 4,
    };

    const format = formatter[timeSeriesFormat];
    if (!format) throw new Error(`Unsupported format "${timeSeriesFormat}"`);

    const dateStr = new Date().toISOString();
    // remove -* or * at the end of the index name
    const indexName = index.replace(/-{0,1}\*$/, '');
    return `${indexName}-${dateStr.slice(0, format).replace(/-/g, '.')}`;
}

export function filterBulkRetries<T>(records: T[], result: i.BulkResponse): T[] {
    if (!result.errors) return [];

    const retry = [];
    const { items } = result;

    const errorTypes = ['document_already_exists_exception', 'document_missing_exception'];

    for (let index = 0; index < items.length; index += 1) {
        // key could either be create or delete etc, just want the actual data at the value spot
        const { item } = getBulkResponseItem(items[index]);

        // On a create request if a document exists it's not an error.
        // are there cases where this is incorrect?
        if (item.error && item.status !== 409) {
            const type = getErrorType(item);

            if (type === 'es_rejected_execution_exception') {
                // retry this record
                if (records[index] != null) {
                    retry.push(records[index]);
                }
            } else if (errorTypes.includes(type)) {
                const error = new ts.TSError(`${type}--${item.error.reason}`);
                Error.captureStackTrace(error, filterBulkRetries);
                throw error;
            }
        }
    }

    return retry;
}

type BulkResponseItemResult = {
    item: i.BulkResponseItem;
    action: i.BulkAction;
};

/**
 * Get the first key and value from the bulk response:
 *
 * Here is an example input:
 *
 * ```json
  {
     "index": {
        "_index": "test",
        "_type": "type1",
        "_id": "1",
        "_version": 1,
        "result": "created",
        "_shards": {
            "total": 2,
            "successful": 1,
            "failed": 0
        },
        "created": true,
        "status": 201
     }
  }
 * ```
 */
export function getBulkResponseItem(input: any = {}): BulkResponseItemResult {
    return {
        item: ts.getFirstValue(input) as i.BulkResponseItem,
        action: ts.getFirstKey(input) as i.BulkAction,
    };
}

export function getESVersion(client: Client): number {
    const version = ts.get(client, 'transport._config.apiVersion', '6.5');
    if (version && ts.isString(version)) {
        const [majorVersion] = version.split('.');
        return ts.toNumber(majorVersion);
    }
    return 6;
}

export function fixMappingRequest(client: Client, _params: any, isTemplate: boolean) {
    if (!_params || !_params.body) {
        throw new Error('Invalid mapping request');
    }
    const params = ts.cloneDeep(_params);
    const defaultParams: any = {};

    const esVersion = getESVersion(client);
    if (esVersion >= 6) {
        if (params.body.template) {
            if (isTemplate) {
                params.body.index_patterns = ts.castArray(params.body.template).slice();
            }
            delete params.body.template;
        }
    }

    if (esVersion >= 7) {
        const typeMapping = ts.get(params.body, 'mappings', {});
        defaultParams.includeTypeName = false;
        if (typeMapping) {
            delete typeMapping._all;
        }
    }

    return Object.assign({}, defaultParams, params);
}
