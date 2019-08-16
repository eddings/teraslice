
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces';
import TransformOpBase from './base';

export default class Join extends TransformOpBase {
    private delimiter: string;
    private fields: string[];

    static cardinality: InputOutputCardinality = 'many-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
        this.delimiter = config.delimiter !== undefined ? config.delimiter : '';
        const fields = config.fields || config.source_fields;
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            throw new Error(`Join configuration is misconfigured, could not determine fields to join ${JSON.stringify(config)}`);
        }
        this.fields = fields;
    }
    // source work differently here so we do not use the inherited validate
    // @ts-ignore
    protected validateConfig(config: PostProcessConfig) {
        const { target_field: tField } = config;
        const fields = config.fields || config.source_fields;
        if (!tField || typeof tField !== 'string' || tField.length === 0) {
            const name = this.constructor.name;
            throw new Error(
                `could not find target_field for ${name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`
            );
        }
        if (!fields || !Array.isArray(fields) || fields.length <= 1) {
            throw new Error(`Join configuration is misconfigured, could not determine fields to join ${JSON.stringify(config)}`);
        }
        if (config.delimiter && typeof config.delimiter !== 'string') throw new Error('paramter delimiter must be a string if defined');
        this.target = tField;
    }

    run(doc: DataEntity): DataEntity | null {
        const fieldsData = _.flattenDeep(this.fields.map((field) => _.get(doc, field)));
        const results = fieldsData.join(this.delimiter);
        if (results.length !== this.delimiter.length) _.set(doc, this.target, results);
        return doc;
    }
}
