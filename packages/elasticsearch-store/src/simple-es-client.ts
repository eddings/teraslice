import * as es6 from 'elasticsearch6';
import * as ts from '@terascope/utils';

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

    async indexAvailable(index: string, timeout?: number): Promise<boolean> {
        const startTime = Date.now();
        const timeoutMs = timeout || 1000 * 60 * 60;
        const intervalMs = timeoutMs > 1000 ? timeoutMs : 1000;

        return new Promise((resolve, reject) => {
            let running = false;
            const interval = setInterval(() => {
                if (running) return;
                const elapsed = Date.now() - startTime;
                if (timeoutMs > elapsed) {
                    reject(
                        new ts.TSError(`Index ${index} unavailable`, {
                            statusCode: 503,
                        })
                    );
                    return;
                }

                running = true;

                this._checkIndexAvailable(index).then(available => {
                    running = false;
                    if (available) {
                        clearInterval(interval);
                        resolve();
                    }
                });
            }, intervalMs).unref();
        });
    }

    async indexExists(index: string): Promise<boolean> {
        const response = await this.client.indices.exists({
            index,
        });
        return response.body;
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
