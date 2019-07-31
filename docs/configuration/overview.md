---
title: Teraslice Configuration
sidebar_label: Overview
---

Teraslice configuration is provided via a YAML configuration file. This file will typically have 2 sections.

1. `terafoundation` - Configuration related to the terafoundation runtime. Most significantly this is where you configure your datasource connectors.
2. `teraslice` - Configuration for the Teraslice node. When deploying a `native` clustering Teraslice you'll have separate configurations for the master and worker nodes. Otherwise a single configuration is all that is required.

The configuration file is provided to the Teraslice process at startup using the `-c` command line option along with the path to the file

#### Example Config

```yaml
```yaml
terafoundation:
    connectors:
        elasticsearch:
            default:
                host:
                    - localhost:9200

teraslice:
    workers: 8
    master: true
    master_hostname: 127.0.0.1
    name: teraslice
    hostname: 127.0.0.1

```

## Terafoundation Configuration Reference

|              Field               |                Type                |     Default     |                                                              Description                                                              |
| :------------------------------: | :--------------------------------: | :-------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
|         **environment**          |              `String`              | `"development"` |   If set to `production`, console logging will be disabled and logs will be sent to a file                        |
|     **log_buffer_interval**      |              `Number`              |     `60000`     |                                 How often the log buffer will flush the logs (number in milliseconds)                                 |
|       **log_buffer_limit**       |              `Number`              |      `30`       | Number of log lines to buffer before sending to elasticsearch, logging must have elasticsearch set as a value for this to take effect |
|        **log_connection**        |              `String`              |   `"default"`   |                                   logging connection endpoint if logging is saved to elasticsearch                                    |
| **log_index_rollover_frequency** | `"daily"`, `"monthly"`, `"yearly"` |   `"monthly"`   |                                              How frequently the log indices are created                                               |
|          **log_level**           |              `String`              |    `"info"`     |                                                        Default logging levels                                                         |
|           **log_path**           |              `String`              |    `"$PWD"`     |                                  Directory where the logs will be stored if logging is set to `file`                                  |
|           **logging**            |              `Array`               |   `"console"`   |                   Logging destinations. Expects an array of logging targets. options: console, file, elasticsearch                    |
|           **workers**            |              `Number`              |       `4`       |                                                     Number of workers per server                                                      |


## Teraslice Configuration Reference

|                      Field                      |                Type                |          Default           |                                                                 Description                                                                  |
| :---------------------------------------------: | :--------------------------------: | :------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------: |
|               **action_timeout**                |              `Number`              |          `300000`          |                  time in milliseconds for waiting for a action ( pause/stop job, etc) to complete before throwing an error                   |
|               **analytics_rate**                |              `Number`              |          `60000`           |                                           Rate in ms in which to push analytics to cluster master                                            |
|              **assets_directory**               |              `String`              |      `"$PWD/assets"`       |                                                         directory to look for assets                                                         |
|                **assets_volume**                |              `String`              |             -              |                                                      name of shared asset volume (k8s)                                                       |
|             **autoload_directory**              |              `String`              |     `"$PWD/autoload"`      |                                     directory to look for assets to auto deploy when teraslice boots up                                      |
|            **cluster_manager_type**             |     `"native"`, `"kubernetes"`     |         `"native"`         |                                                determines which cluster system should be used                                                |
|                     **cpu**                     |              `Number`              |             -              |                                         number of cpus to reserve per teraslice worker in kubernetes                                         |
|                  **hostname**                   |              `String`              |        `"$HOST_IP"`        |                                                          IP or hostname for server                                                           |
|     **index_rollover_frequency.analytics**      | `"daily"`, `"monthly"`, `"yearly"` |        `"monthly"`         |                                               How frequently the analytics indices are created                                               |
|       **index_rollover_frequency.state**        | `"daily"`, `"monthly"`, `"yearly"` |        `"monthly"`         |                                            How frequently the teraslice state indices are created                                            |
| **index_settings.analytics.number_of_replicas** |              `Number`              |            `1`             |                                                The number of replicas for the analytics index                                                |
|  **index_settings.analytics.number_of_shards**  |              `Number`              |            `5`             |                                                 The number of shards for the analytics index                                                 |
|  **index_settings.assets.number_of_replicas**   |              `Number`              |            `1`             |                                                 The number of replicas for the assets index                                                  |
|   **index_settings.assets.number_of_shards**    |              `Number`              |            `5`             |                                                  The number of shards for the assets index                                                   |
| **index_settings.execution.number_of_replicas** |              `Number`              |            `1`             |                                                The number of replicas for the execution index                                                |
|  **index_settings.execution.number_of_shards**  |              `Number`              |            `5`             |                                                 The number of shards for the execution index                                                 |
|   **index_settings.jobs.number_of_replicas**    |              `Number`              |            `1`             |                                                  The number of replicas for the jobs index                                                   |
|    **index_settings.jobs.number_of_shards**     |              `Number`              |            `5`             |                                                   The number of shards for the jobs index                                                    |
|   **index_settings.state.number_of_replicas**   |              `Number`              |            `1`             |                                                  The number of replicas for the state index                                                  |
|    **index_settings.state.number_of_shards**    |              `Number`              |            `5`             |                                                   The number of shards for the state index                                                   |
|         **kubernetes_config_map_name**          |              `String`              |    `"teraslice-worker"`    |                                  Specify the name of the Kubernetes ConfigMap used to configure worker pods                                  |
|              **kubernetes_image**               |              `String`              |  `"terascope/teraslice"`   |                             Specify a custom image name for kubernetes, this only applies to kubernetes systems                              |
|        **kubernetes_image_pull_secret**         |              `String`              |             -              |                                 Name of Kubernetes secret used to pull docker images from private repository                                 |
|            **kubernetes_namespace**             |              `String`              |        `"default"`         |                                Specify a custom kubernetes namespace, this only applies to kubernetes systems                                |
|                   **master**                    |             `Boolean`              |          `false`           |                                      boolean for determining if cluster_master should live on this node                                      |
|               **master_hostname**               |              `String`              |       `"localhost"`        |                         hostname where the cluster_master resides, used to notify all node_masters where to connect                          |
|                   **memory**                    |              `Number`              |             -              |                                       memory, in bytes, to reserve per teraslice worker in kubernetes                                        |
|                    **name**                     |        `elasticsearch_Name`        |      `"teracluster"`       |                                      Name for the cluster itself, its used for naming log files/indices                                      |
|           **network_latency_buffer**            |              `Number`              |          `15000`           | time in milliseconds buffer which is combined with action_timeout to determine how long the cluster master will wait till it throws an error |
|           **node_disconnect_timeout**           |              `Number`              |          `300000`          |       time in milliseconds that the cluster  will wait untill it drops that node from state and attempts to provision the lost workers       |
|             **node_state_interval**             |              `Number`              |           `5000`           |                         time in milliseconds that indicates when the cluster master will ping nodes for their state                          |
|                    **port**                     |               `port`               |           `5678`           |                                                   port for the cluster_master to listen on                                                   |
|                  **reporter**                   |              `String`              |             -              |                                                          not currently operational                                                           |
|              **shutdown_timeout**               |              `Number`              |          `60000`           |                   time in milliseconds, to allow workers and slicers to finish operations before forcefully shutting down                    |
|         **slicer_allocation_attempts**          |              `Number`              |            `3`             |                                     The number of times a slicer will try to be allocated before failing                                     |
|              **slicer_port_range**              |              `String`              |      `"45679:46678"`       |                                                range of ports that slicers will use per node                                                 |
|               **slicer_timeout**                |              `Number`              |          `180000`          |                       time in milliseconds that the slicer will wait for worker connection before terminating the job                        |
|                    **state**                    |              `Object`              | `{"connection":"default"}` |                                     Elasticsearch cluster where job state, analytics and logs are stored                                     |
|          **worker_disconnect_timeout**          |              `Number`              |          `300000`          |                time in milliseconds that the slicer will wait after all workers have disconnected before terminating the job                 |
|                   **workers**                   |              `Number`              |            `4`             |                                                         Number of workers per server                                                         |


### Terafoundation Connectors

You use Terafoundation connectors to define how to access your various data sources. Connectors are grouped by type with each each key defining a separate connection name for that type of data source. This allows you to define many connections to different data sources so that you can route data between them. The connection name defined here can then be used in the `connection` attribute provided to processors in your jobs.

For Example

```yaml
# ...
terafoundation:
    # ...
    connectors:
        elasticsearch:
            default:
                host:
                    - '127.0.0.1:9200'
                keepAlive: false
                maxRetries: 5
                maxSockets: 20
            secondary:
                host:
                    - 'some-other-ip:9200'
                apiVersion: '6.5'
                maxRetries: 0
        kafka:
            default:
                brokers: "localhost:9092"            
# ...
```

In this example we specify two different connector types: `elasticsearch` and `kafka`. Under each connector type you may then create custom endpoint configurations that will be validated against the defaults specified in node_modules/terafoundation/lib/connectors. In the elasticsearch example there is the `default` endpoint and the `secondary` endpoint which connects to a different elasticsearch cluster. Each endpoint has independent configuration options. 

These different endpoints can be retrieved through terafoundations's connector API. As it's name implies, the `default` connector is what will be provided if a connection is requested without providing a specific name. In general we don't recommend doing that if you have multiple clusters, but it's convenient if you only have one.

## Configuration Single Node / Native Clustering - Cluster Master 

If you're running a single Teraslice node or using the simple native clustering you'll need a master node configuration.

The master node will still have workers available and this configuration is sufficient to do useful work if you don't yet have multiple nodes available. The workers will connect to the master on localhost and do work just as if they were in a real cluster. Then if you want to add workers you can use the worker configuration below as a starting point on adding more nodes.

```yaml
teraslice:
    workers: 8
    master: true
    master_hostname: "127.0.0.1"
    name: "teracluster"

terafoundation:
    log_path: '/path/to/logs'

    connectors:
        elasticsearch:
            default:
                host:
                    - YOUR_ELASTICSEARCH_IP:9200
```

## Configuration Native Clustering - Worker Node

Configuration for a worker node is very similar. You just set `master` to false and provide the IP address where the master node can be located.

```yaml
teraslice:
    workers: 8
    master: false
    master_hostname: "YOUR_MASTER_IP"
    name: "teracluster"

terafoundation:
    log_path: '/path/to/logs'

    connectors:
        elasticsearch:
            default:
                host:
                    - YOUR_ELASTICSEARCH_IP:9200
```