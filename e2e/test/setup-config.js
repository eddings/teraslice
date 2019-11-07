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
            master_hostname: HOST_IP,
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

    const baseConfigPath = path.join(__dirname, '..', '.config');
    if (!fse.existsSync(baseConfigPath)) {
        await fse.emptyDir(baseConfigPath);
    }

    await fse.ensureDir(baseConfigPath);

    await writeMasterConfig(baseConfigPath, baseConfig);
    await writeWorkerConfig(baseConfigPath, baseConfig);
};

async function writeMasterConfig(configPath, baseConfig) {
    const masterConfig = _.cloneDeep(baseConfig);
    masterConfig.teraslice.master = true;

    const masterConfigPath = path.join(configPath, 'teraslice-master.json');
    await fse.writeJSON(masterConfigPath, masterConfig, {
        spaces: 4
    });
}

async function writeWorkerConfig(configPath, baseConfig) {
    const workerConfig = _.cloneDeep(baseConfig);
    workerConfig.teraslice.master = false;

    const workerConfigPath = path.join(configPath, 'teraslice-worker.json');
    await fse.writeJSON(workerConfigPath, workerConfig, {
        spaces: 4
    });
}
