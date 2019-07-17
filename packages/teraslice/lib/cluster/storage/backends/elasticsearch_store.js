'use strict';

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const {
    TSError,
    parseError,
    isTest,
    pDelay,
    pRetry
} = require('@terascope/utils');
const elasticsearchApi = require('@terascope/elasticsearch-api');
const { getClient } = require('@terascope/job-components');
const { timeseriesIndex } = require('../../../utils/date_utils');

module.exports = function module(backendConfig) {
    const {
        context,
        indexName,
        recordType,
        idField,
        storageName,
        bulkSize = 500,
        fullResponse = false,
        logRecord = true,
        forceRefresh = true,
    } = backendConfig;

    const logger = context.apis.foundation.makeLogger({
        module: 'elasticsearch_backend',
        storageName,
    });

    const config = context.sysconfig.teraslice;

    const indexSettings = _.get(config, ['index_settings', storageName], {
        number_of_shards: 5,
        number_of_replicas: 1,
    });

    let elasticsearch;
    let client;
    let flushInterval;
    let isShutdown = false;

    // Buffer to build up bulk requests.
    let bulkQueue = [];
    let savingBulk = false; // serialize save requests.

    function getRecord(recordId, indexArg, fields) {
        logger.trace(`getting record id: ${recordId}`);
        const query = {
            index: indexArg || indexName,
            type: recordType,
            id: recordId,
        };

        if (fields) {
            query._source = fields;
        }
        return elasticsearch.get(query);
    }

    function search(query, from, size, sort, fields, indexArg = indexName) {
        const esQuery = {
            index: indexArg,
            from,
            size,
            sort,
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        if (fields) {
            esQuery._source = fields;
        }

        return elasticsearch.search(esQuery);
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creation
     */
    function index(record, indexArg = indexName) {
        logger.trace('indexing record', logRecord ? record : null);
        const query = {
            index: indexArg,
            type: recordType,
            body: record,
            refresh: forceRefresh,
        };

        return elasticsearch.index(query);
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    function indexWithId(recordId, record, indexArg = indexName) {
        logger.trace(`indexWithId call with id: ${recordId}, record`, logRecord ? record : null);
        const query = {
            index: indexArg,
            type: recordType,
            id: recordId,
            body: record,
            refresh: forceRefresh,
        };

        return elasticsearch.indexWithId(query);
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    function create(record, indexArg = indexName) {
        logger.trace('creating record', logRecord ? record : null);

        const query = {
            index: indexArg,
            type: recordType,
            id: record[idField],
            body: record,
            refresh: forceRefresh,
        };

        return elasticsearch.create(query);
    }

    function count(query, from, sort, indexArg = indexName) {
        const esQuery = {
            index: indexArg,
            from,
            sort,
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        return elasticsearch.count(esQuery);
    }

    function update(recordId, updateSpec, indexArg = indexName) {
        logger.trace(`updating record ${recordId}, `, logRecord ? updateSpec : null);

        const query = {
            index: indexArg,
            type: recordType,
            id: recordId,
            body: {
                doc: updateSpec,
            },
            refresh: forceRefresh,
            retryOnConflict: 3,
        };

        return elasticsearch.update(query);
    }

    function remove(recordId, indexArg = indexName) {
        logger.trace(`removing record ${recordId}`);
        const query = {
            index: indexArg,
            type: recordType,
            id: recordId,
            refresh: forceRefresh,
        };

        return elasticsearch.remove(query);
    }

    function bulk(record, _type, indexArg = indexName) {
        if (isShutdown) {
            throw new TSError('Unable to send bulk record after shutdown', {
                context: {
                    recordType,
                    record,
                },
            });
        }

        const type = _type || 'index';

        const indexRequest = {
            [type]: {
                _index: indexArg,
                _type: recordType,
            }
        };

        bulkQueue.push(indexRequest, record);

        // We only flush once enough records have accumulated for it to make sense.
        if (bulkQueue.length >= bulkSize) {
            logger.trace(`flushing bulk queue ${bulkQueue.length}`);
            return _flush();
        }

        // Bulk saving is a background operation so we don't have
        // anything meaningful to return.
        return Promise.resolve(true);
    }

    function shutdown(forceShutdown) {
        const startTime = Date.now();
        clearInterval(flushInterval);
        if (forceShutdown !== true) {
            return _flush(true);
        }

        return new Promise((resolve, reject) => {
            logger.trace(`attempting to shutdown, will destroy in ${config.shutdown_timeout}`);
            const timeout = setTimeout(_destroy, config.shutdown_timeout).unref();

            function _destroy(err) {
                logger.trace(`shutdown store, took ${Date.now() - startTime}ms`);

                bulkQueue.length = [];
                isShutdown = true;
                clearTimeout(timeout);

                if (err) reject(err);
                else resolve();
            }

            _flush(true)
                .then(() => {
                    _destroy();
                })
                .catch((err) => {
                    _destroy(err);
                });
        });
    }

    async function bulkSend(bulkRequest) {
        let recordCount = 0;
        try {
            await pRetry(async () => {
                const results = await elasticsearch.bulkSend(bulkRequest);
                recordCount = results.items.length;
            }, {
                // retry any error that has Request Timeout or No Living Connections
                matches: ['Request Timeout', 'No Living Connections'],
                logError: logger.warn,
            });
        } catch (err) {
            throw new TSError(err, {
                reason: `Failure to bulk create "${recordType}"`,
            });
        }
        // since this library only supports bulk updates by pairs
        // we can log when the expected count is different
        const expectedCount = (bulkRequest.length / 2);
        if (recordCount !== expectedCount) {
            logger.warn(`expected to bulk send ${expectedCount} records but got ${count}`);
        }
        return recordCount;
    }

    async function _flush(shuttingDown = false) {
        if (!bulkQueue.length) return;
        if (!shuttingDown && savingBulk) return;

        savingBulk = true;

        const bulkRequest = bulkQueue.slice();
        bulkQueue = [];

        try {
            const recordCount = await bulkSend(bulkRequest);
            const extraMsg = shuttingDown ? ', on shutdown' : '';
            logger.debug(`flushed ${recordCount}${extraMsg} records to index ${indexName}`);
        } finally {
            savingBulk = false;
        }
    }

    function getMapFile() {
        const mappingFile = path.join(__dirname, `mappings/${recordType}.json`);

        const mapping = JSON.parse(fs.readFileSync(mappingFile));
        mapping.settings = {
            'index.number_of_shards': indexSettings.number_of_shards,
            'index.number_of_replicas': indexSettings.number_of_replicas,
        };
        return mapping;
    }

    function isAvailable(indexArg = indexName) {
        const query = {
            index: indexArg,
            q: '',
            size: 0,
            terminate_after: '1',
        };

        return new Promise((resolve) => {
            elasticsearch
                .search(query)
                .then((results) => {
                    logger.trace(`index ${indexName} is now available`);
                    resolve(results);
                })
                .catch(() => {
                    let running = false;
                    const isReady = setInterval(() => {
                        if (isShutdown) {
                            clearInterval(isReady);
                            return;
                        }

                        if (running) return;
                        running = true;

                        elasticsearch
                            .search(query)
                            .then((results) => {
                                running = false;

                                clearInterval(isReady);
                                resolve(results);
                            })
                            .catch(() => {
                                running = false;

                                logger.warn(`verifying ${recordType} index is open`);
                            });
                    }, 200);
                });
        });
    }

    function sendTemplate(mapping) {
        if (mapping.template) {
            const clusterName = context.sysconfig.teraslice.name;
            const name = `${clusterName}_${recordType}_template`;
            // setting template name to reflect current teraslice instance name to help prevent
            // conflicts with differing versions of teraslice with same elastic db
            if (mapping.template) {
                if (!mapping.template.match(clusterName)) {
                    mapping.template = `${clusterName}${mapping.template}`;
                }
            }

            return putTemplate(mapping, name);
        }

        return Promise.resolve(true);
    }

    function _createIndex(indexArg = indexName) {
        const existQuery = { index: indexArg };
        return elasticsearch.index_exists(existQuery).then((exists) => {
            if (!exists) {
                const mapping = getMapFile();

                // Make sure the index exists before we do anything else.
                const createQuery = {
                    index: indexArg,
                    body: mapping,
                };

                // add a random delay to stagger requests
                return pDelay(isTest ? 0 : _.random(0, 5000))
                    .then(() => sendTemplate(mapping))
                    .then(() => elasticsearch.index_create(createQuery))
                    .then(results => results)
                    .catch((err) => {
                        // It's not really an error if it's just that the index is already there
                        if (parseError(err).match(/index_already_exists_exception/)) {
                            return true;
                        }

                        const error = new TSError(err, {
                            reason: `Could not create index: ${indexName}`,
                        });
                        return Promise.reject(error);
                    });
            }

            // Index already exists. nothing to do.
            return true;
        });
    }

    function refresh(indexArg = indexName) {
        const query = { index: indexArg };
        return elasticsearch.index_refresh(query);
    }

    function putTemplate(template, name) {
        return elasticsearch.putTemplate(template, name);
    }

    function verifyClient() {
        if (isShutdown) return false;
        return elasticsearch.verifyClient();
    }

    // Periodically flush the bulkQueue so we don't end up with cached data lingering.
    flushInterval = setInterval(() => {
        _flush().catch((err) => {
            logger.error(err, 'background flush failure');
            return null;
        });
        // stager the interval to avoid collisions
    }, _.random(9000, 11000));

    // javascript is having a fit if you use the shorthand get, so we renamed function to getRecord
    const api = {
        get: getRecord,
        search,
        refresh,
        index,
        indexWithId,
        create,
        update,
        bulk,
        bulkSend,
        remove,
        shutdown,
        count,
        putTemplate,
        verifyClient,
    };

    const isMultiIndex = indexName[indexName.length - 1] === '*';
    let newIndex = indexName;

    if (isMultiIndex) {
        const storeType = indexName.match(/__(.*)\*/)[1];
        const timeseriesFormat = config.index_rollover_frequency[storeType];
        const nameSize = indexName.length - 1;
        newIndex = timeseriesIndex(timeseriesFormat, indexName.slice(0, nameSize)).index;
    }

    return new Promise((resolve, reject) => {
        const clientName = JSON.stringify({
            connection: config.state.connection,
            index: indexName,
        });

        const connectionConfig = Object.assign({}, config.state);
        if (connectionConfig.connection_cache == null) {
            connectionConfig.connection_cache = true;
        }
        client = getClient(context, connectionConfig, 'elasticsearch');
        if (!client) {
            reject(new Error(`Unable to get client for connection: ${config.state.connection}`));
            return;
        }

        let { connection } = config.state;
        if (config.state.endpoint) {
            connection += `:${config.state.endpoint}`;
        }

        const options = {
            full_response: !!fullResponse,
            connection,
        };

        elasticsearch = elasticsearchApi(client, logger, options);
        _createIndex(newIndex)
            .then(() => isAvailable(newIndex))
            .then(() => resolve(api))
            .catch((err) => {
                const error = new TSError(err, {
                    reason: `Failure initializing ${recordType} index: ${indexName}`,
                });
                logger.error(error);
                logger.info(`Attempting to connect to elasticsearch: ${clientName}`);
                let running = false;

                const checking = setInterval(() => {
                    if (isShutdown) {
                        clearInterval(checking);
                        return;
                    }
                    if (running) return;
                    running = true;

                    _createIndex(newIndex)
                        .then(() => {
                            const query = { index: newIndex };
                            return elasticsearch.index_recovery(query);
                        })
                        .then((results) => {
                            let bool = false;
                            if (Object.keys(results).length !== 0) {
                                const isPrimary = _.filter(
                                    results[newIndex].shards,
                                    shard => shard.primary === true
                                );

                                bool = _.every(isPrimary, shard => shard.stage === 'DONE');
                            }

                            if (bool) {
                                clearInterval(checking);
                                logger.info('connection to elasticsearch has been established');
                                return isAvailable(newIndex).then(() => {
                                    resolve(api);
                                });
                            }
                            return true;
                        })
                        .then(() => {
                            running = false;
                        })
                        .catch((checkingErr) => {
                            // add a random delay to stagger requests
                            pDelay(isTest ? 0 : _.random(0, 1000)).then(() => {
                                running = false;
                                const checkingError = new TSError(checkingErr, {
                                    reason: `Attempting to connect to elasticsearch: ${clientName}`,
                                });
                                logger.info(checkingError.message);
                            });
                        });
                }, 3000);
            });
    });
};
