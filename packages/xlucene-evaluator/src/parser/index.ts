import { debugLogger, Logger, TSError } from '@terascope/utils';
// @ts-ignore
import Tracer from 'pegjs-backtrace';
import engine from './engine';

export class Parser {
    ast: V2AST = {};
    query: string;
    logger: Logger;

    constructor(query: string, logger: Logger = debugLogger('parser-v2')) {
        this.logger = logger;
        this.query = query;
        this._parse();
    }

    private _parse() {
        const tracer = new Tracer(this.query, {
            showTrace: false
        });
        try {
            this.ast = engine.parse(this.query, {
                tracer,
            });
            this.logger.debug(`parsed ${this.query} to `, this.ast);
        } catch (err) {
            throw new TSError(err, {
                reason: `Failure to parse xlucene query ${this.query}`
            });
        } finally {
            if (process.env.DEBUG_LUCENE === '1')  {
                // tslint:disable-next-line no-console
                console.error(tracer.getBacktraceString());
            }
        }
    }
}

export type V2AST = {}|{
    type: 'term';
    data_type: 'string';
    field: string|null;
    value: any;
};
