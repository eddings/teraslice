import path from 'path';
import fs from 'fs-extra';
import tmp from 'tmp';
import AssetSrc from '../../src/helpers/asset-src';

describe('AssetSrc', () => {
    let testAsset: AssetSrc;
    const srcDir = path.join(__dirname, '../fixtures/testAsset');

    beforeEach(() => {
        testAsset = new AssetSrc(srcDir);
    });

    test('should have srcDir and assetFile properties', () => {
        expect(testAsset.srcDir).toEqual(srcDir);
        expect(testAsset.assetFile).toEqual(
            path.join(srcDir, 'asset', 'asset.json')
        );
        expect(testAsset.name).toEqual('testAsset');
        expect(testAsset.version).toEqual('0.0.1');
    });

    test('should throw in constructor when provided non-asset path', () => {
        const nonAssetDir = path.join(__dirname, '../fixtures');
        expect(() => new AssetSrc(nonAssetDir)).toThrow();
    });

    test('should generate correct name with zipFileName()', () => {
        expect(testAsset.zipFileName).toMatch(/testAsset-v0.0.1-node-.*.zip/);
    });

    test('build', async () => {
        const r = await testAsset.build();
        expect(r).toInclude('.zip');
        fs.removeSync(r);
    });

    test('->zip', async () => {
        const tmpDir = tmp.dirSync();
        const outFile = path.join(tmpDir.name, 'out.zip');
        const zipOutput = await AssetSrc.zip(path.join(__dirname, 'fixtures', 'testAsset', 'asset'), outFile);
        expect(zipOutput.success).toEqual(outFile);
        fs.removeSync(tmpDir.name);
    });
});

describe('AssetSrc with build', () => {
    let testAsset: any;
    const srcDir = path.join(__dirname, '../fixtures/testAssetWithBuild');

    beforeEach(() => {
        testAsset = new AssetSrc(srcDir);
    });

    afterEach(() => {
        testAsset = {};
    });

    test('->_yarnCmd', () => {
        const yarn = testAsset._yarnCmd(path.join(testAsset.srcDir, 'asset'), ['run', 'asset:build']);
        expect(yarn.status).toEqual(0);
        expect(yarn.stdout.toString()).toInclude('$ echo');
    });
});
