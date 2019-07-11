import * as es6 from 'elasticsearch6';
import * as ts from '@terascope/utils';
import * as dt from '@terascope/data-types';

/**
 * A limited/simple api abstraction for the elasticsearch client
 */
export default class SimpleESClient {
    client: es6.Client;

    constructor(options: es6.ClientOptions, version: 6 = 6) {
        if (version !== 6) {
            throw new Error(`Unsupported elasticsearch client version ${version}`);
        }
        this.client = new es6.Client(options);
    }

    async indexAvailable(index: string, timeout?: number) {
        try {
            await ts.pWhile(async () => this._checkIndexAvailable(index), {
                timeoutMs: timeout || -1,
                enabledJitter: true,
            });
            return true;
        } catch (err) {
            throw new ts.TSError(err, {
                reason: `Index ${index} is unavailable`,
                statusCode: 503,
            });
        }
    }

    async indexExists(index: string): Promise<boolean> {
        const response = await this.client.indices.exists({
            index,
        });
        return response.body;
    }

    async indexCreate(index: string, mapping: dt.ESMapping) {
        return this.client.indices.create({
            index,
            body: mapping,
        });
    }

    async indexDelete(index: string) {
        return this.client.indices.delete({
            index,
            ignore_unavailable: true,
        });
    }

    async indexRefresh(index: string) {
        return this.client.indices.refresh({ index });
    }

    /**
     * Safely create or update a template
     */
    async templateUpsert(mapping: dt.ESMapping, name: string, version: number): Promise<boolean> {
        try {
            const templates = await this.client.indices.getTemplate({
                name,
                flat_settings: true,
            });
            const latestVersion = templates[name].version;
            if (version === latestVersion) return false;
        } catch (err) {
            if (err.statusCode !== 404) {
                throw err;
            }
        }

        await this.client.indices.putTemplate({
            body: {
                ...mapping,
                name,
                version,
            },
            name,
        });
        return true;
    }

    /**
     * Safely create or update a template
     */
    async templateDelete(name: string) {
        await this.client.indices.deleteTemplate({
            name,
        });
    }

    close() {
        this.client.close();
    }

    private async _checkIndexAvailable(index: string): Promise<boolean> {
        try {
            await this.client.search({
                q: '',
                size: 0,
                terminate_after: 1,
                index,
            });
            return true;
        } catch (err) {
            return false;
        }
    }
}
