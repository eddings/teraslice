
import { CMD } from '../../interfaces';
import Config from '../../lib/config';
import TerasliceUtil from  '../../lib/teraslice-util';
import YargsOptions from '../../lib/yargs-options';
import Reply from '../lib/reply';
import displayModule from '../lib/display';

const reply = new Reply();
const display = displayModule();

const yargsOptions = new YargsOptions();

export default {
    command: 'stats <cluster-alias> [id]',
    describe: 'Show stats of the controller(s) on a cluster.\n',
    builder (yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        // @ts-ignore
        yargs.strict()
            .example('$0 controllers stats cluster1');
        return yargs;
    },
    async handler(argv) {
        let response;
        const parse = false;
        const active = false;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);
        // @ts-ignore
        const format = `${cliConfig.args.output}Vertical`;
        const header = 'job_id';

        // older versions of teraslice do not have contollers end point
        try {
            response = await teraslice.client.cluster.controllers();
        } catch (e) {
            response = await teraslice.client.cluster.slicers();
        }

        if (Object.keys(response).length === 0) {
            // @ts-ignore
            reply.fatal(`> No controllers on ${cliConfig.args.clusterAlias}`);
        }
// @ts-ignore
        await display.display(header, response, format, parse, active);
    }
} as CMD;
