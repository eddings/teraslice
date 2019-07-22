import * as es6 from 'elasticsearch6';
import * as ts from '@terascope/utils';
import * as dt from '@terascope/data-types';
import { getRetryConfig } from './utils';

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
        const response = await ts.pRetry(
            () =>
                this.client.indices.exists({
                    index,
                }),
            getRetryConfig()
        );
        return response.body;
    }

    async indexCreate(index: string, mapping: dt.ESMapping) {
        return ts.pRetry(
            () =>
                this.client.indices.create({
                    index,
                    body: mapping,
                }),
            getRetryConfig()
        );
    }

    async indexDelete(index: string) {
        return ts.pRetry(
            () =>
                this.client.indices.delete({
                    index,
                    ignore_unavailable: true,
                }),
            getRetryConfig()
        );
    }

    async indexRefresh(index: string) {
        return ts.pRetry(() => this.client.indices.refresh({ index }), getRetryConfig());
    }

    /**
     * Safely create or update a template
     */
    async templateUpsert(mapping: dt.ESMapping): Promise<boolean> {
        const { template: name, version } = mapping;
        if (!name) {
            throw new ts.TSError('Template mapping requires `template` property');
        }

        if (version != null) {
            const template = await this.templateGet(name);
            if (template) {
                const latestVersion = template.version;
                if (version === latestVersion) return false;
            }
        }

        await ts.pRetry(
            () =>
                this.client.indices.putTemplate({
                    include_type_name: true,
                    body: {
                        ...mapping,
                        version,
                    },
                    name,
                }),
            getRetryConfig()
        );
        return true;
    }

    async templateGet(name: string): Promise<any> {
        const { body } = await ts.pRetry(async () => {
            try {
                return await this.client.indices.getTemplate({
                    name,
                    flat_settings: true,
                });
            } catch (err) {
                if (err && err.statusCode === 404) {
                    return { body: {} };
                }
                throw err;
            }
        }, getRetryConfig());

        return body[name];
    }

    /**
     * Safely create or update a template
     */
    async templateDelete(name: string) {
        await ts.pRetry(
            () =>
                this.client.indices.deleteTemplate({
                    name,
                }),
            getRetryConfig()
        );
    }

    close() {
        this.client.close();
    }

    async docUpsert<T extends {}>(param: DocUpsertOptions<T>): Promise<DocUpsertResult> {
        if (!param.index) {
            throw new ts.TSError('Document Upsert requires index');
        }

        const { body } = await ts.pRetry(
            () =>
                this.client.index({
                    id: param.id,
                    index: param.index,
                    type: param.type,
                    body: param.doc,
                    refresh: param.refresh ? 'true' : 'false',
                }),
            getRetryConfig()
        );

        const created = body.result === 'created';

        return {
            id: body._id,
            created,
            version: body._version,
        };
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

export type DocUpsertOptions<T extends {}> = {
    doc: T;
    id?: string;
    index: string;
    type: string;
    refresh?: boolean;
};

export type DocUpsertResult = {
    id: string;
    created: boolean;
    version: number;
};
