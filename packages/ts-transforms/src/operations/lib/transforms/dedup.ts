
import { DataEntity, get, uniq } from '@terascope/utils';
import TransformOpBase from './base';
import { PostProcessConfig } from '../../../interfaces';

export default class Dedup extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity {
        const arrayField = get(doc, this.source);
        if (Array.isArray(arrayField)) {
            this.set(doc, uniq(arrayField));
            return doc;
        }
        return doc;
    }
}
