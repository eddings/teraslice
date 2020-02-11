import { XluceneFieldType } from '@terascope/types';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class Double extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'double' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('Float');
    }

    toXlucene() {
        return { [this.field]: XluceneFieldType.Float };
    }
}
