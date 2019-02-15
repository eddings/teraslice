import * as es from 'elasticsearch';
import { IndexStore, IndexConfig } from 'elasticsearch-store';
import * as ts from '@terascope/utils';
import * as utils from '../utils';
import { addDefaultMapping, addDefaultSchema } from './config/base';
import { ManagerConfig } from '../interfaces';

/**
 * A base class for handling the different ACL models
*/
export class Base<T extends BaseModel> {
    readonly store: IndexStore<T>;
    readonly name: string;
    private _uniqueFields: string[];
    private _sanitizeFields: SanitizeFields;

    constructor(client: es.Client, config: ManagerConfig, modelConfig: ModelConfig) {
        const indexConfig: IndexConfig = Object.assign({
            version: 1,
            name: modelConfig.name,
            namespace: config.namespace,
            indexSchema: {
                version: modelConfig.version,
                mapping: addDefaultMapping(modelConfig.mapping),
            },
            dataSchema: {
                schema: addDefaultSchema(modelConfig.schema),
                strict: true,
                allFormatters: true,
            },
            indexSettings: {
                'index.number_of_shards': 5,
                'index.number_of_replicas': 1,
                analysis: {
                    analyzer: {
                        lowercase_keyword_analyzer: {
                            tokenizer: 'keyword',
                            filter: 'lowercase'
                        }
                    }
                }
            },
            ingestTimeField: 'created',
            eventTimeField: 'updated',
            logger: config.logger,
        }, config.storeOptions, modelConfig.storeOptions);

        this.name = utils.toInstanceName(modelConfig.name);
        this.store = new IndexStore(client, indexConfig);

        this._uniqueFields = ts.concat('id', modelConfig.uniqueFields);
        this._sanitizeFields = modelConfig.sanitizeFields || {};
    }

    async initialize() {
        return this.store.initialize();
    }

    async shutdown() {
        return this.store.shutdown();
    }

    async create(record: CreateInput<T>|ts.DataEntity<CreateInput<T>>): Promise<T> {
        const doc = this._sanitizeRecord({
            ...record,
            id: await utils.makeId(),
            created: utils.makeISODate(),
            updated: utils.makeISODate(),
        } as T);

        await this._ensureUnique(doc);
        await this.store.indexWithId(doc, doc.id);
        return doc;
    }

    async deleteById(id: string): Promise<void> {
        await this.store.remove(id);
    }

    async findBy(fields: FieldMap<T>, joinBy = 'AND') {
        const query = Object.entries(fields)
            .map(([field, val]) => `${field}:"${val}"`)
            .join(` ${joinBy} `);

        const record = ts.getFirst(await this.find(query, 1));
        if (record == null) {
            throw new ts.TSError(`Unable to find ${this.name} by '${query}'`, {
                statusCode: 404,
            });
        }

        return record;
    }

    async findById(id: string) {
        return this.store.get(id);
    }

    async findByAnyId(anyId: string) {
        const fields: FieldMap<T> = {};

        for (const field of this._uniqueFields) {
            fields[field] = anyId;
        }

        return this.findBy(fields, 'OR');
    }

    async findAll(ids: string[]) {
        return this.store.mget({ ids });
    }

    async find(q: string, size: number = 10, fields?: (keyof T)[], sort?: string) {
        return this.store.search({
            q,
            size,
            sort,
            _source: fields,
        });
    }

    async update(record: UpdateInput<T>|ts.DataEntity<UpdateInput<T>>) {
        const doc = this._sanitizeRecord({
            ...record,
            updated: utils.makeISODate(),
        } as T);

        const existing = await this.store.get(doc.id);

        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (doc[field] == null) continue;

            if (existing[field] !== doc[field]) {
                const count = await this._countBy(field, doc[field]);

                if (count > 0) {
                    throw new ts.TSError(`Update requires ${field} to be unique`, {
                        statusCode: 409
                    });
                }
            }
        }

        return this.store.update(doc, doc.id);
    }

    private async _countBy(field: string, val: string): Promise<number> {
        return this.store.count(`${field}:"${val}"`);
    }

    private async _ensureUnique(record: T) {
        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (record[field] == null) {
                throw new ts.TSError(`Create requires field ${field}`, {
                    statusCode: 422
                });
            }

            const count = await this._countBy(field, record[field]);
            if (count > 0) {
                throw new ts.TSError(`Create requires ${field} to be unique`, {
                    statusCode: 409
                });
            }
        }

        return;
    }

    private _sanitizeRecord(record: T): T {
        const entries = Object.entries(this._sanitizeFields);

        for (const [field, method] of entries) {
            switch (method) {
                case 'trim':
                    record[field] = utils.trim(record[field]);
                    break;
                case 'trimAndLower':
                    record[field] = utils.trimAndLower(record[field]);
                    break;
                default:
                    continue;
            }
        }

        return record;
    }
}

export interface ModelConfig {
    name: string;
    mapping: any;
    schema: any;
    version: number;
    storeOptions?: Partial<IndexConfig>;
    uniqueFields?: string[];
    sanitizeFields?: SanitizeFields;
}

export type FieldMap<T> = {
    [field in keyof T]?: string;
};

export type SanitizeFields = {
    [field: string]: 'trimAndLower'|'trim';
};

export type BaseConfig = ModelConfig & ManagerConfig;

export type CreateInput<T extends BaseModel> = ts.Omit<T, 'id'|'created'|'updated'>;
export type UpdateInput<T extends BaseModel> = Partial<ts.Omit<T, 'created'|'updated'>>;

export interface BaseModel {
    /**
     * ID of the view - nanoid 12 digit
    */
    readonly id: string;

    /** Updated date */
    updated: string;

    /** Creation date */
    created: string;
}