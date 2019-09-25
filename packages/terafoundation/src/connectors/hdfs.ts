import { Logger } from '@terascope/utils';

function create(customConfig: any, logger: Logger) {
    const HdfsClient = require('node-webhdfs').WebHDFSClient;
    logger.info(`Using hdfs hosts: ${customConfig.host}`);

    // TODO: there's no error handling here at all???
    const client = new HdfsClient(customConfig);

    return {
        client
    };
}

export default {
    create,
    config_schema() {
        return {
            user: {
                doc: '',
                default: 'webuser'
            },
            namenode_port: {
                doc: '',
                default: 50070
            },
            namenode_host: {
                doc: '',
                default: 'localhost'
            },
            path_prefix: {
                doc: '',
                default: '/webhdfs/v1'
            }
        };
    }
};
