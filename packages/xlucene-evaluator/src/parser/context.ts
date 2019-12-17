import { Logger, TSError, isPlainObject } from '@terascope/utils';
import { parseGeoDistance, parseGeoPoint } from '../utils';
import * as i from './interfaces';
import * as utils from './utils';
import xluceneFunctions from './functions';
import { TypeConfig, FieldType, Variables } from '../interfaces';

export default function makeContext(args: any) {
    let typeConfig: TypeConfig;
    let variables: Variables;

    let logger: Logger;
    // eslint-disable-next-line
    ({ typeConfig = {}, variables = {}, logger } = args);
    if (!typeConfig || !logger) {
        throw new Error('Peg Engine given invalid context');
    }

    /**
    * Propagate the default field on a field group expression
    */
    function propagateDefaultField(node: i.AnyAST, field: string): void {
        if (!node) return;

        if (utils.isTermType(node) && !node.field) {
            node.field = field;
            coerceTermType(node);
            return;
        }

        if (utils.isNegation(node)) {
            propagateDefaultField(node.node, field);
            return;
        }

        if (utils.isGroupLike(node)) {
            for (const conj of node.flow) {
                propagateDefaultField(conj, field);
            }
            return;
        }

        if (utils.isConjunction(node)) {
            for (const conj of node.nodes) {
                propagateDefaultField(conj, field);
            }
        }
    }

    // The following functions are javascript functions and not
    // peg grammar because this is based off configuration passed
    // in and cannot be inferred by the syntax

    function getFieldType(field: string): FieldType|undefined {
        if (!field) return;
        return typeConfig[field];
    }

    function getVariable(value: string) {
        const variable = variables[value];
        if (variable === undefined) throw new TSError(`could not find a variable set with key "${value}"`);
        if (Array.isArray(variable)) return variable.slice();
        return variable;
    }

    const inferredFieldTypes = [FieldType.String];
    function isInferredTermType(field: string): boolean {
        const fieldType = getFieldType(field);
        if (!fieldType) return false;
        return inferredFieldTypes.includes(fieldType);
    }

    // parse an inferred field type
    function parseInferredTermType(field: string, value: any): i.TermLikeAST {
        const fieldType = getFieldType(field);
        const term: any = {
            type: i.ASTType.Term,
            field_type: fieldType,
        };

        if (fieldType === FieldType.String) {
            term.quoted = false;
            term.value = `${value}`;
            return term;
        }

        logger.warn(`Unsupported field inferred field type ${fieldType} for field ${field}`);
        term.value = value;
        return term;
    }

    function parseFunction(field: string, name: string, params: i.Term[]) {
        // TODO: get better types name
        const fnType = xluceneFunctions[name];
        if (fnType == null) throw new Error(`Could not find an xlucene function with name "${name}"`);
        return fnType.create(field, params, { logger, typeConfig });
    }

    function makeFlow(field: string, values: any[]) {
        return values.map((value) => {
            const node = { field, type: i.ASTType.Term, value };
            coerceTermType(node);
            // this creates an OR statement
            return {
                type: i.ASTType.Conjunction,
                nodes: [node]
            };
        });
    }

    function coerceTermType(node: any, _field?: string) {
        if (!node) return;
        const field = node.field || _field;
        if (!field) return;

        const fieldType = getFieldType(field);
        if (fieldType === node.field_type) return;
        logger.trace(
            `coercing field "${field}":${node.value} type of ${node.field_type} to ${fieldType}`
        );

        // in the case of tokenized fields we should update the
        // node to indicate so non-term level queries can be performed
        if (utils.isTermType(node) && field.includes('.') && !typeConfig[field]) {
            const parentField = field.split('.').slice(0, -1);
            if (typeConfig[parentField] && typeConfig[parentField] !== FieldType.Object) {
                node.tokenizer = parentField;
            }
        }

        if (fieldType === FieldType.Boolean) {
            node.field_type = fieldType;
            delete node.quoted;
            delete node.restricted;
            if (node.value === 'true') {
                node.value = true;
            }
            if (node.value === 'false') {
                node.value = false;
            }
            return;
        }

        if (fieldType === FieldType.Integer) {
            node.field_type = fieldType;
            delete node.quoted;
            delete node.restricted;
            node.value = parseInt(node.value, 10);
            return;
        }

        if (fieldType === FieldType.Float) {
            node.field_type = fieldType;
            delete node.quoted;
            delete node.restricted;
            node.value = parseFloat(node.value);
            return;
        }

        if (fieldType === FieldType.String) {
            node.field_type = fieldType;
            node.quoted = false;
            node.value = `${node.value}`;
        }
    }

    return {
        logger,
        parseGeoPoint,
        parseGeoDistance,
        coerceTermType,
        parseInferredTermType,
        isInferredTermType,
        propagateDefaultField,
        parseFunction,
        getVariable,
        makeFlow,
        isPlainObject
    };
}
