
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class HalfFloat extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'half_float' };
    }

    toGraphQl() {
        return `${this.field}: Float`;
    }

    toXlucene() {
        return { [this.field]: 'half_float' };
    }
}
