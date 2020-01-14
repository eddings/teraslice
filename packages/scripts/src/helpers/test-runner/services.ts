import ms from 'ms';
import got from 'got';
import semver from 'semver';
import { debugLogger, pRetry, TSError } from '@terascope/utils';
import { getServicesForSuite } from '../misc';
import {
    dockerRun,
    DockerRunOptions,
    getContainerInfo,
    dockerStop
} from '../scripts';
import { TestOptions } from './interfaces';
import { Service } from '../interfaces';
import * as config from '../config';
import signale from '../signale';

const logger = debugLogger('ts-scripts:cmd:test');

const disableXPackSecurity = !config.ELASTICSEARCH_DOCKER_IMAGE.includes('blacktop');

const services: { [service in Service]: DockerRunOptions } = {
    [Service.Elasticsearch]: {
        image: config.ELASTICSEARCH_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.ELASTICSEARCH_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/usr/share/elasticsearch/data']
            : undefined,
        ports: [`${config.ELASTICSEARCH_PORT}:${config.ELASTICSEARCH_PORT}`],
        env: {
            ES_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.ELASTICSEARCH_PORT,
            'discovery.type': 'single-node',
            ...disableXPackSecurity && {
                'xpack.security.enabled': 'false'
            }
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.Kafka]: {
        image: config.KAFKA_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.KAFKA_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/tmp/kafka-logs']
            : undefined,
        ports: [`${config.KAFKA_PORT}:${config.KAFKA_PORT}`],
        env: {
            KAFKA_HEAP_OPTS: config.SERVICE_HEAP_OPTS,
            KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true',
            KAFKA_ADVERTISED_HOST_NAME: config.HOST_IP,
            KAFKA_ADVERTISED_PORT: config.KAFKA_PORT,
            KAFKA_PORT: config.KAFKA_PORT,
            KAFKA_NUM_PARTITIONS: '2',
        },
        network: config.DOCKER_NETWORK_NAME
    },
};

export async function ensureServices(suite: string, options: TestOptions): Promise<() => void> {
    const launchServices = getServicesForSuite(suite);

    try {
        const promises: Promise<(() => void)>[] = [];

        if (launchServices.includes(Service.Elasticsearch)) {
            promises.push(ensureElasticsearch(options));
        }

        if (launchServices.includes(Service.Kafka)) {
            promises.push(ensureKafka(options));
        }

        const fns = await Promise.all(promises);

        return () => {
            fns.forEach((fn) => fn());
        };
    } catch (err) {
        throw new TSError(err, {
            message: `Failed to start services for test suite "${suite}"`,
        });
    }
}

export async function ensureKafka(options: TestOptions): Promise<() => void> {
    let fn = () => {};
    fn = await startService(options, Service.Kafka);
    await checkKafka(options);
    return fn;
}

export async function ensureElasticsearch(options: TestOptions): Promise<() => void> {
    let fn = () => {};
    fn = await startService(options, Service.Elasticsearch);
    await checkElasticsearch(options, 10);
    return fn;
}

async function stopService(service: Service) {
    const { name } = services[service];
    const info = await getContainerInfo(name);
    if (!info) return;

    const startTime = Date.now();
    signale.pending(`stopping service ${service}`);
    await dockerStop(name);
    signale.success(`stopped service ${service}, took ${ms(Date.now() - startTime)}`);
}

async function checkElasticsearch(options: TestOptions, retries: number): Promise<void> {
    const elasticsearchHost = config.ELASTICSEARCH_HOST;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.ELASTICSEARCH_HOSTNAME)) return;

    return pRetry(
        async () => {
            if (options.trace) {
                signale.debug(`checking elasticsearch at ${elasticsearchHost}`);
            } else {
                logger.debug(`checking elasticsearch at ${elasticsearchHost}`);
            }

            let body: any;
            try {
                ({ body } = await got(elasticsearchHost, {
                    json: true,
                    throwHttpErrors: true,
                    retry: 0,
                }));
            } catch (err) {
                throw new TSError(err, {
                    retryable: true,
                });
            }

            if (options.trace) {
                signale.debug('got response from elasticsearch service', body);
            } else {
                logger.debug('got response from elasticsearch service', body);
            }

            if (!body || !body.version || !body.version.number) {
                throw new TSError(`Invalid response from elasticsearch at ${elasticsearchHost}`, {
                    retryable: true,
                });
            }

            const actual: string = body.version.number;
            const expected = options.elasticsearchVersion;

            const satifies = semver.satisfies(actual, `^${expected}`);
            if (satifies) {
                if (options.debug) {
                    signale.debug(`elasticsearch@${actual} is running at ${elasticsearchHost}`);
                }
                return;
            }

            throw new TSError(
                `Elasticsearch at ${elasticsearchHost} does not satify required version of ${expected}, got ${actual}`,
                {
                    retryable: false,
                }
            );
        },
        {
            retries,
            maxDelay: 1000
        }
    );
}

async function startService(options: TestOptions, service: Service): Promise<() => void> {
    const version = options[`${service}Version`] as string;
    if (options.useExistingServices) {
        signale.warn(`expecting ${service}@${version} to be running (this can be dangerous)...`);
        return () => {};
    }

    const startTime = Date.now();
    signale.pending(`starting ${service}@${version} service...`);

    await stopService(service);

    const fn = await dockerRun(services[service], version, options.debug || options.trace);

    signale.success(`started ${service}@${version} service, took ~${ms(Date.now() - startTime)}`);

    return () => {
        try {
            fn();
        } catch (err) {
            signale.error(
                new TSError(err, {
                    reason: `Failed to stop ${service}@${version} service`,
                })
            );
        }
    };
}

async function checkKafka(options: TestOptions) {
    if (options.debug) {
        signale.debug(`kafka should be running at ${config.KAFKA_BROKER}`);
    }
}
