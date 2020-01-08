import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes, ESTypeMapping } from '../../../interfaces';

export default class ObjectType extends BaseType {
    toESMapping(_version?: number) {
        const type: ESTypeMapping = { type: 'object' as ElasticSearchTypes };
        if (this.config.indexed === false) {
            type.enabled = false;
        }
        return { mapping: { [this.field]: type } };
    }

    toGraphQL() {
        return this._formatGql('JSONObject', 'scalar JSONObject');
    }

    toXlucene() {
        return { [this.field]: FieldType.Object };
    }
}
