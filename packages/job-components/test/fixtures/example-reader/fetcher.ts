import { times, DataEntity, DataWindow } from '@terascope/utils';
import { Fetcher } from '../../../src';

export default class ExampleFetcher extends Fetcher {
    _initialized = false;
    _shutdown = false;

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch() {
        if (!this.opConfig.windows) {
            return makeWindow(0);
        }
        return times(this.opConfig.windows, makeWindow);
    }
}

function makeWindow(n: number) {
    const window = new DataWindow();
    for (let i = 0; i < 10; i++) {
        window.push(DataEntity.make({
            id: i,
            data: [
                Math.random(),
                Math.random(),
                Math.random()
            ],
        }));
    }
    window.setKey(`window-${n}`);
    return window;
}
