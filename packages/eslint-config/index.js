'use strict';

module.exports = {
    extends: ['airbnb'],
    parserOptions: {
        ecmaVersion: 8,
        sourceType: 'script'
    },
    env: {
        node: true,
        jasmine: true,
        jest: true
    },
    rules: {
        // airbnb overrides
        indent: ['error', 4],
        'no-underscore-dangle': 'off',
        'no-param-reassign': ['error', { props: false }],
        'no-use-before-define': ['error', { functions: false }],
        'import/no-dynamic-require': 'off',
        'global-require': 'off',
        strict: ['error', 'global'],
        'comma-dangle': 'off',
        'prefer-promise-reject-errors': 'off',
        'no-restricted-globals': ['error', 'isFinite'],
        'func-names': ['error', 'as-needed'],
        'no-path-concat': 'error',
        'no-debugger': 'error',
        'handle-callback-err': ['error', 'error'],
        'import/no-extraneous-dependencies': 'off',
        'class-methods-use-this': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'no-plusplus': 'off',
        'no-continue': 'off',
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'no-unused-expressions': [
            'error',
            { allowTernary: true, allowShortCircuit: true }
        ],
        'import/prefer-default-export': 'off',
        'no-empty-function': 'off',
        'prefer-object-spread': 'off',
        'lines-between-class-members': [
            'error',
            'always',
            { exceptAfterSingleLine: true }
        ],
        // react preferences
        'react/require-default-props': 'off',
        'react/jsx-filename-extension': [2, { extensions: ['.jsx', '.tsx'] }],
        'react/forbid-prop-types': 'off',
        'react/prop-types': [2, { skipUndeclared: true, ignore: ['children'] }],
        'react/no-array-index-key': 'off',
        'react/destructuring-assignment': 'off'
    }
};
