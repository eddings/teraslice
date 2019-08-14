'use strict';

const path = require('path');
const { TSError, parseError } = require('@terascope/utils');

function requireConnector(filePath, errors) {
    let mod = require(filePath);
    if (mod && mod.default) {
        mod = mod.default;
    }
    let valid = true;
    if (typeof mod !== 'object') {
        valid = false;
    }

    if (mod && typeof mod.config_schema !== 'function') {
        errors.push({
            filePath,
            message: `Connector ${filePath} missing required config_schema function`,
        });
        valid = false;
    }

    if (mod && typeof mod.create !== 'function') {
        errors.push({
            filePath,
            message: `Connector ${filePath} missing required create function`
        });
        valid = false;
    }

    if (valid) return mod;
    return null;
}

function guardedRequire(filePath, errors) {
    try {
        return requireConnector(filePath, errors);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return false;
        }

        errors.push({
            filePath,
            message: parseError(error, true),
        });
        return null;
    }
}

function getConnectorModule(name, reason) {
    let mod;

    // collect the errors
    const errors = [];

    const localPath = path.join(__dirname, 'connectors', name);
    mod = guardedRequire(localPath, errors);

    // check if its a node module
    if (!mod) {
        mod = guardedRequire(name, errors);
    }

    // Still not found check for a connector with underscores
    if (!mod) {
        mod = guardedRequire(`terafoundation_${name}_connector`, errors);
    }

    // Still not found check for a connector with dashes
    if (!mod) {
        mod = guardedRequire(`terafoundation-${name}-connector`, errors);
    }

    // Stil not found check for the @terascope namespace
    if (!mod) {
        mod = guardedRequire(`@terascope/${name}`, errors);
    }

    if (mod) return mod;

    if (errors.length) {
        const filePaths = errors.map(({ filePath }) => filePath);
        const messages = errors.map(({ message }) => message);
        throw new TSError(messages.join(', caused by '), {
            reason,
            context: {
                filePaths,
            }
        });
    }
    return null;
}

function getConnectorSchema(name) {
    const reason = `Could not retrieve schema code for: ${name}\n`;

    const mod = getConnectorModule(name, reason);
    if (!mod) {
        // eslint-disable-next-line no-console
        console.warn(`[WARNING] ${reason}`);
        return {};
    }
    return mod.config_schema();
}

function createConnection(name, moduleConfig, logger, options) {
    const reason = `Could not find connector implementation for: ${name}\n`;

    const mod = getConnectorModule(name, reason);
    if (!mod) {
        throw new Error(reason);
    }

    return mod.create(moduleConfig, logger, options);
}

module.exports = {
    createConnection,
    getConnectorSchema,
    getConnectorModule
};
