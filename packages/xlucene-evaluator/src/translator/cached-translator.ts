import { isString } from '@terascope/utils';
import { TranslatorOptions } from './interfaces';
import { Translator } from './translator';
import { Parser } from '../parser';

type Cached = { [query: string]: Translator };
const _cache = new WeakMap<CachedTranslator, Cached>();

export class CachedTranslator {
    constructor() {
        _cache.set(this, {});
    }

    make(input: string|Parser, options?: TranslatorOptions): Translator {
        const query = isString(input) ? input : input.query;
        return new Translator(query, options);
    }

    reset() {
        _cache.delete(this);
        _cache.set(this, {});
    }
}
