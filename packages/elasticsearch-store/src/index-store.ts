import Ajv from 'ajv';
import * as es from 'elasticsearch';
import {
    Collector,
    DataEntity,
    TSError,
    Logger,
    debugLogger
} from '@terascope/utils';
import IndexManager from './index-manager';
import * as i from './interfaces';
import { normalizeError, throwValidationError } from './error-utils';
import {
    isValidClient,
    validateIndexConfig,
    filterBulkRetries
} from './utils';

export default class IndexStore<T extends Object, I extends Partial<T> = T> {
    readonly client: es.Client;
    readonly config: i.IndexConfig;
    readonly manager: IndexManager;

    private _validate: ValidateFn<I|T>;
    private _indexQuery: string;
    private _interval: NodeJS.Timer|undefined;

    private readonly _logger: Logger;
    private readonly _collector: Collector<BulkRequest<I>>;
    private readonly _bulkMaxWait: number = 10000;
    private readonly _bulkMaxSize: number = 500;

    constructor(client: es.Client, config: i.IndexConfig) {
        if (!isValidClient(client)) {
            throw new TSError('IndexStore requires elasticsearch client', {
                fatalError: true
            });
        }

        validateIndexConfig(config);

        this.client = client;
        this.config = config;
        this.manager = new IndexManager(client);

        this._indexQuery = this.manager.formatIndexName(config);

        if (this.config.bulkMaxSize != null) {
            this._bulkMaxSize = this.config.bulkMaxSize;
        }

        if (this.config.bulkMaxWait != null) {
            this._bulkMaxWait = this.config.bulkMaxWait;
        }

        const debugLoggerName = `elasticseach-store:index-store:${config.name}`;
        this._logger = config.logger || debugLogger(debugLoggerName);

        this._collector = new Collector({
            size: this._bulkMaxSize,
            wait: this._bulkMaxWait,
        });

        if (config.dataSchema != null) {
            const { allFormatters, schema, strict } = config.dataSchema;
            const ajv = new Ajv({
                useDefaults: true,
                format: allFormatters ? 'full' : 'fast'
            });

            const validate = ajv.compile(schema);
            this._validate = (input: T|I) => {
                if (validate(input)) return;

                if (strict) {
                    throwValidationError(validate.errors);
                } else {
                    this._logger.warn('Invalid record', input, validate.errors);
                }
            };
        } else {
            this._validate = () => {};
        }

        this._toRecord = this._toRecord.bind(this);
    }

    /**
     * Safely add a create, index, or update requests to the bulk queue
     *
     * This method will batch messages using the configured
     * bulk max size and wait configuration.
     */
    async bulk(action: 'delete', id?: string): Promise<void>;
    async bulk(action: 'index'|'create'|'update', doc?: I, id?: string): Promise<void>;
    async bulk(action: i.BulkAction, ...args: any[]) {
        const metadata: BulkRequestMetadata = {};
        metadata[action] = {
            _index: this._indexQuery,
            _type: this.config.name,
        };

        let data: BulkRequestData<I> = null;
        let id: string;

        if (action !== 'delete') {
            this._validate(args[0]);
            if (action === 'update') {
                data = { doc: args[0] };
            } else {
                data = args[0];
            }
            id = args[1];
        } else {
            id = args[0];
        }

        // @ts-ignore because metadata[action] will never be undefined
        if (id) metadata[action]._id = id;

        this._collector.add({
            data,
            metadata,
        });

        return this.flush();
    }

    /** Count records by a given Lucene Query or Elasticsearch Query DSL */
    async count(query: string, params?: Partial<es.CountParams>): Promise<number> {
        const p = this._getParams(params, { q: query });

        return this._try(async () => {
            const { count } = await this.client.count(p);
            return count;
        });
    }

    /**
     * Index a document but will throw if doc already exists
     *
     * @returns a boolean to indicate whether the document was created
     */
    async create(doc: I, id?: string, params?: Partial<es.CreateDocumentParams>): Promise<boolean> {
        this._validate(doc);

        const defaults = { refresh: true };
        const p = this._getParams(defaults, params, { id, body: doc });

        return this._try(async () => {
            const { created } = await this.client.create(p);
            return created;
        });
    }

    async flush(flushAll = false) {
        const records = flushAll ? this._collector.flushAll() : this._collector.getBatch();
        if (!records || !records.length) return;

        this._logger.debug(`Flushing ${records.length} requests to ${this._indexQuery}`);

        const bulkRequest: any[] = [];

        for (const { data, metadata } of records) {
            bulkRequest.push(metadata);
            if (data != null) bulkRequest.push(data);
        }

        await this._try(() => this._bulk(records, bulkRequest));
    }

    /** Get a single document */
    async get(id: string, params?: Partial<es.GetParams>): Promise<DataEntity<T>> {
        const p = this._getParams(params, { id });

        return this._try(async () => {
            const result = await this.client.get<T>(p);
            return this._toRecord(result);
        });
    }

    /**
     * Connect and validate the index configuration.
    */
    async initialize() {
        await this.manager.indexSetup(this.config);

        const ms = Math.round(this._bulkMaxWait / 2);

        this._interval = setInterval(() => {
            this.flush()
                .catch((err) => {
                    this._logger.error('Failure flushing in the background', err);
                });
        }, ms);
    }

    /**
     * Index a document
     */
    async index(doc: I, params?: Partial<es.IndexDocumentParams<T>>) {
        this._validate(doc);

        const defaults = { refresh: true };
        const p = this._getParams(defaults, params, {
            body: doc
        });

        return this._try(async () => {
            return this.client.index(p);
        });
    }

    /**
     * A convenience method for indexing a document with an ID
     */
    async indexWithId(doc: I, id: string, params?: Partial<es.IndexDocumentParams<T>>) {
        return this.index(doc, Object.assign({ }, params, { id }));
    }

    /** Get multiple documents at the same time */
    async mget(body: any, params?: Partial<es.MGetParams>): Promise<DataEntity<T>[]> {
        const p = this._getParams(params, { body });

        return this._try(async () => {
            const { docs } = await this.client.mget<T>(p);
            if (!docs) return [];

            return docs.map(this._toRecord);
        });
    }

    /**
     * Refreshes the current index
     */
    async refresh(params?: es.IndicesRefreshParams) {
        const p = Object.assign({
            index: this._indexQuery
        }, params);

        return this._try(() => {
            return this.client.indices.refresh(p);
        });
    }

    /**
     * Deletes a document for a given id
    */
    async remove(id: string, params?: Partial<es.DeleteDocumentParams>) {
        const p = this._getParams(params, {
            id,
        });

        await this._try(() => this.client.delete(p));
    }

    /**
     * Shutdown, flush any pending requests and cleanup
    */
    async shutdown() {
        if (this._interval) {
            clearInterval(this._interval);
        }

        if (this._collector.length) {
            this._logger.info(`Flushing ${this._collector.length} records on shutdown`);

            await this.flush(true);
        }

        this.client.close();
    }

    /** Search with a given Lucene Query or Elasticsearch Query DSL */
    async search(params: Partial<es.SearchParams>): Promise<DataEntity<T>[]> {
        const p = this._getParams(params);
        return this._try(async () => {
            const results = await this.client.search<T>(p);
            return results.hits.hits.map(this._toRecord);
        });
    }

    /** Update a document with a given id */
    async update(doc: Partial<T>, id: string, params?: Partial<es.UpdateDocumentParams>) {
        const defaults = {
            refresh: true,
            retryOnConflict: 3
        };

        const p = this._getParams(defaults, params, {
            id,
            body: { doc }
        });

        await this._try(() => this.client.update(p));
    }

    private async _bulk(records: BulkRequest<I>[], body: any) {
        const result: i.BulkResponse = await this.client.bulk({ body });

        const retry = filterBulkRetries(records, result);

        if (retry.length) {
            this._logger.warn(`Bulk request to ${this._indexQuery} resulted in ${retry.length} errors`);

            this._logger.trace('Retrying bulk requests', retry);
            this._collector.add(retry);
        }
    }

    private _getParams(...params: any[]) {
        return Object.assign({
            index: this._indexQuery,
            type: this.config.name
        }, ...params);
    }

    private _toRecord(result: RecordResponse<T>): DataEntity<T> {
        this._validate(result._source);

        return DataEntity.make(result._source, {
            _index: result._index,
            _type: result._type,
            _id: result._id,
            _version: result._version,
        });
    }

    private async _try<T>(fn: i.AsyncFn<T>): Promise<T> {
        // capture the stack here for better errors
        const stack = new Error('[MESSAGE]').stack;

        try {
            return await fn();
        } catch (err) {
            throw normalizeError(err, stack);
        }
    }
}

interface BulkRequest<T> {
    data: BulkRequestData<T>;
    metadata: BulkRequestMetadata;
}

type BulkRequestData<T> = T|{doc: Partial<T>}|null;

type BulkRequestMetadata = {
    [key in i.BulkAction]?: {
        _index: string;
        _type: string;
        _id?: string;
    };
};

interface RecordResponse<T> {
    _index: string;
    _type: string;
    _id: string;
    _version?: number;
    _source: T;
}

type ValidateFn<T> = (input: T) => void;
