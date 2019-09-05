/* eslint-disable @typescript-eslint/prefer-for-of */

import {
    DataEntity, matchAll, get, set
} from '@terascope/utils';
import jexl from 'jexl';
import { ExtractionConfig, InputOutputCardinality } from '../../../interfaces';

function isMutation(configs: ExtractionConfig[]): boolean {
    return configs.some((config) => config.mutate === true);
}

function getSubslice(start: string, end: string) {
    return (data: string) => {
        const indexStart = data.indexOf(start);
        if (indexStart !== -1) {
            const sliceStart = indexStart + start.length;
            let endInd = data.indexOf(end, sliceStart);
            if (endInd === -1) endInd = data.length;
            const extractedSlice = data.slice(sliceStart, endInd);
            if (extractedSlice) return data.slice(sliceStart, endInd);
        }
        return null;
    };
}

type Cb = (data: any) => string|string[]|null;

function extractField(data: any, fn: Cb, isMultiValue = true) {
    if (typeof data === 'string') {
        return fn(data);
    }

    if (Array.isArray(data)) {
        const results: string[] = [];

        data.forEach((subData: any) => {
            if (typeof subData === 'string') {
                const extractedSlice = fn(subData);
                if (extractedSlice) {
                    if (Array.isArray(extractedSlice)) {
                        results.push(...extractedSlice);
                    } else {
                        results.push(extractedSlice);
                    }
                }
            }
        });

        if (results.length > 0) {
            if (isMultiValue) return results;
            return results[0];
        }
    }

    return null;
}

function matchRegex(config: ExtractionConfig) {
    return (data: string) => {
        const results = matchAll(config.regex as string, data);
        if (config.multivalue) return results;
        return results ? results[0] : results;
    };
}

function extractAndTransferFields(
    data: any,
    dest: DataEntity,
    config: ExtractionConfig,
    origin: DataEntity
) {
    let extractedResult;

    if (data !== undefined) {
        if (config.regex) {
            const checkRegex = matchRegex(config);
            extractedResult = extractField(data, checkRegex, config.multivalue);
        } else if (config.start && config.end) {
            const { start, end } = config;
            const sliceString = getSubslice(start, end);
            extractedResult = extractField(data, sliceString, config.multivalue);
        } else if (config.exp) {
            extractedResult = jexl.evalSync(config.exp, origin);
        } else {
            extractedResult = data;
        }
    } else if (config.exp && config.source_field === undefined) {
        // this should be a set operation
        extractedResult = jexl.evalSync(config.exp, origin);
    }

    if (extractedResult !== undefined && extractedResult !== null) {
        set(dest, config.target_field, extractedResult);
        dest.setMetadata('hasExtractions', true);
    }
}

function hasExtracted(record: DataEntity) {
    return record.getMetadata('hasExtractions') === true;
}

function getData(config: ExtractionConfig, record: DataEntity) {
    if (config.deepSourceField) {
        return get(record, config.source_field as string);
    }
    return record[config.source_field as string];
}

export default class Extraction {
    private isMutation: boolean;
    private configs: ExtractionConfig[];
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(configArgs: ExtractionConfig | ExtractionConfig[]) {
        let configs: ExtractionConfig[];
        // if its not an array then its a post_process,
        if (!Array.isArray(configArgs)) {
            // we normalize configs
            configs = [configArgs];
        } else {
            configs = configArgs;
        }

        this.isMutation = isMutation(configs);

        configs = configs.map((config) => {
            if (config.end === 'EOP') config.end = '&';
            if (config.source_field && config.source_field.includes('.')) config.deepSourceField = true;
            return config;
        });

        this.configs = configs;
    }

    run(doc: DataEntity): DataEntity | null {
        let record;

        if (this.isMutation) {
            record = doc;
        } else {
            record = DataEntity.makeRaw({}, doc.getMetadata()).entity;
        }

        for (let i = 0; i < this.configs.length; i += 1) {
            const data = getData(this.configs[i], doc);
            extractAndTransferFields(data, record, this.configs[i], doc);
        }

        if (hasExtracted(record) || this.isMutation) return record;
        return null;
    }

    extractionPhaseRun(doc: DataEntity, results: { entity: DataEntity; metadata: any }) {
        for (let i = 0; i < this.configs.length; i += 1) {
            const data = getData(this.configs[i], doc);
            extractAndTransferFields(data, results.entity, this.configs[i], doc);
        }
    }
}
