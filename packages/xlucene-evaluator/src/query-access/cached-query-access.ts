import { QueryAccess } from './query-access';
import { QueryAccessConfig } from './interfaces';
import { Logger } from '@terascope/utils';

type Cached = { [key: string]: QueryAccess<any> };
const _cache = new WeakMap<CachedQueryAccess, Cached>();

export class CachedQueryAccess {
    constructor() {
        _cache.set(this, {});
    }

    make<T>(config: QueryAccessConfig<T>, logger?: Logger): QueryAccess<T> {
        const key = JSON.stringify(config);
        const cached = _cache.get(this)!;
        if (cached[key] != null) return cached[key];

        const queryAccess = new QueryAccess(config, logger);

        cached[key] = queryAccess;
        _cache.set(this, cached);

        return queryAccess;
    }

    reset() {
        this.resetInstances();

        _cache.delete(this);
        _cache.set(this, {});
    }

    resetInstances() {
        const cached = _cache.get(this)!;
        Object.values(cached)
            .forEach((instance) => instance.clearCache());
    }
}