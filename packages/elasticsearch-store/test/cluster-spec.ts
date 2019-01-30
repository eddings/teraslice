import 'jest-extended';
import es from 'elasticsearch';
import { Cluster } from '../src';

describe('Cluster', () => {
    const client = new es.Client({});
    const cluster = new Cluster(client);

    afterAll(() => {
        client.close();
    });

    it('should be an instance of Cluster', () => {
        expect(cluster).toBeInstanceOf(Cluster);
    });

    it('should have a nodeInfo function', () => {
        return cluster.nodeInfo({ nodeId: 'hello' });
    });

    it('should have a nodeStats function', () => {
        return cluster.nodeStats({ nodeId: 'hello' });
    });
});