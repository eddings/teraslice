/** Declaration file generated by dts-gen */

import * as bunyan from 'bunyan';
export = debugnyan;

declare function debugnyan(name: string, options?: object, config?: {
    prefix?: string,
    suffix?: string,
    simple?: boolean,
}): bunyan;