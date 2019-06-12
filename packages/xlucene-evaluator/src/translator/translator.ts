import { debugLogger, isString, Logger } from '@terascope/utils';
import { TypeConfig } from '../interfaces';
import { Parser, isEmptyAST } from '../parser';
import * as i from './interfaces';
import * as utils from './utils';

const _logger = debugLogger('xlucene-translator');

export class Translator {
    readonly query: string;
    logger: Logger;
    readonly typeConfig?: TypeConfig;
    private readonly _parser: Parser;

    constructor(input: string|Parser, typeConfig?: TypeConfig, logger?: Logger) {
        this.logger = logger != null ? logger.child({ module: 'xlucene-translator' }) : _logger;

        if (isString(input)) {
            this._parser = new Parser(input, logger);
        } else {
            this._parser = input;
        }

        this.query = this._parser.query;
        this.typeConfig = typeConfig;
    }

    toElasticsearchDSL(): i.ElasticsearchDSLResult {
        if (isEmptyAST(this._parser.ast)) {
            return {
                query: {
                    query_string: {
                        query: ''
                    }
                }
            };
        }

        const anyQuery = utils.buildAnyQuery(this._parser.ast, this._parser);

        const query = {
            constant_score: {
                filter: utils.compactFinalQuery(anyQuery),
            },
        };

        this.logger.trace(`translated ${this.query} query to`, JSON.stringify(query, null, 2));

        return { query };
    }
}