
import { DataEntity, Logger, TSError, chunk, has } from '@terascope/job-components';
import esApi, { Client } from '@terascope/elasticsearch-api';
import { Promise as bPromise } from 'bluebird';
import { ESStateStorageConfig, ESBulkQuery, ESQUery, MGetResponse } from '../interfaces';
import CachedStateStorage from '../cached-state-storage';

export default class ESCachedStateStorage {
    private index: string;
    private type: string;
    private IDField: string;
    private concurrency: number;
    private sourceFields: string[];
    private chunkSize: number;
    private persist: boolean;
    private persistField: string;
    private es: Client;
    public cache: CachedStateStorage;

    constructor(client: Client, logger: Logger, config: ESStateStorageConfig) {
        this.index = config.index;
        this.type = config.type;
        this.IDField = '_key';
        this.concurrency = config.concurrency;
        this.sourceFields = config.source_fields || [];
        this.chunkSize = config.chunk_size;
        this.persist = config.persist;
        this.persistField = config.persist_field || this.IDField;
        this.cache = new CachedStateStorage(config);
        this.es = esApi(client, logger);
    }

    private getIdentifier(doc: DataEntity) {
        const id =  doc.getMetadata(this.IDField);
        if (id === '' || id == null) {
            throw new TSError(`There is no field "${this.IDField}" set in the metadata`, { context: { doc } });
        }
        return id;
    }

    private _esBulkUpdatePrep(dataArray: DataEntity[]) {
        const bulkRequest: ESBulkQuery[] = [];

        dataArray.forEach((item) => {
            const id = item.getMetadata(this.persistField);
            bulkRequest.push({
                index: {
                    _index: this.index,
                    _type: this.type,
                    _id: id
                }
            });
            bulkRequest.push(item);
        });

        return bulkRequest;
    }

    private _esBulkUpdate(docArray: DataEntity[]) {
        const bulkRequest = this._esBulkUpdatePrep(docArray);
        const chunkedArray = chunk<ESBulkQuery>(bulkRequest, this.chunkSize);

        return bPromise.map<ESBulkQuery[], ESBulkQuery[]>(chunkedArray, chunkedData => this.es.bulkSend(chunkedData));
    }

    private async _esGet(doc: DataEntity) {
        const id = this.getIdentifier(doc);
        const request = {
            index: this.index,
            type: this.type,
            id
        };

        const results = await this.es.get(request);
        return DataEntity.make(results, { [this.IDField]: id });
    }

    private async _esMget(query: string[]) {
        const request: ESQUery = {
            index: this.index,
            type: this.type,
            body: {
                ids: query
            }
        };
        if (this.sourceFields.length > 0) request._source = this.sourceFields;
        const response: MGetResponse = await this.es.mget(request);

        return response.docs
            .filter(doc => doc.found)
            .map(doc => DataEntity.make(doc._source, { [this.IDField]: doc._id }));

    }

    private _dedupeDocs(docArray: DataEntity[], idField = this.IDField) {
        // returns uniq docs from an array of docs
        const uniqKeys = {};
        return docArray.filter((doc) => {
            const id = doc.getMetadata(idField);
            const uniq = has(uniqKeys, id) ? false : uniqKeys[id] = true;
            return uniq;
        });
    }

    async get(doc: DataEntity) {
        let cached = this.cache.get(doc);
        if (!cached) {
            cached = await this._esGet(doc);
        }
        return cached;
    }

    async mget(docArray: DataEntity[], cb = (doc: DataEntity) => doc) {
        // dedupe docs
        const uniqDocs = this._dedupeDocs(docArray);
        const savedDocs = {};
        const unCachedDocKeys: string[] = [];

        // need to add valid docs to return object and find non-cached docs
        uniqDocs.forEach((doc) => {
            const key = this.getIdentifier(doc);
            const cachedDoc = this.cache.get(doc);

            if (cachedDoc) {
                savedDocs[key] = cachedDoc;
                return;
            }

            if (key) {
                unCachedDocKeys.push(key);
            }
        });

        const chunkedArray = chunk<string>(unCachedDocKeys, this.chunkSize);
        // es search for keys not in cache
        const mgetResults = await bPromise.map<string[], DataEntity[]>(
            chunkedArray,
            chunked => this._esMget(chunked),
            { concurrency: this.concurrency }
        );

        // update cache based on mget results
        mgetResults.forEach((results) => {
            results.forEach((doc: DataEntity) => {
                const data = cb(doc);
                // update cache
                this.set(data);
                // updated savedDocs object
                savedDocs[this.getIdentifier(data)] = data;
            });
        });

        return savedDocs;
    }

    async set(doc: DataEntity) {
        // update cache, if persistance is needed use mset
        return this.cache.set(doc);
    }

    async mset(docArray: DataEntity[], keyField?: string) {
        const dedupedDocs = this._dedupeDocs(docArray, keyField);
        if (this.persist) {
            return bPromise.all([this.cache.mset(dedupedDocs), this._esBulkUpdate(dedupedDocs)]);
        }
        return this.cache.mset(dedupedDocs);
    }

    count() {
        return this.cache.count();
    }

    async initialize() {
        this.cache.initialize();
    }

    async shutdown() {
        this.cache.shutdown();
    }

}
