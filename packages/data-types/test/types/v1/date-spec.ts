import DateType from '../../../src/types/v1/date';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('Date V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Date' };

    it('can requires a field and proper configs', () => {
        const type = new DateType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new DateType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'date' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new DateType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new DateType(field, typeConfig).toXlucene();
        const results = { [field]: 'date' };

        expect(xlucene).toEqual(results);
    });
});
