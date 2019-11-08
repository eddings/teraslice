'use strict';

const misc = require('../../misc');
const { waitForExStatus } = require('../../wait');
const { resetState } = require('../../helpers');

const teraslice = misc.teraslice();

describe('recovery', () => {
    beforeAll(() => resetState());

    it('can support different recovery mode cleanup=errors', async () => {
        const ex = teraslice.executions.wrap('testex-errors');
        const newEx = await ex.recover({ cleanup: 'errors' });
        await waitForExStatus(newEx, 'completed');

        const stats = await misc.indexStats('test-recovery-100');
        expect(stats.count).toEqual(100);
    });

    it('can support different recovery mode cleanup=all', async () => {
        const ex = teraslice.executions.wrap('testex-all');
        const newEx = await ex.recover({ cleanup: 'all' });
        await waitForExStatus(newEx, 'completed');

        const stats = await misc.indexStats('test-recovery-200');
        expect(stats.count).toEqual(200);
    });
});
