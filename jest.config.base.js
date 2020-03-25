'use strict';

const fs = require('fs');
const path = require('path');
const { isCI } = require('@terascope/utils');
const { getJestAliases } = require('@terascope/scripts');

module.exports = (projectDir) => {
    let parentFolder;
    let workspaceName;
    let packageRoot;
    let rootDir;

    const name = path.basename(projectDir);
    const runInDir = process.cwd() !== __dirname;

    if (name === 'e2e') {
        parentFolder = name;
        workspaceName = name;
        if (runInDir) {
            packageRoot = '<rootDir>';
            rootDir = './';
        } else {
            packageRoot = `<rootDir>/${name}`;
            rootDir = '../';
        }
    } else {
        parentFolder = 'packages';
        workspaceName = `packages/${name}`;
        packageRoot = `<rootDir>/${workspaceName}`;
        rootDir = '../../';
    }

    const isTypescript = fs.existsSync(path.join(projectDir, 'tsconfig.json'));

    const coverageReporters = ['lcov', 'html'];
    if (!isCI) {
        coverageReporters.push('text-summary');
    }
    const config = {
        rootDir,
        name: workspaceName,
        displayName: name,
        verbose: true,
        testEnvironment: 'node',
        setupFilesAfterEnv: ['jest-extended'],
        testMatch: [`${packageRoot}/test/**/*-spec.{ts,js}`, `${packageRoot}/test/*-spec.{ts,js}`],
        testPathIgnorePatterns: [
            '<rootDir>/assets',
            `<rootDir>/${parentFolder}/*/node_modules`,
            `<rootDir>/${parentFolder}/*/dist`,
            `<rootDir>/${parentFolder}/teraslice-cli/test/fixtures/`
        ],
        transformIgnorePatterns: ['^.+\\.js$'],
        moduleNameMapper: getJestAliases(),
        moduleFileExtensions: ['ts', 'js', 'json', 'node', 'pegjs'],
        collectCoverage: true,
        coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
        watchPathIgnorePatterns: [],
        coverageReporters,
        coverageDirectory: `${packageRoot}/coverage`,
        preset: 'ts-jest',
        watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
    };

    if (fs.existsSync(path.join(projectDir, 'test/global.setup.js'))) {
        config.globalSetup = `${packageRoot}/test/global.setup.js`;
    } else if (fs.existsSync(path.join(projectDir, 'test/global.setup.ts'))) {
        config.globalSetup = `${packageRoot}/test/global.setup.ts`;
    }

    if (fs.existsSync(path.join(projectDir, 'test/global.teardown.js'))) {
        config.globalTeardown = `${packageRoot}/test/global.teardown.js`;
    } else if (fs.existsSync(path.join(projectDir, 'test/global.teardown.ts'))) {
        config.globalTeardown = `${packageRoot}/test/global.teardown.ts`;
    }

    if (fs.existsSync(path.join(projectDir, 'test/test.setup.js'))) {
        config.setupFilesAfterEnv.push(`${packageRoot}/test/test.setup.js`);
    }

    config.globals = {
        availableExtensions: ['.js', '.ts']
    };

    if (isTypescript) {
        config.globals['ts-jest'] = {
            tsConfig: runInDir ? './tsconfig.json' : `./${workspaceName}/tsconfig.json`,
            diagnostics: true,
            pretty: true
        };
    } else {
        config.globals['ts-jest'] = {
            diagnostics: true,
            pretty: true
        };
    }

    config.roots = [`${packageRoot}/test`];

    if (fs.existsSync(path.join(projectDir, 'lib'))) {
        config.roots.push(`${packageRoot}/lib`);
    } else if (fs.existsSync(path.join(projectDir, 'index.js'))) {
        config.roots.push(`${packageRoot}`);
    }

    if (fs.existsSync(path.join(projectDir, 'src'))) {
        config.roots.push(`${packageRoot}/src`);
    }

    if (fs.existsSync(path.join(projectDir, 'peg'))) {
        config.roots.push(`${packageRoot}/peg`);
    }

    return config;
};
