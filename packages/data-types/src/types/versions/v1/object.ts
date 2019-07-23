import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class ObjectType extends BaseType {
    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'object' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('JSON', 'scalar JSON');
    }

    toXlucene() {
        return { [this.field]: 'object' as FieldType };
    }
}