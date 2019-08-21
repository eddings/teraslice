'use strict';

const ip = require('ip');
const path = require('path');
const { isPlainObject } = require('@terascope/utils');

const workerCount = require('os').cpus().length;

const schema = {
    assets_directory: {
        doc: 'directory to look for assets',
        default: path.join(process.cwd(), './assets'),
        format: 'optional_String'
    },
    assets_volume: {
        doc: 'name of shared asset volume (k8s)',
        default: '',
        format: 'optional_String'
    },
    autoload_directory: {
        doc: 'directory to look for assets to auto deploy when teraslice boots up',
        default: path.join(process.cwd(), './autoload'),
        format: 'optional_String'
    },
    hostname: {
        doc: 'IP or hostname for server',
        default: ip.address(),
        format: 'required_String'
    },
    workers: {
        doc: 'Number of workers per server',
        default: workerCount,
        format(val) {
            if (isNaN(val)) {
                throw new Error('workers parameter for teraslice must be a number');
            } else if (val < 0) {
                throw new Error('workers for teraslice must be >= zero');
            }
        }
    },
    master: {
        doc: 'boolean for determining if cluster_master should live on this node',
        default: false,
        format: Boolean
    },
    master_hostname: {
        doc:
            'hostname where the cluster_master resides, used to notify all node_masters where to connect',
        default: 'localhost',
        format: 'required_String'
    },
    port: {
        doc: 'port for the cluster_master to listen on',
        default: 5678,
        format: 'port'
    },
    name: {
        doc: 'Name for the cluster itself, its used for naming log files/indices',
        default: 'teracluster',
        format: 'elasticsearch_Name'
    },
    state: {
        doc: 'Elasticsearch cluster where job state, analytics and logs are stored',
        default: { connection: 'default' },
        format(val) {
            if (!val.connection) {
                throw new Error('state parameter must be an object with a key named "connection"');
            }
            if (typeof val.connection !== 'string') {
                throw new Error(
                    'state parameter object with a key "connection" must be of type String as the value'
                );
            }
        }
    },
    index_settings: {
        analytics: {
            number_of_shards: {
                doc: 'The number of shards for the analytics index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the analytics index',
                default: 1
            }
        },
        assets: {
            number_of_shards: {
                doc: 'The number of shards for the assets index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the assets index',
                default: 1
            }
        },
        jobs: {
            number_of_shards: {
                doc: 'The number of shards for the jobs index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the jobs index',
                default: 1
            }
        },
        execution: {
            number_of_shards: {
                doc: 'The number of shards for the execution index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the execution index',
                default: 1
            }
        },
        state: {
            number_of_shards: {
                doc: 'The number of shards for the state index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the state index',
                default: 1
            }
        }
    },
    shutdown_timeout: {
        doc:
            'time in milliseconds for workers and slicers to finish operations before forcefully shutting down',
        default: 60000,
        format: 'duration'
    },
    node_disconnect_timeout: {
        doc:
            'time in milliseconds that the cluster  will wait untill it drops that node from state and attempts to provision the lost workers',
        default: 300000,
        format: 'duration'
    },
    worker_disconnect_timeout: {
        doc:
            'time in milliseconds that the slicer will wait after all workers have disconnected before terminating the job',
        default: 300000,
        format: 'duration'
    },
    slicer_timeout: {
        doc:
            'time in milliseconds that the slicer will wait for worker connection before terminating the job',
        default: 180000,
        format: 'duration'
    },
    action_timeout: {
        doc:
            'time in milliseconds for waiting for a network message (pause/stop job, etc) to complete before throwing an error',
        default: 300000,
        format: 'duration'
    },
    network_latency_buffer: {
        doc:
            'time in milliseconds buffer which is combined with action_timeout to determine how long a network message will wait till it throws an error',
        default: 15000,
        format: 'duration'
    },
    node_state_interval: {
        doc:
            'time in milliseconds that indicates when the cluster master will ping nodes for their state',
        default: 5000,
        format: 'duration'
    },
    analytics_rate: {
        doc: 'time in milliseconds in which to push analytics to cluster master',
        default: 60000,
        format: 'duration'
    },
    slicer_allocation_attempts: {
        doc: 'The number of times a slicer will try to be allocated before failing',
        default: 3,
        format: 'nat', // integer >=0 (natural number)
    },
    slicer_port_range: {
        doc: 'range of ports that slicers will use per node',
        default: '45679:46678',
        format(val) {
            const arr = val.split(':');
            if (arr.length !== 2) {
                throw new Error('slicer_port_range is formatted incorrectly');
            }
            arr.forEach((value) => {
                if (isNaN(value)) {
                    throw new Error(
                        'values specified in slicer_port_range must be a number specified as a string'
                    );
                }
            });
        }
    },
    index_rollover_frequency: {
        state: {
            doc: 'How frequently the teraslice state indices are created',
            default: 'monthly',
            format: ['daily', 'monthly', 'yearly']
        },
        analytics: {
            doc: 'How frequently the analytics indices are created',
            default: 'monthly',
            format: ['daily', 'monthly', 'yearly']
        }
    },
    cluster_manager_type: {
        doc: 'determines which cluster system should be used',
        default: 'native',
        format: ['native', 'kubernetes']
    },
    cpu: {
        doc: 'number of cpus to reserve per teraslice worker in kubernetes',
        default: undefined,
        format: 'Number'
    },
    memory: {
        doc: 'memory, in bytes, to reserve per teraslice worker in kubernetes',
        default: undefined,
        format: 'Number'
    },
    env_vars: {
        default: {},
        doc: 'default environment variables to set on each the teraslice worker, in the format, { "EXAMPLE": "test" }',
        format(obj) {
            if (!isPlainObject(obj)) {
                throw new Error('must be object');
            }
            Object.entries(obj).forEach(([key, val]) => {
                if (key == null || key === '') {
                    throw new Error('key must be not empty');
                }

                if (val == null || val === '') {
                    throw new Error(`value for key "${key}" must be not empty`);
                }
            });
        },
    },
    kubernetes_image: {
        doc: 'Specify a custom image name for kubernetes, this only applies to kubernetes systems',
        default: 'terascope/teraslice',
        format: 'optional_String'
    },
    kubernetes_namespace: {
        doc: 'Specify a custom kubernetes namespace, this only applies to kubernetes systems',
        default: 'default',
        format: 'optional_String'
    },
    kubernetes_config_map_name: {
        doc: 'Specify the name of the Kubernetes ConfigMap used to configure worker pods',
        default: 'teraslice-worker',
        format: 'optional_String'
    },
    kubernetes_image_pull_secret: {
        doc: 'Name of Kubernetes secret used to pull docker images from private repository',
        default: '',
        format: 'optional_String'
    }
};

function configSchema() {
    return { teraslice: schema };
}

module.exports = {
    configSchema,
    config_schema: configSchema,
    schema
};
