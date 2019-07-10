import 'jest-extended';
import SimpleESClient from '../src/simple-es-client';
import { ELASTICSEARCH_HOST } from './helpers/config';

describe('SimpleESClient', () => {
    let client: SimpleESClient;

    beforeAll(() => {
        client = new SimpleESClient(
            {
                nodes: ELASTICSEARCH_HOST,
            },
            6
        );
    });

    afterAll(() => {
        client.close();
    });

    describe('->indexExists', () => {
        it('should return false when the index is not found', () => {
            return expect(client.indexExists('test_none_existant_index')).resolves.toBeFalse();
        });
    });
});
