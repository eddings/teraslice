'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'init <job-name>';
exports.desc = 'Initialize a new job file with an example job definition';
exports.builder = (yargs) => {
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm start new-job.json');
    yargs.example('$0 tjm run new-job.json');
};

exports.handler = (argv) => {
    const job = new JobSrc(argv);
    job.content = {
        name: 'data-generator',
        lifecycle: 'persistent',
        workers: 3,
        operations: [
            {
                _op: 'elasticsearch_data_generator',
                size: 5000
            },
            {
                _op: 'elasticsearch_index_selector',
                index: 'example-logs',
                type: 'events'
            },
            {
                _op: 'elasticsearch_bulk',
                size: 5000,
                connection: 'default'
            }]
    };
    job.validateJob();
    job.overwrite();
    reply.green(`Created ${argv.jobName} file at ${job.jobPath}`);
};
