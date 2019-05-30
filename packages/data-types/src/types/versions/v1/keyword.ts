
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Keyword extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'keyword' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'keyword' };
    }
}
