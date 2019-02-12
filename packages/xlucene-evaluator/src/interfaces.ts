
import { Units } from '@turf/helpers';
import { TypeMapping } from './document-matcher/type-manager/types';

export type ImplicitField = '<implicit>';

export type NodeType = 'date'|'ip'|'geo'|'string'|'number'|'boolean'|'operator'|'exists';

export interface TypeConfig {
    [field: string]: keyof TypeMapping;
}

export type AST = RangeAST & IpAST
    & OperatorAST & GeoAST & NumberAST
    & StringAST & WildcardAST & RegexpAST
    & ExistsAST;

interface BaseAST {
    type: NodeType;
}

export interface OperatorAST extends BaseAST {
    type: 'operator';

    left: AST;
    right?: AST;
    operator: 'AND'|'OR'|'NOT'|'AND NOT';
    parens?: boolean;
}

interface BaseFieldAST extends BaseAST {
    field: string|ImplicitField;
}

interface BaseRangeAST extends BaseFieldAST {
    term_min: string|number;
    term_max: string|number;

    inclusive_min: boolean;
    inclusive_max: boolean;
}

export interface RangeAST extends BaseRangeAST {
    type: 'string'|'number'|'date';
}

export interface IpAST extends BaseRangeAST {
    type: 'ip';
    term_min: string;
    term_max: string;

    inclusive_min: boolean;
    inclusive_max: boolean;
}

export interface ExistsAST extends BaseFieldAST {
    type: 'exists';
}

export interface StringAST extends BaseFieldAST {
    type: 'string';

    term: string;
    regexpr: boolean;
    wildcard: boolean;
}

export interface NumberAST extends BaseFieldAST {
    type: 'number';

    term: number;
}

export interface RegexpAST extends StringAST {
    term: string;
    regexpr: true;
}

export interface WildcardAST extends StringAST {
    term: string;
    wildcard: true;
}

export interface GeoAST extends BaseFieldAST {
    type: 'geo';

    geo_distance?: string;
    geo_point?: string;
    geo_box_top_left?: string;
    geo_box_bottom_right?: string;
}

export interface AstCallback {
    (node: AST, _field: string, depth: number): void;
}

export interface GeoResults {
    geoField: string;
    geoBoxTopLeft?: string;
    geoBoxBottomRight?: string;
    geoPoint?: string;
    geoDistance?: string;
}

export interface GeoDistance {
    distance: number;
    unit: Units;
}

export type GeoPointArr = [number, number];
export type GeoPointStr = string;
export type GeoObjShort = {lat: string | number, lon: string | number};
export type GeoObjLong = {latitude: string | number, longitude: string | number};
export type GeoPoint = GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong;
export type DateInput = string | number;

export interface PegEngine {
    parse(input: string): AST;
}
