'use strict';

const fs = require('fs');
const path = require('path');
const { jest: lernaAliases } = require('lerna-alias');

module.exports = (projectDir) => {
    const name = path.basename(projectDir);
    const workspaceName = name === 'e2e' ? 'e2e' : 'packages';
    const rootDir = name === 'e2e' ? '../' : '../../';
    const packageRoot = name === 'e2e' ? '<rootDir>/e2e' : `<rootDir>/${workspaceName}/${name}`;
    const isTypescript = fs.existsSync(path.join(projectDir, 'tsconfig.json'));

    const config = {
        rootDir,
        name: `${workspaceName}/${name}`,
        displayName: name,
        verbose: true,
        testEnvironment: 'node',
        setupFilesAfterEnv: ['jest-extended'],
        testMatch: [`${packageRoot}/test/**/*-spec.{ts,js}`, `${packageRoot}/test/*-spec.{ts,js}`],
        testPathIgnorePatterns: [
            '<rootDir>/assets',
            `<rootDir>/${workspaceName}/*/node_modules`,
            `<rootDir>/${workspaceName}/*/dist`,
            `<rootDir>/${workspaceName}/teraslice-cli/test/fixtures/`
        ],
        transformIgnorePatterns: ['^.+\\.js$'],
        moduleNameMapper: lernaAliases({ mainFields: ['srcMain', 'main'] }),
        moduleFileExtensions: ['ts', 'js', 'json', 'node', 'pegjs'],
        collectCoverage: true,
        coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
        watchPathIgnorePatterns: [],
        coverageReporters: ['lcov', 'html', 'text-summary'],
        coverageDirectory: `${packageRoot}/coverage`,
        preset: 'ts-jest',
        watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
    };

    if (fs.existsSync(path.join(projectDir, 'test/global.setup.js'))) {
        config.globalSetup = `${packageRoot}/test/global.setup.js`;
    }

    if (fs.existsSync(path.join(projectDir, 'test/global.teardown.js'))) {
        config.globalTeardown = `${packageRoot}/test/global.teardown.js`;
    }

    if (fs.existsSync(path.join(projectDir, 'test/test.setup.js'))) {
        config.setupFilesAfterEnv.push(`${packageRoot}/test/test.setup.js`);
    }

    config.globals = {
        availableExtensions: ['.js', '.ts']
    };

    if (isTypescript) {
        config.globals['ts-jest'] = {
            tsConfig: `./${workspaceName}/${name}/tsconfig.json`,
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
