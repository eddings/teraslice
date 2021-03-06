import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { FlusherConfig } from './interfaces';

export default class Flusher extends BatchProcessor<FlusherConfig> {
    _flushing = false;
    _state: DataEntity[] = [];

    onFlushStart() {
        this._flushing = true;
    }

    onFlushEnd() {
        this._flushing = false;
    }

    async onBatch(data: DataEntity[]) {
        if (this._flushing) return this._state;
        this._state = data;
        return [];
    }
}
