import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import {
    DataEntity, debugLogger, parseList, AnyObject, get, TSError
} from '@terascope/utils';
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
    .alias('f', 'format')
    .help('h')
    .alias('h', 'help')
    .describe('r', 'path to load the rules file')
    .describe('d', 'path to load the data file')
    .describe('i', 'ignore data records that cannot be parsed')
    .describe('t', 'specify type configs ie field:value, otherfield:value')
    .describe('T', 'specify type configs from file')
    .describe('p', 'path to plugins that should be added into ts-transforms')
    .describe('format', 'set this to type of incoming data, if set to ldjson then it will stream the input and output records')
    .demandOption(['r'])
    .choices('f', ['ldjson', 'json', 'teraserver', 'es'])
    .version(version).argv;

const filePath = command.rules as string;
const dataPath = command.data as string;
const streamData = command.f && command.f === 'ldjson' ? command.f : false;
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
            reject(new TSError('please pipe an elasticsearch response or provide the data parameter -d with path to data file'));
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
    if (/^\s*\[.*\]$/gm.test(data)) {
        try {
            return JSON.parse(data);
        } catch (err) {
            logger.error(`Failed to parse "${data}"`);
            return null;
        }
    }

    // handle ldjson
    const results: object[] = [];
    const lines = data.split('\n');

    for (const rawline of lines) {
        const parsedData = parseLine(rawline);
        if (parsedData != null) results.push(parsedData);
    }

    return results;
}

function toJSON(obj: AnyObject) {
    return JSON.stringify(obj);
}

function handleParsedData(data: object[] | object): DataEntity<object>[] {
    // input from elasticsearch
    const elasticSearchResults = get(data[0], 'hits.hits', null);
    if (elasticSearchResults) {
        return elasticSearchResults.map((doc: ESData) => DataEntity.make(doc._source));
    }
    // input from teraserver
    const teraserverResults = get(data[0], 'results', null);
    if (teraserverResults) {
        return DataEntity.makeArray(teraserverResults);
    }

    if (Array.isArray(data)) return DataEntity.makeArray(data);

    throw new TSError('no data was received to parse');
}

async function getData(dataFilePath?: string) {
    const rawData = dataFilePath ? await dataFileLoader(dataFilePath) : await getPipedData();
    const parsedData = parseData(rawData);
    if (!parsedData) {
        throw new TSError('could not get data, please provide a data file or pipe an elasticsearch request');
    }

    return handleParsedData(parsedData);
}

function parseLine(str: string) {
    const line = str.trim();
    // if its not an empty space or a comment then parse it
    if (line.length > 0 && line[0] !== '#') {
        try {
            return DataEntity.make(JSON.parse(line));
        } catch (err) {
            const errorMsg = `Failed to parse data "${line}"`;
            if (ignoreErrors === true) {
                console.error(errorMsg);
            } else {
                throw new TSError(errorMsg);
            }
        }
    }
}

function outputData(results: AnyObject[]) {
    const output = `${results.map(toJSON).join('\n')}\n`;
    process.stdout.write(output);
}

async function transformIO(manager: PhaseManager) {
    return new Promise((resolve, reject) => {
        try {
            const input = dataPath ? fs.createReadStream(dataPath) : process.stdin;

            const rl = readline.createInterface({
                input,
            });

            if (command.perf) {
                process.stderr.write('\n');
                console.time('execution-time');
            }

            rl.on('line', (str: string) => {
                const obj = parseLine(str);
                if (obj != null) {
                    try {
                        const results = manager.run([obj]);
                        if (results.length > 0) outputData(results);
                    } catch (err) {
                        reject(err);
                    }
                }
            });

            rl.on('close', () => {
                if (command.perf) console.timeEnd('execution-time');
                return resolve(true);
            });
        } catch (err) {
            reject(err);
        }
    });
}

async function initCommand() {
    try {
        const opConfig: PhaseConfig = {
            rules: parseList(filePath).map((pathing) => path.resolve(pathing)),
            type_config: typesConfig,
            type,
        };
        let plugins = [];
        if (command.p) {
            const pluginList = parseList(command.p as string);
            plugins = pluginList.map((pluginPath) => {
                const mod = require(path.resolve(pluginPath));
                return mod.default || mod;
            });
        }
        let manager: PhaseManager;

        try {
            manager = new PhaseManager(opConfig, logger);
            await manager.init(plugins);
        } catch (err) {
            console.error(`could not initiate transforms: ${err.message}`);
            process.exitCode = 1;
        }
        // @ts-ignore
        if (manager === undefined) return;

        if (streamData) {
            await transformIO(manager);
        } else {
            // regular processing
            const data = await getData(dataPath as string);

            if (command.perf) {
                process.stderr.write('\n');
                console.time('execution-time');
            }

            const results = manager.run(data);
            if (command.perf) console.timeEnd('execution-time');
            outputData(results);
        }
    } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
    }
}

initCommand();
