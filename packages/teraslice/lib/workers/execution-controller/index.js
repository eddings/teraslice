'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const castArray = require('lodash/castArray');
const uuidv4 = require('uuid/v4');
const retry = require('bluebird-retry');
const Queue = require('@terascope/queue');
const parseError = require('@terascope/error-parser');
const Messaging = require('@terascope/teraslice-messaging');

const makeExecutionRecovery = require('./recovery');
const makeSliceAnalytics = require('./slice-analytics');
const ExecutionAnalytics = require('./analytics');
const { newFormattedDate } = require('../../utils/date_utils');
const { makeStateStore, makeExStore } = require('../../cluster/storage');
const { makeLogger, generateWorkerId } = require('../helpers/terafoundation');
const { waitForWorkerShutdown } = require('../helpers/worker-shutdown');

const ExecutionControllerServer = Messaging.ExecutionController.Server;
const ClusterMasterClient = Messaging.ClusterMaster.Client;
const { formatURL } = Messaging;

class ExecutionController {
    constructor(context, executionContext) {
        const workerId = generateWorkerId(context);
        const logger = makeLogger(context, executionContext, 'execution_controller');
        const events = context.apis.foundation.getSystemEvents();
        const slicerPort = executionContext.slicer_port;
        const networkLatencyBuffer = _.get(context, 'sysconfig.teraslice.network_latency_buffer');
        const actionTimeout = _.get(context, 'sysconfig.teraslice.action_timeout');
        const workerDisconnectTimeout = _.get(context, 'sysconfig.teraslice.worker_disconnect_timeout');
        const nodeDisconnectTimeout = _.get(context, 'sysconfig.teraslice.node_disconnect_timeout');
        const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout');
        const recoverExecution = _.get(executionContext.config, 'recovered_execution', false);

        this.server = new ExecutionControllerServer({
            port: slicerPort,
            networkLatencyBuffer,
            actionTimeout,
            workerDisconnectTimeout,
        });

        const clusterMasterPort = _.get(context, 'sysconfig.teraslice.port');
        const clusterMasterHostname = _.get(context, 'sysconfig.teraslice.master_hostname');

        this.client = new ClusterMasterClient({
            clusterMasterUrl: formatURL(clusterMasterHostname, clusterMasterPort),
            executionContext,
            networkLatencyBuffer,
            actionTimeout,
            connectTimeout: nodeDisconnectTimeout,
            exId: executionContext.ex_id,
        });

        this.executionAnalytics = new ExecutionAnalytics(
            context,
            executionContext,
            this.client
        );

        this.slicerQueue = new Queue();

        this.exId = _.get(executionContext, 'config.ex_id');
        this.workerId = workerId;
        this.logger = logger;
        this.events = events;
        this.context = context;
        this.executionContext = executionContext;
        this.collectAnalytics = this.executionContext.config.analytics;
        this.shutdownTimeout = shutdownTimeout;
        this.workerDisconnectTimeout = workerDisconnectTimeout;
        this.recoverExecution = recoverExecution;
        this.recoveryComplete = !recoverExecution;
        this.stores = {};

        this.slicersReady = false;
        this.slicesEnqueued = 0;
        this.slicers = [];
        this.slicersDoneCount = 0;
        this.totalSlicers = 0;
        this.pendingSlices = 0;
        this.isPaused = false;
        this.isShutdown = false;
        this.isShuttingDown = false;
        this.isInitialized = false;
        this.isStarted = false;
        this.isDoneProcessing = false;
        this.isExecutionFinished = false;
        this.isExecutionDone = false;
        this.workersHaveConnected = false;

        this.setFailingStatus = this.setFailingStatus.bind(this);
        this.terminalError = this.terminalError.bind(this);
    }

    async initialize() {
        const { context } = this;

        const exStore = makeExStore(context);
        this.stores.exStore = await exStore;

        await this.client.start();

        let verified;
        let verifiedErr;
        try {
            verified = await this._verifyExecution();
        } catch (err) {
            verifiedErr = err;
        }
        if (!verified) {
            this.isShutdown = true;
            await this.stores.exStore.shutdown(true);
            await this.client.shutdown();
            if (verifiedErr) {
                throw verifiedErr;
            }
            return;
        }

        const stateStore = makeStateStore(context);
        this.stores.stateStore = await stateStore;

        await this.server.start();

        this.isInitialized = true;

        this.server.onClientOnline((workerId) => {
            this.logger.trace(`worker ${workerId} is online`);
            this._adjustSlicerQueueLength();
            this.workersHaveConnected = true;
            clearTimeout(this.workerConnectTimeoutId);
        });

        this.server.onClientAvailable((workerId) => {
            this.logger.trace(`worker ${workerId} is available`);
            this.executionAnalytics.increment('workers_joined');
        });

        this.server.onClientDisconnect((workerId) => {
            this.logger.trace(`worker ${workerId} is disconnected but it may reconnect`);
            this.executionAnalytics.increment('workers_disconnected');
            this._startWorkerDisconnectWatchDog();
        });

        this.server.onClientOffline((workerId) => {
            this.logger.trace(`worker ${workerId} is offline`);
            this._adjustSlicerQueueLength();
        });

        this.server.onClientReconnect((workerId) => {
            clearTimeout(this.workerDisconnectTimeoutId);
            this.logger.trace(`worker ${workerId} is reconnected`);

            this.executionAnalytics.increment('workers_reconnected');
        });

        this.client.onExecutionPause(() => this.pause());
        this.client.onExecutionResume(() => this.resume());

        this.server.onSliceSuccess((workerId, response) => {
            this.executionAnalytics.increment('processed');

            if (this.collectAnalytics) {
                this.slicerAnalytics.addStats(response.analytics);
            }

            this.logger.info(`worker ${workerId} has completed its slice`, response);
            this.events.emit('slice:success', response);
            this.pendingSlices -= 1;
        });

        this.server.onSliceFailure((workerId, response) => {
            this.executionAnalytics.increment('processed');
            this.executionAnalytics.increment('failed');

            this.logger.error(`worker: ${workerId} has failure completing its slice`, response);
            this.events.emit('slice:failure', response);
            this.pendingSlices -= 1;
        });

        this.events.on('slicer:execution:update', ({ update }) => {
            this.logger.trace('slicer sending a execution update', update);

            // this is updating the opConfig for elasticsearch start and/or end dates for ex,
            // this assumes elasticsearch is first
            this.stores.exStore.update(this.exId, { operations: update });
        });

        this.logger.debug(`execution ${this.exId} is initialized`);

        this.isInitialized = true;
    }

    async run() {
        if (this.isShuttingDown) {
            this.logger.error('Cannot run execution while shutting down');
            return;
        }

        if (!this.isInitialized) {
            this.logger.error('Cannot run execution is not initialized');
            return;
        }

        try {
            await this._runExecution();
        } catch (err) {
            this.logger.error('Run execution error', err);
        }

        this.events.emit('worker:shutdown');

        // help the workers go offline
        this.server.isShuttingDown = true;

        await this._finishExecution();

        try {
            await Promise.all([
                this.client.sendExecutionFinished(),
                this._waitForWorkersToExit(),
            ]);
        } catch (err) {
            this.logger.error('Failure sending execution finished', err);
        }

        this.logger.debug(`execution ${this.exId} is done`);
    }

    async resume() {
        if (!this.isPaused) return;

        this.logger.info(`execution ${this.exId} is resuming...`);
        this.isPaused = false;

        await Promise.delay(100);
    }

    async pause() {
        if (this.isPaused) return;

        this.logger.info(`execution ${this.exId} is pausing...`);
        this.isPaused = true;
        await Promise.delay(100);
    }

    async allocateSlice(request, slicerId, startingOrder) {
        let slicerOrder = startingOrder;
        const { logger, slicerQueue, exId } = this;
        const { stateStore } = this.stores;

        await Promise.map(castArray(request), async (sliceRequest) => {
            slicerOrder += 1;
            let slice = sliceRequest;

            // recovery slices already have correct meta data
            if (!slice.slice_id) {
                slice = {
                    slice_id: uuidv4(),
                    request: sliceRequest,
                    slicer_id: slicerId,
                    slicer_order: slicerOrder,
                    _created: new Date().toISOString()
                };

                await stateStore.createState(exId, slice, 'start');
                logger.trace('enqueuing slice', slice);
            }

            this.slicesEnqueued += 1;
            slicerQueue.enqueue(slice);
        });

        return slicerOrder;
    }

    async setFailingStatus() {
        const { exStore } = this.stores;

        const errMsg = `slicer: ${this.exId} has encountered a processing_error`;
        this.logger.error(errMsg);

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, errMsg);
        await exStore.setStatus(this.exId, 'failing', errorMeta);
    }

    async terminalError(err) {
        if (this.isExecutionDone) return;

        const { exStore } = this.stores;

        this.slicerFailed = true;

        const msg = `slicer for ex ${this.exId} had an error, shutting down execution`;
        this.logger.error(msg, err);

        const errMsg = `${msg}, caused by ${err.stack ? err.stack : _.toString(err)}`;

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, errMsg);

        await exStore.setStatus(this.exId, 'failed', errorMeta);

        this.isExecutionDone = true;
        this.logger.fatal(`execution ${this.exId} is done because of slice failure`);
    }

    async shutdown(block = true) {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;

        if (this.isShuttingDown && block) {
            this.logger.debug(`execution shutdown was called for ex ${this.exId} but it was already shutting down, will block until done`);
            await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            return;
        }

        this.logger.debug(`execution shutdown was called for ex ${this.exId}`);
        this.server.isShuttingDown = true;

        this.isShuttingDown = true;
        this.isPaused = false;

        const shutdownErrs = [];

        clearInterval(this.watcher);
        clearTimeout(this.workerConnectTimeoutId);
        clearTimeout(this.workerDisconnectTimeoutId);

        await this._waitForExecutionFinished();

        if (this.recover) {
            try {
                await this.recover.shutdown();
            } catch (err) {
                shutdownErrs.push(err);
            }
        }

        try {
            await this.executionAnalytics.shutdown();
        } catch (err) {
            this.logger.error('execution analytics error');
        }

        try {
            await this.server.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this.client.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await Promise.map(Object.values(this.stores), store => store.shutdown(true));
        } catch (err) {
            shutdownErrs.push(err);
        }

        this.logger.warn(`execution controller ${this.exId} is shutdown`);
        this.isShutdown = true;

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map(e => e.stack).join(', and');
            const shutdownErr = new Error(`Failed to shutdown correctly: ${errMsg}`);
            this.events.emit(this.context, 'worker:shutdown:complete', shutdownErr);
            throw shutdownErr;
        }

        this.events.emit(this.context, 'worker:shutdown:complete');
    }

    // this is used to determine when the slices are done
    get isOnce() {
        const { lifecycle } = this.executionContext.config;
        return (lifecycle === 'once') && this.recoveryComplete;
    }

    async _adjustSlicerQueueLength() {
        const { dynamicQueueLength, queueLength } = this.executionContext;
        if (!dynamicQueueLength) return;

        if (this.server.onlineClientCount > queueLength) {
            this.executionContext.queueLength = this.server.onlineClientCount;
            this.logger.info(`adjusted queue length ${this.executionContext.queueLength}`);
        }
    }

    async _runExecution() {
        this._startWorkConnectWatchDog();

        this.slicerAnalytics = makeSliceAnalytics(this.context, this.executionContext);

        this.logger.info(`starting execution ${this.exId}...`);
        this.startTime = Date.now();

        this.executionAnalytics.start();

        if (this.recoverExecution) {
            await this._recoverSlicesInit();

            this.isStarted = true;

            await Promise.all([
                this._waitForRecovery(),
                this._process(),
            ]);
        } else {
            await this._slicerInit();

            this.isStarted = true;

            await this._process();
        }
    }

    async _process() {
        const statsInterval = setInterval(() => {
            if (this.isShuttingDown) {
                clearInterval(statsInterval);
                return;
            }
            this.executionAnalytics.set('workers_available', this.server.availableClientCount);
            this.executionAnalytics.set('workers_active', this.server.activeWorkers.length);
            this.executionAnalytics.set('queued', this.slicerQueue.size());
        }, 500);

        await Promise.all([
            this.stores.exStore.setStatus(this.exId, 'running'),
            this.client.sendAvailable(),
        ]);

        try {
            await this._processLoop();
        } catch (err) {
            this.logger.error('Error processing slices', err);
        }

        clearInterval(statsInterval);

        if (this.isDoneProcessing) {
            this.logger.debug(`execution ${this.exId} is done processing slices`);
        }
    }

    async _processLoop() {
        if (this.isExecutionDone || this.isShuttingDown) {
            return null;
        }

        await Promise.delay(0);

        if (this.isPaused) {
            this.logger.debug('execution is paused, wait for resume...');
            const found = await this.client.onceWithTimeout('execution:resume', 1000);
            if (found == null) {
                return this._processLoop();
            }
        }

        let scheduling = false;
        const schedule = async () => {
            if (scheduling) return;
            if (!this.slicersReady || this.slicersDone) return;

            scheduling = true;
            await this._scheduleSlices();
            scheduling = false;
        };

        let dispatching = false;
        const dispatch = async () => {
            if (dispatching) return;
            if (!this.slicerQueue.size()) return;

            dispatching = true;
            await this._dispatchSlices();
            dispatching = false;
        };

        await Promise.race([
            schedule(),
            dispatch()
        ]);

        if (!dispatching && !scheduling && this.slicersDone && !this.slicerQueue.size()) {
            await this._waitForPendingSlices();
            this.isDoneProcessing = true;
            return true;
        }

        return this._processLoop();
    }

    async _scheduleSlices() {
        // If all slicers are not done, the slicer queue is not overflown and the scheduler
        // is set, then attempt to provision more slices
        const needsMoreSlices = this.slicerQueue.size() < this.executionContext.queueLength;
        if (!needsMoreSlices) return Promise.delay(0);

        try {
            await Promise.map(this.scheduler, slicerFn => slicerFn());
        } catch (err) {
            this.logger.error('Failure scheduling slice', err);
        }
        return null;
    }

    async _dispatchSlices() {
        // dispatch only up to 10 at time but if there are less work available
        const count = _.min([this.server.workerQueueSize, this.slicerQueue.size(), 10]);
        const reenqueueSlices = [];

        await Promise.all(_.times(count, async () => {
            if (!this.slicerQueue.size()) return;
            if (!this.server.workerQueueSize) return;

            const slice = this.slicerQueue.dequeue();
            if (!slice) return; // this probably won't happen but lets make sure

            this.pendingSlices += 1;

            const workerId = this.server.dequeueWorker(slice);
            if (!workerId) {
                reenqueueSlices.push(slice);
            } else {
                const dispatched = await this.server.dispatchSlice(slice, workerId);

                if (dispatched) {
                    this.logger.debug(`dispatched slice ${slice.slice_id} to worker ${workerId}`);
                } else {
                    reenqueueSlices.push(slice);
                    this.logger.warn(`worker "${workerId}" is not available to process slice ${slice.slice_id}`);
                }
            }
        }));

        if (reenqueueSlices.length > 0) {
            this.logger.debug(`re-enqueing ${reenqueueSlices.length} slices because they were unable to be dispatched`);
            _.forEach(reenqueueSlices, (slice) => {
                this.pendingSlices -= 1;
                this.slicerQueue.unshift(slice);
            });
        }

        return Promise.delay(0);
    }

    async _slicerInit() {
        const {
            logger,
            context,
        } = this;

        const maxRetries = _.get(this.executionContext, 'config.max_retries', 3);
        const retryOptions = {
            max_tries: maxRetries,
            throw_original: true,
            interval: 100,
        };

        this.slicers = await retry(() => {
            const executionContext = _.cloneDeep(this.executionContext);
            const startingPoints = this.startingPoints ? _.cloneDeep(this.startingPoints) : [];

            return this.executionContext.slicer.newSlicer(
                context,
                executionContext,
                startingPoints,
                logger
            );
        }, retryOptions);

        this.scheduler = await this._registerSlicers(this.slicers);
    }

    async _registerSlicers(slicers = [], isRecovery = false) {
        const { config } = this.executionContext;
        if (!Array.isArray(slicers)) {
            throw new Error(`newSlicer from module ${config.operations[0]._op} needs to return an array of slicers`);
        }

        this.slicersReady = false;
        this.totalSlicers += _.size(slicers);
        this.executionAnalytics.set('slicers', slicers.length);

        const scheduler = slicers.map((slicerFn, index) => this._registerSlicerFn(slicerFn, index));

        // Recovery has it own error listening logic internally
        if (!isRecovery) {
            if (config.lifecycle === 'once') {
                this.events.once('slice:failure', this.setFailingStatus);
            } else {
                // in persistent mode we set watchdogs to monitor
                // when failing can be set back to running
                this.events.on('slice:failure', this._checkAndUpdateExecutionState());
            }
        }

        this.logger.debug(`registered ${_.size(slicers)} slicers`);
        this.slicersReady = true;

        return scheduler;
    }

    async _registerSlicerFn(slicerFn, slicerId) {
        let hasCompleted = false;
        let isProcessing = false;
        let slicerOrder = 0;

        return async () => {
            if (isProcessing) return;
            if (hasCompleted) return;

            this.logger.trace(`slicer ${slicerId} is being called`);
            isProcessing = true;
            try {
                const sliceRequest = await slicerFn();
                this.logger.trace(`slicer ${slicerId} was called`, { sliceRequest });

                // not null or undefined
                if (sliceRequest != null) {
                    if (_.isArray(sliceRequest)) {
                        this.logger.warn(`slicer for execution: ${this.exId} is subslicing by key`);
                        this.executionAnalytics.increment('subslice_by_key');
                    }

                    slicerOrder = await this.allocateSlice(
                        sliceRequest,
                        slicerId,
                        slicerOrder
                    );
                } else if (this.isOnce) {
                    hasCompleted = true;
                    this._slicerCompleted(slicerId);
                }

                isProcessing = false;
            } catch (err) {
                this.logger.trace(`slicer ${slicerId} failure`);
                // retries are handled internally by slicer
                isProcessing = false;
                await this.terminalError(err);
            }
        };
    }

    _slicerCompleted(slicerId) {
        this.slicersDoneCount += 1;

        this.logger.trace(`slicer ${slicerId} finished`);
        // slicer => a single slicer has finished
        this.events.emit('slicer:finished');

        const remaining = this.totalSlicers - this.slicersDoneCount;

        if (remaining > 0) {
            this.logger.info(`a slicer for execution: ${this.exId} has completed its range, ${remaining} remaining slicers`);
            return;
        }

        this.slicersDone = true;
        this.logger.info(`all slicers for execution: ${this.exId} have been completed, waiting for slices in slicerQueue to be processed`);

        this.events.emit('slicers:finished');
        this.executionAnalytics.set('queuing_complete', newFormattedDate());
    }

    async _recoverSlicesInit() {
        this.recover = makeExecutionRecovery(
            this.context,
            this.terminalError,
            this.stores.stateStore,
            this.executionContext
        );

        await this.recover.initialize();

        this.logger.info(`execution: ${this.exId} is starting in recovery mode`);

        this.slicers = await this.recover.newSlicer();

        this.scheduler = await this._registerSlicers(this.slicers, true);
        this.slicersReady = true;
    }

    async _waitForRecovery() {
        if (this.recoveryComplete) return;

        await new Promise((resolve) => {
            this.events.once('execution:recovery:complete', (startingPoints) => {
                this.logger.trace('recovery starting points', startingPoints);
                this.startingPoints = startingPoints;
                resolve();
            });
        });

        if (_.get(this.startingPoints, '_exit') === true) {
            this.recoveryComplete = this.recover.recoveryComplete;
            this.logger.warn('execution recovery has been marked as completed');
            return;
        }

        await this._slicerInit();

        if (this.recover.recoveryComplete) {
            this.logger.info(`execution ${this.exId} finished its recovery`);
        } else {
            this.logger.warn(`execution ${this.exId} failed to finish its recovery`);
        }

        this.recoveryComplete = this.recover.recoveryComplete;
    }

    async _finishExecution() {
        if (this.isExecutionFinished) return;

        this._logFinishedJob();

        try {
            await this._updateExecutionStatus();
        } catch (err) {
            /* istanbul ignore next */
            const errMsg = parseError(err);
            this.logger.error(`execution ${this.exId} has run to completion but the process has failed while updating the execution status, slicer will soon exit, error: ${errMsg}`);
        }

        this.isExecutionFinished = true;
        this.isExecutionDone = true;
    }

    async _updateExecutionStatus() {
        // if this.slicerFailed is true, slicer has already been marked as failed
        if (this.slicerFailed) return;

        const { logger } = this;
        const { exStore } = this.stores;

        const executionStats = this.executionAnalytics.getAnalytics();

        if (!this.isDoneProcessing) {
            // if status is stopping or stopped, only update the execution metadata
            const status = await exStore.getStatus(this.exId);
            const isStopping = status === 'stopping' || status === 'stopped';
            if (isStopping) {
                const metaData = exStore.executionMetaData(executionStats);
                logger.debug(`execution is set to ${status}, status will not be updated`);
                await exStore.update(this.exId, metaData);
                return;
            }

            const errMsg = `execution ${this.exId} received shutdown before the slicer could complete, setting status to "terminated"`;
            const metaData = exStore.executionMetaData(executionStats, errMsg);
            logger.error(errMsg);
            await exStore.setStatus(this.exId, 'terminated', metaData);
            return;
        }

        const errCount = await this._checkExecutionState();
        if (errCount > 0) {
            const errMsg = `execution: ${this.exId} had ${errCount} slice failures during processing`;
            const errorMeta = exStore.executionMetaData(executionStats, errMsg);
            logger.error(errMsg);
            await exStore.setStatus(this.exId, 'failed', errorMeta);
            return;
        }

        const metaData = exStore.executionMetaData(executionStats);
        logger.info(`execution ${this.exId} has completed`);
        await exStore.setStatus(this.exId, 'completed', metaData);
    }

    _logFinishedJob() {
        const endTime = Date.now();
        const elapsed = endTime - this.startTime;
        const time = elapsed < 1000 ? 1 : Math.round((elapsed) / 1000);

        this.executionAnalytics.set('job_duration', time);

        if (this.collectAnalytics) {
            this.slicerAnalytics.analyzeStats();
        }

        this.logger.info(`execution ${this.exId} has finished in ${time} seconds`);
    }

    _checkExecutionState() {
        const query = `ex_id:${this.exId} AND (state:error OR state:start)`;
        return this.stores.stateStore.count(query, 0);
    }

    async _waitForWorkersToExit() {
        if (!this.server.onlineClientCount) return;

        const timeoutOutAt = this.workerDisconnectTimeout + Date.now();

        const logWaitingForWorkers = _.throttle(() => {
            this.logger.debug(`waiting for ${this.server.onlineClientCount} to go offline`);
        }, 1000, {
            leading: true,
            trailing: true,
        });

        const checkOnlineCount = async () => {
            if (this.isExecutionFinished) {
                this.logger.trace('execution finished while waiting for workers to go offline');
                return;
            }

            if (!this.client.ready) return;

            if (!this.server.onlineClientCount) {
                this.logger.trace('workers all workers have disconnected');
                return;
            }

            const now = Date.now();
            if (now > timeoutOutAt) {
                return;
            }

            logWaitingForWorkers();

            await Promise.delay(100);
            await checkOnlineCount();
        };

        await checkOnlineCount();
    }

    async _waitForPendingSlices() {
        const logPendingSlices = _.throttle(() => {
            this.logger.debug(`waiting for ${this.pendingSlices} slices to finish`);
        }, 1000, {
            leading: true,
            trailing: true,
        });

        const checkPendingSlices = async () => {
            if (this.isShuttingDown) return;

            if (!this.pendingSlices) {
                this.logger.debug('all pending slices are done');
                return;
            }

            logPendingSlices();

            await Promise.delay(100);
            await checkPendingSlices();
        };

        await checkPendingSlices();
    }

    _waitForExecutionFinished() {
        const timeout = Math.round(this.shutdownTimeout * 0.8);
        const shutdownAt = timeout + Date.now();

        const logShuttingDown = _.throttle(() => {
            this.logger.debug('shutdown is waiting for execution to finish...');
        }, 1000, {
            leading: true,
            trailing: true,
        });

        const checkExecution = async () => {
            if (this.isExecutionDone) {
                this.logger.trace('execution finished while shutting down');
                return null;
            }

            if (!this.client.ready) return null;

            const now = Date.now();
            if (now > shutdownAt) {
                this.logger.error(`Shutdown timeout of ${timeout}ms waiting for execution ${this.exId} to finish...`);
                return null;
            }

            logShuttingDown();
            await Promise.delay(100);
            return checkExecution();
        };

        return checkExecution();
    }

    // verify the execution can be set to running
    async _verifyExecution() {
        const { exStore } = this.stores;
        let error;

        const terminalStatuses = exStore.getTerminalStatuses();
        const runningStatuses = exStore.getRunningStatuses();
        const status = await exStore.getStatus(this.exId);

        if (_.includes(terminalStatuses, status)) {
            error = new Error(`Execution ${this.exId} was starting in terminal status, sending execution:finished event to cluster master`);
        } else if (_.includes(runningStatuses, status)) {
            error = new Error(`Execution ${this.exId} was starting in running status, sending execution:finished event to cluster master`);
        } else {
            return true;
        }

        await this.client.sendExecutionFinished(error.message);

        this.logger.warn('Unable to verify execution on initialization', error.stack);
        return false;
    }

    _checkAndUpdateExecutionState() {
        const probationWindow = this.executionContext.config.probation_window;
        let watchDogSet = false;
        let errorCount;
        let processedCount;

        return async () => {
            if (watchDogSet) return;
            watchDogSet = true;
            const analyticsData = this.executionAnalytics.getAnalytics();
            // keep track of how many slices have been processed and failed
            errorCount = analyticsData.failed;
            processedCount = analyticsData.processed;
            await this.setFailingStatus();
            const { exStore } = this.stores;

            this.watcher = setInterval(() => {
                const currentAnalyticsData = this.executionAnalytics.getAnalytics();
                const currentErrorCount = currentAnalyticsData.failed;
                const currentProcessedCount = currentAnalyticsData.processed;
                const errorCountTheSame = currentErrorCount === errorCount;
                const slicesHaveProcessedSinceError = currentProcessedCount > processedCount;

                if (errorCountTheSame && slicesHaveProcessedSinceError) {
                    clearInterval(this.watcher);
                    this.logger.info(`No slice errors have occurred within execution: ${this.exId} will be set back to 'running' state`);
                    exStore.setStatus(this.exId, 'running');
                    return;
                }
                errorCount = currentErrorCount;
                processedCount = currentProcessedCount;
            }, probationWindow);
        };
    }

    _startWorkConnectWatchDog() {
        clearTimeout(this.workerConnectTimeoutId);

        const timeout = this.context.sysconfig.teraslice.slicer_timeout;
        const err = new Error(`No workers have connected to slicer in the allotted time: ${timeout} ms`);

        this.workerConnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerConnectTimeoutId);

            if (this.isShuttingDown) return;
            if (this.workersHaveConnected) return;

            this.logger.warn(`A worker has not connected to a slicer for ex: ${this.exId}, shutting down execution`);

            this.terminalError(err);
        }, timeout);
    }

    _startWorkerDisconnectWatchDog() {
        clearTimeout(this.workerDisconnectTimeoutId);

        if (this.isShuttingDown) return;
        if (this.server.onlineClientCount > 0) return;

        const err = new Error(`All workers from workers from ${this.exId} have disconnected`);

        this.workerDisconnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerDisconnectTimeoutId);

            if (this.isShuttingDown) return;
            if (this.server.onlineClientCount > 0) return;

            this.terminalError(err);
        }, this.workerDisconnectTimeout);
    }
}

module.exports = ExecutionController;
