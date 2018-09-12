import _ from 'lodash';
import Queue from '@terascope/queue';
import { Slice } from '@terascope/teraslice-types';
import * as core from '../messenger';
import * as i from './interfaces';

export class Server extends core.Server {
    private _activeWorkers: string[];
    private _pendingSlices: string[];
    queue: Queue;

    constructor(opts: i.ServerOptions) {
        const {
            port,
            actionTimeout,
            pingInterval,
            pingTimeout,
            networkLatencyBuffer,
            workerDisconnectTimeout,
        } = opts;

        if (!_.isNumber(workerDisconnectTimeout)) {
            throw new Error('ExecutionController.Server requires a valid workerDisconnectTimeout');
        }

        super({
            port,
            actionTimeout,
            pingInterval,
            pingTimeout,
            networkLatencyBuffer,
            clientDisconnectTimeout: workerDisconnectTimeout,
            serverName: 'ExecutionController',
        });

        this.queue = new Queue();
        this._activeWorkers = [];
        this._pendingSlices = [];
    }

    async start() {
        this.on('connection', (clientId: string, socket: SocketIO.Socket) => {
            this.onConnection(clientId, socket);
        });

        this.onClientUnavailable((workerId) => {
            this._workerRemove(workerId);
        });

        this.onClientDisconnect((workerId) => {
            this._workerRemove(workerId);
        });

        this.onClientAvailable((workerId) => {
            this._workerEnqueue(workerId);
        });

        await this.listen();
    }

    async shutdown() {
        this.queue.each((worker: i.Worker) => {
            this.queue.remove(worker.workerId, 'workerId');
        });

        this._activeWorkers = [];
        this._pendingSlices = [];

        await super.shutdown();
    }

    dequeueWorker(slice: Slice): string|null {
        const requestedWorkerId = slice.request.request_worker;
        return this._workerDequeue(requestedWorkerId);
    }

    async dispatchSlice(slice: Slice, workerId: string): Promise<boolean> {
        const response = await this.send(workerId, 'execution:slice:new', slice);

        const dispatched = _.get(response, 'payload.willProcess', false);

        if (dispatched) {
            this._activeWorkers = _.union(this._activeWorkers, [workerId]);
            this._pendingSlices = _.union(this._pendingSlices, [slice.slice_id]);
        }

        return dispatched;
    }

    onSliceSuccess(fn: core.ClientEventFn) {
        this.on('slice:success', fn);
    }

    onSliceFailure(fn: core.ClientEventFn) {
        this.on('slice:failure', fn);
    }

    sendExecutionFinishedToAll(exId: string) {
        return this.sendToAll('execution:finished', { exId }, {
            response: false,
            volatile: false,
        });
    }

    get activeWorkers(): string[] {
        return this._activeWorkers.slice();
    }

    get pendingSlices(): string[] {
        return this._pendingSlices.slice();
    }

    get workerQueueSize(): number {
        return this.queue.size();
    }

    private onConnection(workerId: string, socket: SocketIO.Socket) {
        socket.on('worker:slice:complete', this.handleResponse('worker:slice:complete', (msg) => {
            const workerResponse = msg.payload;
            const sliceId = _.get(workerResponse, 'slice.slice_id');
            const alreadyCompleted = this.cache.get(`${sliceId}:complete`);

            if (!alreadyCompleted) {
                this.cache.set(`${sliceId}:complete`, true);

                if (workerResponse.error) {
                    this.emit('slice:failure', workerId, workerResponse);
                } else {
                    this.emit('slice:success', workerId, workerResponse);
                }
            }

            _.pull(this._activeWorkers, workerId);
            _.pull(this._pendingSlices, sliceId);

            return _.pickBy({
                duplicate: alreadyCompleted,
                recorded: true,
                slice_id: sliceId,
            });
        }));
    }

    private _workerEnqueue(workerId: string): boolean {
        if (!workerId) {
            throw new Error('Failed to enqueue invalid worker');
        }

        const exists = this.queue.exists('workerId', workerId);
        if (!exists) {
            this.queue.enqueue({ workerId });
        }

        this.emit('worker:enqueue', workerId);
        return exists;
    }

    private _workerDequeue(requestedWorkerId?: string): string | null {
        let workerId: string|null;

        if (requestedWorkerId) {
            const worker = this.queue.extract('workerId', requestedWorkerId);
            workerId = worker ? worker.workerId : null;
        } else {
            const worker = this.queue.dequeue();
            workerId = worker ? worker.workerId : null;
        }

        if (workerId != null) {
            _.pull(this._activeWorkers, workerId);
            this.emit('worker:dequeue', workerId);
        }

        return workerId;
    }

    private _workerRemove(workerId: string): boolean {
        if (!workerId) return false;

        this.queue.remove(workerId, 'workerId');

        _.pull(this._activeWorkers, workerId);
        this.emit('worker:dequeue', workerId);
        return true;
    }
}
