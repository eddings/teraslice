import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { DataEntity, debugLogger, parseList, AnyObject } from '@terascope/utils';
import _ from 'lodash';
import { PhaseManager } from './index';
import { PhaseConfig } from './interfaces';

const logger = debugLogger('ts-transform-cli');
// change pathing due to /dist/src issues
const packagePath = path.join(__dirname, '../../package.json');
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// TODO Use yargs api to validate field types and usage
const command = yargs
    .alias('t', 'types-fields')
    .alias('T', 'types-file')
    .alias('r', 'rules')
    .alias('i', 'ignore')
    .alias('d', 'data')
    .alias('perf', 'performance')
    .alias('m', 'match')
    .alias('p', 'plugins')
    .help('h')
    .alias('h', 'help')
    .describe('r', 'path to load the rules file')
    .describe('d', 'path to load the data file')
    .describe('i', 'ignore data records that cannot be parsed')
    .describe('t', 'specify type configs ie field:value, otherfield:value')
    .describe('T', 'specify type configs from file')
    .describe('p', 'path to plugins that should be added into ts-transforms')
    .demandOption(['r'])
    .version(version).argv;

const filePath = command.rules as string;
const dataPath = command.data;

const ignoreErrors = command.i || false;
let typesConfig = {};
const type = command.m ? 'matcher' : 'transform';

interface ESData {
    _source: object;
}

try {
    if (command.t) {
        const segments = parseList(command.t as string);
        segments.forEach((segment: string) => {
            const pieces = segment.split(':');
            typesConfig[pieces[0].trim()] = pieces[1].trim();
        });
    }
    if (command.T) {
        typesConfig = require(command.T as string);
    }
} catch (err) {
    console.error('could not load and parse types', err);
    process.exit(1);
}

if (!filePath) {
    console.error('a rule file and data file must be given');
    process.exit(1);
}

async function dataFileLoader(dataFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(dataFilePath), { encoding: 'utf8' }, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

function getPipedData(): Promise<string> {
    return new Promise((resolve, reject) => {
        let strResults = '';
        if (process.stdin.isTTY) {
            // FIXME don't reject with a string
            // eslint-disable-next-line prefer-promise-reject-errors
            reject('please pipe an elasticsearch response or provide the data parameter -d with path to data file');
            return;
        }
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (data: string) => {
            strResults += data;
        });

        process.stdin.on('end', () => {
            resolve(strResults);
        });
    });
}

function parseData(data: string): object[] | null {
    // handle json array input
    if (/^\s*\[.*\]$/.test(data)) {
        try {
            return JSON.parse(data);
        } catch (err) {
            logger.error(`Failed to parse "${data}"`);
            return null;
        }
    }

    // handle ldjson
    const results: object[] = [];
    const lines = _.split(data, '\n');
    for (let i = 0; i < lines.length; i++) {
        const line = _.trim(lines[i]);
        // if its not an empty space or a comment then parse it
        if (line.length > 0 && line[0] !== '#') {
            try {
                results.push(JSON.parse(line));
            } catch (err) {
                const errorMsg = `Failed to parse line ${i + 1} -- "${line}"`;
                if (ignoreErrors === true) {
                    console.error(errorMsg);
                } else {
                    throw new Error(errorMsg);
                }
            }
        }
    }

    return results;
}

function toJSON(obj: AnyObject) {
    return JSON.stringify(obj);
}

function handleParsedData(data: object[] | object): DataEntity<object>[] {
    // input from elasticsearch
    const elasticSearchResults = _.get(data[0], 'hits.hits', null);
    if (elasticSearchResults) {
        return elasticSearchResults.map((doc: ESData) => DataEntity.make(doc._source));
    }
    // input from teraserver
    const teraserverResults = _.get(data[0], 'results', null);
    if (teraserverResults) {
        return DataEntity.makeArray(teraserverResults);
    }

    if (Array.isArray(data)) return DataEntity.makeArray(data);

    throw new Error('no data was received to parse');
}

async function getData(dataFilePath?: string) {
    const rawData = dataFilePath ? await dataFileLoader(dataFilePath) : await getPipedData();
    const parsedData = parseData(rawData);
    if (!parsedData) {
        throw new Error('could not get data, please provide a data file or pipe an elasticsearch request');
    }

    return handleParsedData(parsedData);
}

async function initCommand() {
    try {
        const opConfig: PhaseConfig = {
            rules: parseList(filePath).map((pathing) => path.resolve(pathing)),
            types: typesConfig,
            type,
        };
        let plugins = [];
        if (command.p) {
            try {
                const pluginList = parseList(command.p as string);
                plugins = pluginList.map((pluginPath) => {
                    const mod = require(path.resolve(pluginPath));
                    return mod.default || mod;
                });
            } catch (err) {
                // @ts-ignore
                console.error('could not load plugins');
                process.exit(1);
            }
        }
        const manager = new PhaseManager(opConfig, logger);

        await manager.init(plugins);

        const data = await getData(dataPath as string);

        if (command.perf) {
            process.stderr.write('\n');
            console.time('execution-time');
        }

        const results = manager.run(data);
        if (command.perf) console.timeEnd('execution-time');
        const output = results.map(toJSON).join('\n');
        process.stdout.write(output);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

initCommand();
