import fs from 'fs';
import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { toBoolean, castArray } from '@terascope/utils';
import { TestSuite, PackageInfo, GlobalCMDOptions } from '../helpers/interfaces';
import * as config from '../helpers/config';
import { listPackages } from '../helpers/packages';
import { runTests } from '../helpers/test-runner';
import { coercePkgArg } from '../helpers/args';

type Options = {
    debug: boolean;
    watch: boolean;
    bail: boolean;
    suite?: TestSuite;
    'report-coverage': boolean;
    'elasticsearch-host': string;
    'elasticsearch-version': string;
    'elasticsearch-api-version': string;
    'kafka-broker': string;
    'kafka-version': string;
    'use-existing-services': boolean;
    packages?: PackageInfo[];
};

const jestArgs = getExtraArgs();

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'test [packages..]',
    describe: 'Run monorepo tests',
    builder(yargs) {
        return yargs
            .example('$0 test', 'example --watch -- --testPathPattern worker-spec')
            .example('$0 test', 'example --debug --bail')
            .example('$0 test', '. --debug --bail')
            .option('debug', {
                alias: 'd',
                description: 'This will run all of the tests in-band and output any debug info',
                type: 'boolean',
                default: false,
            })
            .option('bail', {
                description: 'This will cause the tests to stop at the first failed test.',
                type: 'boolean',
                default: isCI,
            })
            .option('report-coverage', {
                description: 'Report the coverage for CI',
                type: 'boolean',
                default: config.REPORT_COVERAGE,
            })
            .option('watch', {
                description: 'Run tests in an interactive watch mode, this will test only the changed files',
                type: 'boolean',
                default: false,
            })
            .option('suite', {
                alias: 's',
                description: 'Run a test given a particular suite. Defaults to running all',
                choices: Object.values(TestSuite).filter((suite) => suite !== TestSuite.Disabled),
                coerce(arg): TestSuite {
                    return arg;
                },
            })
            .option('use-existing-services', {
                description: 'If true no services will be launched',
                type: 'boolean',
                default: config.USE_EXISTING_SERVICES,
            })
            .option('elasticsearch-host', {
                description: 'The elasticsearch URL to use when needed (usually for --suite elasticsearch or e2e)',
                type: 'string',
                default: config.ELASTICSEARCH_HOST,
            })
            .option('elasticsearch-version', {
                description: 'The elasticsearch version to use',
                type: 'string',
                default: config.ELASTICSEARCH_VERSION,
            })
            .option('elasticsearch-api-version', {
                description: 'The elasticsearch client API version to use',
                type: 'string',
                default: config.ELASTICSEARCH_API_VERSION,
            })
            .option('kafka-broker', {
                description: 'The kafka brokers to use when needed (usually for --suite kafka or e2e)',
                type: 'string',
                default: config.KAFKA_BROKER,
            })
            .option('kafka-version', {
                description: 'The kafka version to use',
                type: 'string',
                default: config.KAFKA_VERSION,
            })
            .positional('packages', {
                description: 'Runs the test for one or more package, if none specified it will run all of the tests',
                coerce(arg) {
                    let args = castArray(arg);
                    args = args.filter((a) => {
                        if (!jestArgs.includes(a)) return true;
                        return false;
                    });
                    return coercePkgArg(args);
                },
            });
    },
    handler(argv) {
        const debug = hoistJestArg(argv, 'debug');
        const watch = hoistJestArg(argv, 'watch');
        const bail = hoistJestArg(argv, 'bail');

        return runTests(getPkgInfos(argv.packages), {
            debug,
            watch,
            bail,
            suite: argv.suite,
            useExistingServices: argv['use-existing-services'],
            elasticsearchHost: argv['elasticsearch-host'],
            elasticsearchVersion: argv['elasticsearch-version'],
            elasticsearchAPIVersion: argv['elasticsearch-api-version'],
            kafkaBroker: argv['kafka-broker'],
            kafkaVersion: argv['kafka-version'],
            all: !argv.packages || !argv.packages.length,
            reportCoverage: argv['report-coverage'],
            jestArgs,
        });
    },
};

// this only works with booleans for now
function hoistJestArg(argv: any, key: string): boolean {
    let val = argv[key];

    const index = jestArgs.indexOf(`--${key}`);
    if (index > -1) {
        const nextVal = jestArgs[index + 1];
        jestArgs.splice(index, 1);
        if (nextVal && ['true', true, 'false', false].includes(nextVal)) {
            val = toBoolean(nextVal);
        } else {
            val = true;
        }
    }

    return toBoolean(val);
}

function getExtraArgs(): string[] {
    const args: string[] = [];
    let extra = false;
    process.argv.forEach((arg) => {
        if (extra) {
            args.push(...resolveJestArg(arg));
        }
        if (arg === '--') extra = true;
    });
    return args;
}

function resolveJestArg(arg: string): string[] {
    if (fs.existsSync(arg)) {
        return ['--testPathPattern', arg];
    }
    return [arg];
}

function getPkgInfos(packages?: PackageInfo[]): PackageInfo[] {
    if (packages && packages.length > 0) return packages;
    return listPackages();
}

export = cmd;