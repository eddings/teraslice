import yargs from 'yargs';
import await from '../../../src/cmds/jobs/await';

describe('jobs await', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                await.command,
                await.describe,
                await.builder,
                () => true
            );

            const yargsResult = yargsCmd.parse(
                'await ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                await.command,
                await.describe,
                await.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'await ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
