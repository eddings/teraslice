import { isFunction, DataWindow } from '@terascope/utils';
import { OperationAPI, OperationAPIType } from '../operations';

export function getMetric(input: number[], i: number): number {
    const val = input && input[i];
    if (val > 0) return val;
    return 0;
}

export function isOperationAPI(api: any): api is OperationAPI {
    return api && isFunction(api.createAPI);
}

export function getOperationAPIType(api: any): OperationAPIType {
    return isOperationAPI(api) ? 'api' : 'observer';
}

interface ProcessorLike {
    handle(input: DataWindow): Promise<DataWindow|DataWindow[]>;
}

export function handleProcessorFn<T extends ProcessorLike>(processor: T) {
    return async (input: DataWindow|DataWindow[]): Promise<DataWindow|DataWindow[]> => {
        if (!input.length) {
            return processor.handle(DataWindow.make([]));
        }

        if (DataWindow.isArray(input)) {
            const results: DataWindow[] = [];

            for (const window of input) {
                const windowResult = await processor.handle(window);
                if (DataWindow.isArray(windowResult)) {
                    results.push(
                        ...windowResult
                    );
                } else if (DataWindow.is(windowResult)) {
                    results.push(
                        windowResult
                    );
                } else {
                    results.push(DataWindow.make(
                        windowResult,
                        window.getMetadata()
                    ));
                }
            }

            return results;
        }

        return processor.handle(input);
    };
}
