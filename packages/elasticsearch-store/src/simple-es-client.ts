import * as es6 from 'elasticsearch6';
import * as ts from '@terascope/utils';
import * as dt from '@terascope/data-types';
import { getRetryConfig } from './utils';

/**
 * A limited/simple api abstraction for the elasticsearch client
 */
export default class SimpleESClient {
    client: es6.Client;

    constructor(options: es6.ClientOptions, version: 6 = 6) {
        if (version !== 6) {
            throw new Error(`Unsupported elasticsearch client version ${version}`);
        }
        this.client = new es6.Client(options);
    }

    async indexAvailable(index: string, timeout?: number) {
        try {
            await ts.pWhile(async () => this._checkIndexAvailable(index), {
                timeoutMs: timeout || -1,
                enabledJitter: true,
            });
            return true;
        } catch (err) {
            throw new ts.TSError(err, {
                reason: `Index ${index} is unavailable`,
                statusCode: 503,
            });
        }
    }

    async indexExists(index: string): Promise<boolean> {
        const response = await ts.pRetry(
            () =>
                this.client.indices.exists({
                    index,
                }),
            getRetryConfig()
        );
        return response.body;
    }

    async indexCreate(index: string, mapping: dt.ESMapping) {
        return ts.pRetry(
            () =>
                this.client.indices.create({
                    index,
                    body: mapping,
                }),
            getRetryConfig()
        );
    }

    async indexDelete(index: string) {
        return ts.pRetry(
            () =>
                this.client.indices.delete({
                    index,
                    ignore_unavailable: true,
                }),
            getRetryConfig()
        );
    }

    async indexRefresh(index: string) {
        return ts.pRetry(() => this.client.indices.refresh({ index }), getRetryConfig());
    }

    /**
     * Safely create or update a template
     */
    async templateUpsert(mapping: dt.ESMapping): Promise<boolean> {
        const { template: name, version } = mapping;
        if (!name) {
            throw new ts.TSError('Template mapping requires `template` property');
        }

        if (version != null) {
            const template = await this.templateGet(name);
            if (template) {
                const latestVersion = template.version;
                if (version === latestVersion) return false;
            }
        }

        await ts.pRetry(
            () =>
                this.client.indices.putTemplate({
                    include_type_name: true,
                    body: {
                        ...mapping,
                        version,
                    },
                    name,
                }),
            getRetryConfig()
        );
        return true;
    }

    async templateGet(name: string): Promise<any> {
        const { body } = await ts.pRetry(async () => {
            try {
                return await this.client.indices.getTemplate({
                    name,
                    flat_settings: true,
                });
            } catch (err) {
                if (err && err.statusCode === 404) {
                    return { body: {} };
                }
                throw err;
            }
        }, getRetryConfig());

        return body[name];
    }

    /**
     * Safely create or update a template
     */
    async templateDelete(name: string) {
        await ts.pRetry(
            () =>
                this.client.indices.deleteTemplate({
                    name,
                }),
            getRetryConfig()
        );
    }

    close() {
        this.client.close();
    }

    async docGet<T extends object>(param: DocGetParam<T>): Promise<DocGetResult<T>> {
        const { id, index, type, includes, excludes, ...fns } = param;
        const { body } = await ts.pRetry(
            () =>
                this.client.get({
                    id,
                    index,
                    type,
                    _source_includes: includes,
                    _source_excludes: excludes,
                }),
            getRetryConfig()
        );

        return this._resultToDataEntity(body, fns);
    }

    async docUpsert<T extends object>(param: DocUpsertParam<T>): Promise<DocUpsertResult<T>> {
        if (!param.index) {
            throw new ts.TSError('Document Upsert requires index');
        }

        const { body } = await ts.pRetry(
            () =>
                this.client.index({
                    id: param.id,
                    index: param.index,
                    type: param.type,
                    body: param.doc,
                    refresh: param.refresh ? 'true' : 'false',
                }),
            getRetryConfig()
        );

        const created = body.result === 'created';

        return {
            id: body._id,
            created,
            version: body._version,
        };
    }

    private async _checkIndexAvailable(index: string): Promise<boolean> {
        try {
            await this.client.search({
                q: '',
                size: 0,
                terminate_after: 1,
                index,
            });
            return true;
        } catch (err) {
            return false;
        }
    }

    private _resultToDataEntity<T extends object>(result: any, fns: DocFns<T>): ts.DataEntity<T> {
        const { getIngestTime, getEventTime } = this._getDocFns<T>(fns);

        return ts.DataEntity.make<T, ESDataEntityMetadata>(result._source, {
            _key: result._id,
            _processTime: timeFn(),
            _ingestTime: getIngestTime(result._source),
            _eventTime: getEventTime(result._source),
            _index: result._index,
            _type: result._type,
            _version: result._version,
        });
    }

    private _getDocFns<T extends object>(param: DocFns<T>) {
        return {
            getIngestTime: param.getIngestTime ? param.getIngestTime : timeFn,
            getEventTime: param.getEventTime ? param.getEventTime : timeFn,
        };
    }
}

function timeFn() {
    return Date.now();
}

export interface ESDataEntityMetadata {
    _index: string;
    _type: string;
    _version: number;
}

export interface DocUpsertParam<T extends object> {
    index: string;
    type: string;

    doc: T;
    id?: string;
    refresh?: boolean;
}

export interface DocUpsertResult<T extends object> {
    id: string;
    created: boolean;
    version: number;
}

export interface DocFns<T extends object> {
    getIngestTime?: GetIngestTimeFn<T>;
    getEventTime?: GetEventTimeFn<T>;
}

export interface DocGetParam<T extends object> extends DocFns<T> {
    index: string;
    type: string;

    id: string;
    includes?: string[];
    excludes?: string[];
}

export type GetIngestTimeFn<T extends object> = (input: T) => number;
export type GetEventTimeFn<T extends object> = (input: T) => number;

export type DocGetResult<T extends object> = ts.DataEntity<T>;
