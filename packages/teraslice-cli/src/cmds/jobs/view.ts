
import { CMD } from '../../interfaces';
import _ from 'lodash';
import Config from '../../lib/config';
import YargsOptions from '../../lib/yargs-options';
import Reply from '../lib/reply';
import TerasliceUtil from '../../lib/teraslice-util';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export default {
    // TODO: is it [id] or <id>
    command: 'view <cluster-alias> <id>',
    describe: 'View the job definition',
    builder(yargs:any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 jobs view cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
        let response;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        try {
            response = await teraslice.client.jobs.wrap(cliConfig.args.id).config();
        } catch (err) {
            reply.fatal(`> job_id:${cliConfig.args.id} not found on ${cliConfig.args.clusterAlias}`);
        }

        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(response, null, 4));
    }
} as CMD;
