import * as utils from './utils';
import { STATUS_CODES } from 'http';

/**
 * A custom Error class with additional properties,
 * like statusCode and fatalError
*/
export class TSError extends Error {
    /**
     * A HTTP status code for easy use
    */
    // @ts-ignore
    statusCode: number;

    /**
     * Used to indicate the an error is fatal
    */
    // @ts-ignore
    fatalError: boolean;

    /**
     * Used sometimes to indicate whether an error is retryable
     *
     * If this is not set then it is better not to assume either way
    */
    retryable?: boolean;

    constructor (input: any, config: TSErrorConfig = {}) {
        // If a Error is passed in we want to only change
        // the properties based on the configuration
        if (isError(input) && !isElasticsearchError(input)) {
            super(prefixErrorMsg(input.message, config.reason));

            this.fatalError = false;
            this.statusCode = 500;

            if (isTSError(input)) {
                const code = coerceStatusCode(input.statusCode);
                if (code) this.statusCode = code;

                this.fatalError = input.fatalError;
                this.retryable = input.retryable;
            }

            const code = coerceStatusCode(config.statusCode);
            if (code) this.statusCode = code;

            if (config.fatalError != null) this.fatalError = config.fatalError;

            if (!this.fatalError && config.retryable != null) {
                this.retryable = config.retryable;
            }

            this.name = this.constructor.name;

            // We want to keep the stack unless specified
            if (config.withStack && input.stack) {
                this.stack = input.stack
                    .replace(input.message, this.message);
            } else {
                Error.captureStackTrace(this, this.constructor);
            }
            return;
        }

        const { fatalError = false } = config;

        const errMsg = parseError(input, config.withStack);
        const message = prefixErrorMsg(errMsg, config.reason);
        super(message);

        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);

        const statusCode = coerceStatusCode(config.statusCode);
        if (statusCode) {
            this.statusCode = statusCode;
        } else {
            this.statusCode = getErrorStatusCode(input);
        }

        this.fatalError = fatalError;

        if (config.retryable != null) {
            this.retryable = config.retryable;
        }
    }
}

export interface TSErrorConfig {
    /**
     * A HTTP status code for easy use
    */
    statusCode?: number;

    /**
     * Used to indicate the an error is fatal
    */
    fatalError?: boolean;

    /**
     * Used sometimes to indicate whether an error is retryable
    */
    retryable?: boolean;

    /**
     * Prefix the error message with a reason
    */
    reason?: string;

    /**
     * If an error is passed in the stack will be preserved
    */
    withStack?: boolean;
}

export function isFatalError(err: any): boolean {
    return err && err.isFatalError;
}

export function isRetryableError(err: any): boolean {
    return err && err.retryable === true && !err.fatalError;
}

/** parse input to get error message or stack */
export function parseError(input: any, withStack = false): string {
    if (!input) return 'Unknown Error Occurred';

    const maxLen = 1000;
    if (utils.isString(input)) return utils.truncate(input, maxLen);
    if (isElasticsearchError(input)) {
        const esError = parseESErrorMsg(input);
        if (esError) return esError;
    }

    if (withStack && input.stack) return utils.truncate(input.stack, maxLen);

    const errMsg = utils.toString(input).replace(/^Error:/, '');
    return utils.truncate(errMsg, maxLen);
}

function parseESErrorMsg(input: ElasticsearchError): string {
    const bodyError = input && input.body && input.body.error;

    const rootCause = bodyError
        && bodyError.root_cause
        && utils.getFirst(bodyError.root_cause);

    let type: string|undefined;
    let reason: string|undefined;
    let index: string|undefined;

    [input, bodyError, rootCause]
        .forEach((obj) => {
            if (obj == null) return;
            if (!utils.isPlainObject(obj)) return;
            if (obj.type) type = obj.type;
            if (obj.reason) reason = obj.reason;
            if (obj.index) index = obj.index;
        });

    const metadata = input.toJSON();
    if (metadata.response) {
        const response = utils.tryParseJSON(metadata.response);
        if (!index && response && response._index) {
            index = response._index;
        }
    }

    let message = `Elasticsearch Error: ${normalizeESError(metadata.msg)}`;

    if (type) message += ` type: ${type}`;
    if (reason) message += ` reason: ${reason}`;
    if (index) message += ` on index: ${index}`;

    return message;
}

function normalizeESError(message?: string) {
    if (!message) return '';

    if (message.includes('document missing')) {
        return 'Not Found';
    }

    if (message.includes('document already exists')) {
        return 'Document Already Exists (version conflict)';
    }

    if (message.indexOf('unknown error') === 0) {
        return 'Unknown Elasticsearch Error, Cluster may be Unavailable';
    }

    return message;
}

export function prefixErrorMsg(msg: string, prefix?: string) {
    if (!prefix) return msg;
    return `${prefix}, caused by ${msg}`;
}

/** Check if an input has an error compatible api */
export function isError(err: any): err is Error {
    return err && err.stack && err.message;
}

/** Check is a TSError */
export function isTSError(err: any): err is TSError {
    if (err instanceof TSError) return true;
    if (!isError(err)) return false;

    // @ts-ignore
    return err.statusCode != null;
}

/** Check is a elasticsearch error */
export function isElasticsearchError(err: any): err is ElasticsearchError {
    return err && utils.isFunction(err.toJSON);
}

export interface ElasticsearchError extends Error {
    body?: {
        error?: {
            type?: string,
            reason?: string,
            index?: string
            root_cause?: [{
                type?: string,
                reason?: string,
                index?: string
            }]
        }
    };

    status?: number;
    type?: string;
    reason?: string;
    index?: string;

    toJSON(): {
        msg?: string;
        statusCode?: number;
        response?: string;
    };
}

function coerceStatusCode(input: any): number|null {
    return STATUS_CODES[input] != null ? input : null;
}

export function getErrorStatusCode(err: any): number {
    if (!isError(err)) return 500;

    const metadata = isElasticsearchError(err) ? err.toJSON() : {};

    const keys = ['statusCode', 'status', 'code'];
    for (const key of keys) {
        const statusCode = coerceStatusCode(metadata[key] || err[key]);
        if (statusCode) {
            return statusCode;
        }
    }

    return 500;
}