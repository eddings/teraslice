import { Logger } from '@terascope/utils';
import { UtilsTranslateQueryOptions, AnyQuery, AnyQuerySort } from '../translator/interfaces';
import {
    GeoPoint,
    GeoDistanceUnit,
    TypeConfig,
    FieldType,
    Variables
} from '../interfaces';

export interface ParserOptions {
    type_config?: TypeConfig;
    logger?: Logger;
    variables?: Variables;
}

export type AST = EmptyAST & LogicalGroup & Term
& Conjunction & Negation & FieldGroup
& Exists & Range & GeoDistance
& GeoBoundingBox & Regexp & Wildcard & FunctionNode;

export type AnyAST = EmptyAST | LogicalGroup | Term
| Conjunction | Negation | FieldGroup
| Exists | Range | GeoDistance
| GeoBoundingBox | Regexp | Wildcard | FunctionNode;

export type GroupLike = FieldGroup|LogicalGroup;
export type GroupLikeType = ASTType.LogicalGroup|ASTType.FieldGroup;

export interface GroupLikeAST {
    type: GroupLikeType;
    flow: Conjunction[];
}

export type TermLike = Term|Regexp|Range|Wildcard|GeoBoundingBox|GeoDistance|FunctionNode;
export type TermLikeType =
    ASTType.Term|
    ASTType.Regexp|
    ASTType.Range|
    ASTType.Wildcard|
    ASTType.GeoBoundingBox|
    ASTType.GeoDistance|
    ASTType.Function

export interface TermLikeAST {
    type: TermLikeType;
    field: Field;
    tokenizer?: boolean;
}

export enum ASTType {
    LogicalGroup = 'logical-group',
    FieldGroup = 'field-group',
    Conjunction = 'conjunction',
    Negation = 'negation',
    Term = 'term',
    Exists = 'exists',
    Range = 'range',
    GeoDistance = 'geo-distance',
    GeoBoundingBox = 'geo-bounding-box',
    Regexp = 'regexp',
    Wildcard = 'wildcard',
    Empty = 'empty',
    Function = 'function'
}

export interface EmptyAST {
    type: ASTType.Empty;
}

export type Field = string|null;

export interface AnyDataType {
    /**
     * The field type here may be the field type specified
     * in the type_config
    */
    field_type: FieldType;
    value: string|number|boolean|any;
}

export interface NumberDataType {
    field_type: FieldType.Integer|FieldType.Float;
    value: number;
}

export interface StringDataType {
    field_type: FieldType.String;
    value: string;
    quoted: boolean;
    restricted?: boolean;
}

export interface BooleanDataType {
    field_type: FieldType.Boolean;
    value: boolean;
}

export interface LogicalGroup extends GroupLikeAST {
    type: ASTType.LogicalGroup;
}

export interface Conjunction {
    type: ASTType.Conjunction;
    nodes: AST[];
}

export interface Negation {
    type: ASTType.Negation;
    node: AST;
}

export interface FieldGroup extends GroupLikeAST {
    type: ASTType.FieldGroup;
    field: string;
}

export interface Exists {
    type: ASTType.Exists;
    field: string;
}

export type RangeOperator = 'gte'|'gt'|'lt'|'lte';
export interface Range extends TermLikeAST {
    type: ASTType.Range;
    field_type: FieldType;
    left: RangeNode;
    right?: RangeNode;
}

export interface RangeNode extends NumberDataType {
    operator: RangeOperator;
}

export interface GeoDistance extends GeoPoint, TermLikeAST {
    type: ASTType.GeoDistance;
    field_type: FieldType.Geo;
    distance: number;
    unit: GeoDistanceUnit;
}

export interface GeoBoundingBox extends TermLikeAST {
    type: ASTType.GeoBoundingBox;
    field_type: FieldType.Geo;
    top_left: GeoPoint;
    bottom_right: GeoPoint;
}

export interface FunctionNode extends TermLikeAST {
    type: ASTType.Function;
    name: string;
    description?: string;
    instance: FunctionMethods;
}

export interface Regexp extends StringDataType, TermLikeAST {
    type: ASTType.Regexp;
}

export interface Wildcard extends StringDataType, TermLikeAST {
    type: ASTType.Wildcard;
}

export interface Term extends AnyDataType, TermLikeAST {
    type: ASTType.Term;
}

export interface FunctionConfig {
    logger: Logger;
    typeConfig: TypeConfig;
}

export interface FunctionDefinition {
    version: string;
    name: string;
    create: (
        field: string,
        params: any,
        config: FunctionConfig
    ) => FunctionMethods;
}

export interface FunctionMethodsResults {
    query: AnyQuery;
    sort?: AnyQuerySort;
}

export interface FunctionMethods {
    match(arg: any): boolean;
    toElasticsearchQuery(
        field: string,
        options: UtilsTranslateQueryOptions
    ): FunctionMethodsResults;
}
