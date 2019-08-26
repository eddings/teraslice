
import { CMD } from '../../interfaces';
import replyModule from '../lib/reply';
import Config from '../../lib/config';
import YargsOptions from '../../lib/yargs-options';

const reply = new replyModule();
const yargsOptions = new YargsOptions();

export default {
    command: 'update <cluster-alias> <new-cluster-url>',
    describe: 'Update an alias to the clusters defined in the config file.\n',
    exclude: 'lib',
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('new-cluster-url', yargsOptions.buildPositional('new-cluster-url'));
        yargs.coerce('new-cluster-url', yargsOptions.buildCoerce('new-cluster-url'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('list', yargsOptions.buildOption('list'));
        // @ts-ignore
        yargs
            .example('$0 aliases update cluster1 http://cluster1.net:80');
        return yargs;
    },
    handler(argv) {
        const cliConfig = new Config(argv);

        try {
            cliConfig.aliases.update(
                cliConfig.args.clusterAlias,
                cliConfig.args.newClusterUrl
            );
            if (cliConfig.args.list) {
                cliConfig.aliases.list(cliConfig.args.output);
            }
            reply.green(`> Updated alias ${cliConfig.args.clusterAlias} host: ${cliConfig.args.newClusterUrl}`);
        } catch (e) {
            reply.error(`error updating alias ${e}`);
        }
    }
} as CMD;
