
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { OperationConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class Uppercase extends TransformOpBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field === 'string') {
            this.set(doc, field.toUpperCase());
        } else {
            this.removeSource(doc);
        }
        return doc;
    }
}