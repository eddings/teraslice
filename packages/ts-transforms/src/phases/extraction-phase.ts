/* eslint-disable @typescript-eslint/prefer-for-of */

import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { hasKeys } from './utils';
import {
    WatcherConfig,
    ExtractionProcessingDict,
    OperationsPipline,
    Operation
} from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class ExtractionPhase extends PhaseBase {
    constructor(
        opConfig: WatcherConfig,
        configList: ExtractionProcessingDict,
        opsManager: OperationsManager
    ) {
        super(opConfig);
        this.opConfig = opConfig;
        const Extraction = opsManager.getTransform('extraction');

        _.forOwn(configList, (operationList, key) => {
            this.phase[key] = [new Extraction(operationList)];
        });

        this.hasProcessing = hasKeys(this.phase);
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        for (let i = 0; i < dataArray.length; i += 1) {
            const results = createTargetResults(dataArray[i]);
            runExtractions(this.phase, dataArray[i], results);
            if (results.metadata.hasExtractions) {
                resultsList.push(results.entity);
            }
        }
        return resultsList;
    }
}

function createTargetResults(input: DataEntity): { entity: DataEntity; metadata: any } {
    const entity = DataEntity.fork(input, false);
    return {
        metadata: entity.getMetadata(),
        entity,
    };
}

function runExtractions(
    phase: OperationsPipline,
    doc: DataEntity,
    results: { entity: DataEntity; metadata: any }
): { entity: DataEntity; metadata: any } {
    for (let i = 0; i < results.metadata.selectors.length; i++) {
        runSelectorExtraction(phase[results.metadata.selectors[i]], doc, results);
    }
    return results;
}

function runSelectorExtraction(
    selectorPhase: Operation[],
    doc: DataEntity,
    results: { entity: DataEntity; metadata: any }
): void {
    for (let i = 0; i < selectorPhase.length; i++) {
        // @ts-ignore
        selectorPhase[i].extractionPhaseRun(doc, results);
    }
}
