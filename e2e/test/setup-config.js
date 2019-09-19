'use strict';

const _ = require('lodash');
const path = require('path');
const fse = require('fs-extra');
const {
    WORKERS_PER_NODE,
    KAFKA_BROKER,
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_API_VERSION,
    CLUSTER_NAME,
    HOST_IP
} = require('./misc');

module.exports = async function setupTerasliceConfig() {
    const baseConfig = {
        terafoundation: {
            environment: 'development',
            log_level: [
                { console: 'warn' },
                { file: 'info', }
            ],
            logging: [
                'console',
                'file'
            ],
            log_path: '/app/logs',
            connectors: {
                elasticsearch: {
                    default: {
                        host: [ELASTICSEARCH_HOST],
                        apiVersion: ELASTICSEARCH_API_VERSION,
                        requestTimeout: '1 minute',
                        deadTimeout: '45 seconds',
                        sniffOnStart: false,
                        sniffOnConnectionFault: false,
                        suggestCompression: false
                    }
                },
                kafka: {
                    default: {
                        brokers: [KAFKA_BROKER]
                    }
                }
            }
        },
        teraslice: {
            worker_disconnect_timeout: '2 minutes',
            node_disconnect_timeout: '2 minutes',
            slicer_timeout: '2 minutes',
            shutdown_timeout: '30 seconds',
            action_timeout: '15 seconds',
            network_latency_buffer: '5 seconds',
            analytics_rate: '15 seconds',
            slicer_allocation_attempts: 0,
            assets_directory: '/app/assets',
            autoload_directory: '/app/autoload',
            workers: WORKERS_PER_NODE,
            port: 45678,
            name: CLUSTER_NAME,
            index_settings: {
                analytics: {
                    number_of_shards: 1,
                    number_of_replicas: 0
                },
                assets: {
                    number_of_shards: 1,
                    number_of_replicas: 0
                },
                jobs: {
                    number_of_shards: 1,
                    number_of_replicas: 0
                },
                execution: {
                    number_of_shards: 1,
                    number_of_replicas: 0
                },
                state: {
                    number_of_shards: 1,
                    number_of_replicas: 0
                }
            }
        }
    };

    const configPath = path.join(__dirname, '..', '.config');
    if (!fse.existsSync(configPath)) {
        await fse.emptyDir(configPath);
    }

    await fse.ensureDir(configPath);

    await writeMasterConfig(configPath, baseConfig);
    await writeWorkerConfig(configPath, baseConfig);
};

async function writeMasterConfig(configPath, baseConfig) {
    const masterConfig = _.cloneDeep(baseConfig);
    masterConfig.teraslice.master = true;
    masterConfig.teraslice.master_hostname = HOST_IP;

    const masterConfigPath = path.join(configPath, 'teraslice-master.json');
    await fse.writeJSON(masterConfigPath, masterConfig, {
        spaces: 4
    });
}

async function writeWorkerConfig(configPath, baseConfig) {
    const workerConfig = _.cloneDeep(baseConfig);
    workerConfig.teraslice.master = false;
    workerConfig.teraslice.master_hostname = HOST_IP;

    const workerConfigPath = path.join(configPath, 'teraslice-worker.json');
    await fse.writeJSON(workerConfigPath, workerConfig, {
        spaces: 4
    });
}