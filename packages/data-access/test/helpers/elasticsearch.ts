import * as es from 'elasticsearch';
import { ELASTICSEARCH_HOST } from './config';
import { ACLManager } from '../../src';

export function makeClient(): es.Client {
    return new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error'
    });
}

type Model = { store: any };

export function cleanupIndex(model: Model) {
    const { client, indexQuery } = model.store;

    return client.indices.delete({
        index: indexQuery,
    }).catch(() => {});
}

export function cleanupIndexes(manager: ACLManager) {
    const models = [manager.roles, manager.spaces, manager.users, manager.views];
    return Promise.all(models.map(cleanupIndex));
}
