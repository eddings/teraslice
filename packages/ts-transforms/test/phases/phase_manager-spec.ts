
import path from 'path';
import { debugLogger, DataEntity } from '@terascope/job-components';
import { PhaseManager } from '../../src/index';

describe('phase manager', () => {
    const logger = debugLogger('phase_manager');

    const matchRules1Path = path.join(__dirname, '../fixtures/matchRules1.txt');
    const transformRules17Path = path.join(__dirname, '../fixtures/transformRules17.txt');
    const transformRules16Path = path.join(__dirname, '../fixtures/transformRules16.txt');

    it('can instantiate', async () => {
        const opConfig = { type: 'matcher', file_path: matchRules1Path };
        const manager = new PhaseManager(opConfig, logger);
        return manager.init();
    });

    it('match only has selection phase activated', async () => {
        const opConfig = { type: 'matcher', file_path: matchRules1Path };
        const manager = new PhaseManager(opConfig, logger);

        await manager.init();

        expect(manager.isMatcher).toEqual(true);
        expect(manager.sequence.length).toEqual(1);
        expect(manager.sequence[0].constructor.name).toEqual('SelectionPhase');
        // @ts-ignore
        expect(manager.sequence[0].selectionPhase.length).toEqual(2);
    });

    it('if type matcher then selection will only occur when given transform rules', async () => {
        const opConfig = { type: 'matcher', file_path: transformRules17Path };
        const manager = new PhaseManager(opConfig, logger);

        await manager.init();

        expect(manager.isMatcher).toEqual(true);
        expect(manager.sequence.length).toEqual(1);
        expect(manager.sequence[0].constructor.name).toEqual('SelectionPhase');
        // @ts-ignore
        expect(manager.sequence[0].selectionPhase.length).toEqual(1);
    });

    it('can load all phases for transform rules', async() => {
        const opConfig = { type: 'transform', file_path: transformRules16Path };
        const manager = new PhaseManager(opConfig, logger);

        await manager.init();

        expect(manager.isMatcher).toEqual(false);
        expect(manager.sequence.length).toEqual(4);

        expect(manager.sequence[0].constructor.name).toEqual('SelectionPhase');
        // @ts-ignore
        expect(manager.sequence[0].selectionPhase.length).toEqual(1);

        expect(manager.sequence[1].constructor.name).toEqual('ExtractionPhase');
        expect(Object.keys(manager.sequence[1].phase).length).toEqual(1);

        expect(manager.sequence[2].constructor.name).toEqual('PostProcessPhase');
        expect(Object.keys(manager.sequence[2].phase).length).toEqual(1);

        expect(manager.sequence[3].constructor.name).toEqual('ValidationPhase');
        expect(Object.keys(manager.sequence[3].phase).length).toEqual(1);
        expect(manager.sequence[3].phase['__all']).toBeDefined();
    });

    it('can run an array of data', async() => {
        const opConfig = { type: 'transform', file_path: transformRules16Path };
        const manager = new PhaseManager(opConfig, logger);
        const str = 'hello';
        const date = new Date().toISOString();

        function encode(str: string) {
            return Buffer.from(str).toString('base64');
        }

        const data = DataEntity.makeArray([
            { host: 'fc2.com', field1: `field1=${encode(str)}`, date },
            { something: 'else' },
            { host: 'fc2.com', field1: `${encode(str)}`, date }
        ]);

        await manager.init();

        const results = manager.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field1: 'hello', date });
    });
});
