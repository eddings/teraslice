import { Logger, debugLogger } from '@terascope/utils';
import { PhaseManager } from './phases';
import { WatcherConfig } from './interfaces';

export default class Matcher extends PhaseManager {
    constructor(opConfig: WatcherConfig, logger: Logger = debugLogger('ts-transforms')) {
        const config = Object.assign(opConfig, { type: 'matcher' });
        super(config, logger);
    }
}
