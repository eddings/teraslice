import ScaledFloat from '../../../src/types/versions/v1/scaled-float';
import { TSError } from '@terascope/utils';

describe('Double V1', () => {
    const field = 'someField';
    const typeConfig = { type: 'scaled_float' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new ScaledFloat();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new ScaledFloat(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQl).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new ScaledFloat(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: 'scaled_float' } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new ScaledFloat(field, typeConfig).toGraphQl();
        const results = { type: `${field}: Float` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new ScaledFloat(field, typeConfig).toXlucene();
        const results = { [field]: 'scaled_float' };

        expect(xlucene).toEqual(results);
    });
});
