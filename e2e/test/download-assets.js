'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const downloadRelease = require('@terascope/fetch-github-release');
const signale = require('./signale');

// When the docker image is switched to use node:10 this value needs to be changed to '10'
const nodeVersion = '10';
const autoloadDir = path.join(__dirname, '..', 'autoload');
const leaveZipped = true;
const disableLogging = true;

const bundles = [
    {
        repo: 'elasticsearch-assets',
        name: 'elasticsearch'
    },
    {
        repo: 'kafka-assets',
        name: 'kafka'
    }
];

function assetFileInfo(assetName) {
    const [name, version] = assetName.split('-');
    return {
        name,
        version: semver.coerce(version),
        repo: `${name}-assets`,
        fileName: assetName
    };
}

function getOlderAsset(assets, assetName) {
    const { name, version } = assetFileInfo(assetName);

    return assets.find((a) => {
        if (a.name !== name) return false;
        return semver.gt(version, a.version);
    });
}

function filterRelease(release) {
    return !release.draft && !release.prerelease;
}

function filterAsset(asset) {
    const mustContain = `node-${nodeVersion}-linux-x64.zip`;
    return asset.name.indexOf(mustContain) >= 0;
}

function listAssets() {
    return fs
        .readdirSync(autoloadDir)
        .filter((file) => {
            const ext = path.extname(file);
            return ext === '.zip';
        })
        .map(assetFileInfo);
}

function count(arr, fn) {
    let c = 0;
    for (const v of arr) {
        if (fn(v)) c++;
    }
    return c;
}

function deleteOlderAssets() {
    const duplicateAssets = listAssets().filter(({ name }, i, all) => {
        const c = count(all, (a) => a.name === name);
        return c > 1;
    });

    const olderAssets = duplicateAssets.reduce((acc, current, index, src) => {
        const without = src.filter((a, i) => index !== i);
        const older = getOlderAsset(without, current.fileName);
        if (older) {
            older.newerVersion = current.version;
            return acc;
        }
        return acc.concat([current]);
    }, []);

    for (const asset of olderAssets) {
        signale.warn(`Deleting asset ${asset.name}@v${asset.version} in-favor of existing v${asset.newerVersion}`);
        fs.unlinkSync(path.join(autoloadDir, asset.fileName));
    }
}

function logAssets() {
    const assets = listAssets().map(({ name, version }) => `${name}@v${version}`);
    signale.info(`Autoload asset bundles: ${assets.join(', ')}`);
}

async function downloadAssets() {
    const promises = bundles.map(async ({ repo }) => {
        await downloadRelease(
            'terascope',
            repo,
            autoloadDir,
            filterRelease,
            filterAsset,
            leaveZipped,
            disableLogging
        );
    });

    await Promise.all(promises);

    deleteOlderAssets();
    logAssets();
}

if (require.main === module) {
    downloadAssets();
} else {
    module.exports = downloadAssets;
}
