import { Logger } from '@terascope/utils';

/** A versioned Index Configuration */
export interface IndexConfig {
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
     * Data Version, this allows multiple versions of an index to exist with the same Schema
    */
    version?: number;

    /**
     * Elasticsearch Index Settings
    */
    indexSettings?: IndexSettings;

    /**
     * Schema Specification for the Data and ES
    */
    indexSchema?: IndexSchema;

    /**
     * The data schema format
    */
    dataSchema?: DataSchema;

     /**
     * The maximum amount of time to wait for before send the bulk request
    */
    bulkMaxWait?: number;

    /**
     * The number of records to accumulate before sending the bulk request
    */
    bulkMaxSize?: number;

    /**
     * Logger to use for debugging and certian internal errors
     *
     * @defaults to a debug logger
    */
    logger?: Logger;

    /**
     * Ingest Time field on the source record
    */
    ingestTimeField?: string;

    /**
     * Event Time field from the source record
    */
    eventTimeField?: string;
}

/** Elasticsearch Index Schema, Mapping and Version */
export interface IndexSchema {
    /**
     * The version of this particular Schema definition
     */
    version: number;

    /**
     * The Elasticsearch index mapping
    */
    mapping: any;

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

export type TimeSeriesFormat = 'daily'|'monthly'|'yearly';

export interface IndexSettings {
    'index.number_of_shards': number;
    'index.number_of_replicas': number;
    [key: string]: string|number|boolean;
}

/** Data Schema and Version */
export interface DataSchema {
    /**
     * The version of this particular Schema definition
     */
    version: number;

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
    allFormatters?: boolean;
}

export type AsyncFn<T> = () => Promise<T>;

export type BulkAction = 'index'|'create'|'delete'|'update';

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

export type BulkResponseItems = {
    [key in BulkAction]?: BulkResponseItem;
};

export interface BulkResponse {
    errors: boolean;
    took: number;
    items: BulkResponseItems[];
}

export type Shard = { primary: boolean, stage: string };
