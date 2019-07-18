import { isFunction, get } from '@terascope/utils';
import { OperationAPI, OperationAPIType } from '../operations';
import { Context } from '../interfaces';

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

export function makeContextLogger(context: Context, moduleName: string, extra = {}) {
    return context.apis.foundation.makeLogger(
        Object.assign(
            {
                module: moduleName,
                worker_id: get(context, 'cluster.worker.id'),
                assignment: get(context, 'assignment'),
            },
            extra
        )
    );
}
