import { Logger, Omit } from '@terascope/utils';
import { xLuceneVariables, ESIndexSettings } from '@terascope/types';
import { QueryAccess } from 'xlucene-translator';
import { DataType } from '@terascope/data-types';

/** A versioned Index Configuration */
export interface IndexConfig<T = any> {
    /**
     * This is the data type and base name of the index
     */
    name: string;

    /**
     * The namespace that will be prefixed to the name value when generating
     * the index name or anything else that needs to be namespaced.
     */
    namespace?: string;

    /**
     * Enable index mutations so indexes will be auto created or updated
     * @default false
    */
    enable_index_mutations?: boolean;

    /**
     * Data Version, this allows multiple versions of an index to exist with the same Schema
     */
    version?: number;

    /**
     * The DataType of the index (used for generating the mappings)
     */
    data_type: DataType;

    /**
     * Elasticsearch Index Settings
     */
    index_settings?: ESIndexSettings;

    /**
     * Schema Specification for the Data and ES
     */
    index_schema?: IndexSchema;

    /**
     * The data schema format
     */
    data_schema?: DataSchema;

    /**
     * The maximum amount of time to wait for before send the bulk request
     */
    bulk_max_wait?: number;

    /**
     * The number of records to accumulate before sending the bulk request
     */
    bulk_max_size?: number;

    /**
     * Logger to use for debugging and certian internal errors
     *
     * @defaults to a debug logger
     */
    logger?: Logger;

    /**
     * Default sort
     */
    default_sort?: string;

    /**
     * ID field
     */
    id_field?: keyof T;

    /**
     * Ingest Time field on the source record
     */
    ingest_time_field?: keyof T;

    /**
     * Event Time field from the source record
     */
    event_time_field?: keyof T;

    /**
     * The default query access to use
    */
    default_query_access?: QueryAccess<T>;
}

/** Elasticsearch Index Schema, Mapping and Version */
export interface IndexSchema {
    /**
     * The version of this particular Schema definition
     */
    version?: number;

    /**
     * Use a Templated Index
     */
    template?: boolean;

    /**
     * Use a Timeseries Index
     */
    timeseries?: boolean;

    /**
     * Rollover Frequency for the Timeseries Index.
     * This is only valid if timeseries is set to true
     *
     * @default monthly
     */
    rollover_frequency?: TimeSeriesFormat;

    /**
     * If enabled and the index does not match the version and mapping.
     * Additionally this will prevent any mapping changes to automatically happen.
     *
     * @default false
     */
    strict?: boolean;
}

export type TimeSeriesFormat = 'daily' | 'monthly' | 'yearly';

/** Data Schema and Version */
export interface DataSchema {
    /**
     * The Data Schema in JSON Schema format
     */
    schema: any;

    /**
     * If enabled and the data fails to match the schema or version
     * an error will thrown
     *
     * @default false
     */
    strict?: boolean;

    /**
     * If enabled this will allow the use of some of
     * the slower but more correct JSON Schema's formatters:
     *
     * - "date"
     * - "time"
     * - "date-time"
     * - "uri"
     * - "uri-reference"
     * - "hostname"
     * - "email"
     */
    all_formatters?: boolean;
}

export type AsyncFn<T> = () => Promise<T>;

export type BulkAction = 'index' | 'create' | 'delete' | 'update';

export interface BulkResponseItem {
    error?: {
        type: string;
        reason: string;
    };
    status?: number;
    /**
     * This only exists in 6.x
     */
    _seq_no?: number;
}

export type BulkResponseItems = { [key in BulkAction]?: BulkResponseItem };

export interface BulkResponse {
    errors: boolean;
    took: number;
    items: BulkResponseItems[];
}

export type Shard = { primary: boolean; stage: string };

export interface IndexModelRecord {
    /**
     * A unique ID for the record - nanoid 12 digit
     */
    _key: string;

    /**
     * The mutli-tenant ID representing the client
     */
    client_id: number;

    /**
     * Indicates whether the record is deleted or not
     */
    _deleted?: boolean;

    /**
     * Updated date
     */
    _updated: string;

    /**
     * Creation date
     */
    _created: string;
}

export type CreateRecordInput<T extends IndexModelRecord> = Omit<T, keyof IndexModelRecord> & {
    client_id: number;
};

export type UpdateRecordInput<T extends IndexModelRecord> =
    Partial<Omit<T, keyof IndexModelRecord>>
    & {
        client_id?: number;
    };

export interface IndexModelConfig<T extends IndexModelRecord> {
    /** Schema Version */
    version: number;

    /** Name of the Model/Data Type */
    name: string;

    /** The DataType of the model */
    data_type: DataType;

    /** JSON Schema */
    schema: any;

    /** Unqiue fields across on Index */
    unique_fields?: (keyof T)[];

    /** Sanitize / cleanup fields mapping, like trim or trimAndToLower */
    sanitize_fields?: SanitizeFields;

    /** Specify whether the data should be strictly validated, defaults to true */
    strict_mode?: boolean;

    /** The default sort field and direction */
    default_sort?: string;
}

export type SanitizeFields = {
    [field: string]: 'trimAndToLower' | 'trim' | 'toSafeString';
};

/**
 * A list of options that are configured during run time and will always override
 * the config
*/
export interface IndexModelOptions {
    /**
     * The namespace that will be prefixed to the name value when generating
     * the index name or anything else that needs to be namespaced.
     */
    namespace?: string;
    /**
     * The logger to use
    */
    logger?: Logger;
    /**
     * Enable index mutations so indexes will be auto created or updated
    */
    enable_index_mutations?: boolean;
}

export type FindOptions<T> = {
    includes?: (keyof T)[];
    excludes?: (keyof T)[];
    from?: number;
    sort?: string;
    size?: number;
    variables?: xLuceneVariables;
};

export type FindOneOptions<T> = {
    includes?: (keyof T)[];
    excludes?: (keyof T)[];
    variables?: xLuceneVariables;
};

export interface MigrateIndexOptions {
    config: IndexConfig;
    timeout?: string;
    previousNamespace?: string;
    previousName?: string;
    previousVersion?: number;
}

export type MigrateIndexStoreOptions = Omit<MigrateIndexOptions, 'config'>;

export type SearchResult<T> = {
    _total: number;
    _fetched: number;
    results: T[];
};
