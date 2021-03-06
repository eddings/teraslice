import { Logger, debugLogger } from '@terascope/utils';
import { PhaseManager } from './phases';
import { WatcherConfig } from './interfaces';

export default class Transform extends PhaseManager {
    constructor(opConfig: WatcherConfig, logger: Logger = debugLogger('ts-transforms')) {
        const config = Object.assign(opConfig, { type: 'transform' });
        // @ts-ignore this is for backwards compatability
        if (config.types) config.type_config = config.types;
        super(config, logger);
    }
}
