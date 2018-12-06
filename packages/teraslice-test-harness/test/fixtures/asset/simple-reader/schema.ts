import { ConvictSchema } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces';

export default class Schema extends ConvictSchema<SimpleReaderConfig> {
    build() {
        return {
            slicesToCreate: {
                default: 10,
                doc: 'Number of slice records to create',
                format: 'Number'
            },
            recordsToFetch: {
                default: 10,
                doc: 'Number of records to fetch',
                format: 'Number'
            }
        };
    }
}
