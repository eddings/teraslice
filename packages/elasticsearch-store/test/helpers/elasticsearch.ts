import { Client } from 'elasticsearch';
import { IndexStore } from '../../src';
import { ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION } from './config';

// automatically set the timeout to 10s when using elasticsearch
jest.setTimeout(10000);

export function makeClient(): Client {
    return new Client({
        host: ELASTICSEARCH_HOST,
        log: 'error',
        apiVersion: ELASTICSEARCH_API_VERSION,
    });
}

export async function cleanupIndex(client: Client, index: string, template?: string) {
    await client.indices
        .delete({
            index,
            requestTimeout: 3000,
        })
        .catch(() => {});

    if (template) {
        await client.indices
            .deleteTemplate({
                name: template,
                requestTimeout: 3000,
            })
            .catch(() => {});
    }
}

export function cleanupIndexStore(store: IndexStore<any>) {
    const { client, indexQuery } = store;

    return cleanupIndex(client, indexQuery);
}
