import semver from 'semver';
import { keys, get } from 'lodash';
import { PackageInfo } from '../interfaces';
import { listPackages, updatePkgJSON, readPackageInfo } from '../packages';

export type BumpPackageOptions = {
    release: semver.ReleaseType;
    recursive: boolean;
    preId?: string;
};

export async function bumpPackage(mainPkgInfo: PackageInfo, options: BumpPackageOptions) {
    await updateMainPkg(mainPkgInfo, options);
    for (const pkgInfo of listPackages()) {
        await updateDependent(mainPkgInfo, pkgInfo, options);
    }
    const e2ePkgInfo = await readPackageInfo('e2e');
    await updateDependent(mainPkgInfo, e2ePkgInfo, options);
}

async function updateMainPkg(mainPkgInfo: PackageInfo, options: BumpPackageOptions) {
    const newVersion = bumpVersion(mainPkgInfo, options.release, options.preId);
    mainPkgInfo.version = newVersion;
    await updatePkgJSON(mainPkgInfo, false);

    // tslint:disable-next-line: no-console
    console.error(`=> Updated ${mainPkgInfo.name} to version ${mainPkgInfo.version} to ${newVersion}`);
    return newVersion;
}

function bumpVersion(pkgInfo: PackageInfo, release: semver.ReleaseType = 'patch', preId?: string) {
    const version = semver.inc(pkgInfo.version, release, false, preId);
    if (!version) {
        throw new Error(`Failure to increment version "${pkgInfo.version}" using "${release}"`);
    }

    return version;
}

async function updateDependent(mainPkgInfo: PackageInfo, pkgInfo: PackageInfo, options: BumpPackageOptions) {
    if (!isDependent(mainPkgInfo, pkgInfo)) return;
    const { name } = mainPkgInfo;
    const newVersion = formatVersion(mainPkgInfo.version);

    let isProdDep = false;
    if (pkgInfo.dependencies && pkgInfo.dependencies[name]) {
        isProdDep = true;
        pkgInfo.dependencies[name] = newVersion;
    } else if (pkgInfo.devDependencies && pkgInfo.devDependencies[name]) {
        pkgInfo.devDependencies[name] = newVersion;
    } else if (pkgInfo.peerDependencies && pkgInfo.peerDependencies[name]) {
        pkgInfo.peerDependencies[name] = newVersion;
    }

    await updatePkgJSON(pkgInfo, false);
    // tslint:disable-next-line: no-console
    console.error(`---> Updated dependency ${pkgInfo.name}'s version of ${name} to ${newVersion}`);

    if (options.recursive && isProdDep && pkgInfo.name !== 'teraslice') {
        await bumpPackage(pkgInfo, {
            release: 'patch',
            recursive: false,
        });
    }
}

function formatVersion(version: string): string {
    return `^${version}`;
}

function isDependent(mainPkgInfo: PackageInfo, pkgInfo: PackageInfo): boolean {
    if (pkgInfo.name === mainPkgInfo.name) return false;
    const devDeps = keys(get(pkgInfo, 'devDependencies'));
    const peerDeps = keys(get(pkgInfo, 'peerDependencies'));
    const deps = keys(get(pkgInfo, 'dependencies'));
    const allDeps: string[] = [...devDeps, ...peerDeps, ...deps];
    return allDeps.includes(mainPkgInfo.name);
}