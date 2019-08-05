'use strict';

const { newId } = require('../lib/utils/id_utils');

const {
    TEST_INDEX_PREFIX = 'teratest_',
    ELASTICSEARCH_HOST = 'http://localhost:9200',
    TERASLICE_CLUSTER_NAME = newId(`${TEST_INDEX_PREFIX}teraslice`, true, 2),
    ELASTICSEARCH_VERSION = '6.8',
    ELASTICSEARCH_API_VERSION = '6.5'
} = process.env;

process.env.TERASLICE_CLUSTER_NAME = TERASLICE_CLUSTER_NAME;
process.env.ELASTICSEARCH_HOST = ELASTICSEARCH_HOST;
process.env.ELASTICSEARCH_API_VERSION = ELASTICSEARCH_API_VERSION;
process.env.ELASTICSEARCH_VERSION = ELASTICSEARCH_VERSION;

module.exports = {
    TEST_INDEX_PREFIX,
    ELASTICSEARCH_HOST,
    TERASLICE_CLUSTER_NAME,
    ELASTICSEARCH_VERSION,
    ELASTICSEARCH_API_VERSION
};
