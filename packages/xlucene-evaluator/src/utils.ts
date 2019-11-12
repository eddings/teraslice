import geoHash from 'latlon-geohash';
import {
    trim,
    toNumber,
    isPlainObject,
    parseNumberList,
    isNumber,
    AnyObject,
    escapeString,
    uniq,
    withoutNil
} from '@terascope/utils';
import { Range } from './parser/interfaces';
import {
    GeoDistanceObj,
    GeoPointInput,
    GeoPoint,
    GeoDistanceUnit,
    JoinBy,
    TypeConfig,
    FieldType,
    CoordinateTuple,
    GeoShape,
    GeoShapeType,
    GeoShapePoint,
    GeoShapePolygon,
    GeoShapeMultiPolygon,
    GeoShapeRelation
} from './interfaces';
import { ESGeoShapeType, ESGeoShape } from './translator/interfaces';


export function isInfiniteValue(input?: number|string) {
    return input === '*' || input === Number.NEGATIVE_INFINITY || input === Number.POSITIVE_INFINITY;
}

export function isInfiniteMin(min?: number|string) {
    if (min == null) return false;
    return min === '*' || min === Number.NEGATIVE_INFINITY;
}

export function isInfiniteMax(max?: number|string) {
    if (max == null) return false;
    return max === '*' || max === Number.POSITIVE_INFINITY;
}

export interface ParsedRange {
    'gte'?: number|string;
    'gt'?: number|string;
    'lte'?: number|string;
    'lt'?: number|string;
}

export function parseRange(node: Range, excludeInfinite = false): ParsedRange {
    const results = {};

    if (!excludeInfinite || !isInfiniteValue(node.left.value)) {
        results[node.left.operator] = node.left.value;
    }

    if (node.right) {
        if (!excludeInfinite || !isInfiniteValue(node.right.value)) {
            results[node.right.operator] = node.right.value;
        }
    }
    return results;
}

export const GEO_DISTANCE_UNITS: { readonly [key: string]: GeoDistanceUnit } = {
    mi: 'miles',
    miles: 'miles',
    mile: 'miles',
    NM: 'nauticalmiles',
    nmi: 'nauticalmiles',
    nauticalmile: 'nauticalmiles',
    nauticalmiles: 'nauticalmiles',
    in: 'inch',
    inch: 'inch',
    inches: 'inch',
    yd: 'yards',
    yard: 'yards',
    yards: 'yards',
    m: 'meters',
    meter: 'meters',
    meters: 'meters',
    km: 'kilometers',
    kilometer: 'kilometers',
    kilometers: 'kilometers',
    mm: 'millimeters',
    millimeter: 'millimeters',
    millimeters: 'millimeters',
    cm: 'centimeters',
    centimeter: 'centimeters',
    centimeters: 'centimeters',
    ft: 'feet',
    feet: 'feet',
};

export function parseGeoDistance(str: string): GeoDistanceObj {
    const matches = trim(str).match(/(\d+)(.*)$/);

    if (!matches || !matches.length) {
        throw new Error(`Incorrect geo distance parameter provided: ${str}`);
    }

    const distance = Number(matches[1]);
    const unit = parseGeoDistanceUnit(matches[2]);

    return { distance, unit };
}

export function parseGeoDistanceUnit(input: string): GeoDistanceUnit {
    const unit = GEO_DISTANCE_UNITS[trim(input)];
    if (!unit) {
        throw new Error(`Incorrect distance unit provided: ${input}`);
    }
    return unit;
}

/** @returns {[lat, lon]} */
export function getLonAndLat(input: any, throwInvalid = true): [number, number] {
    let lat = input.lat || input.latitude;
    let lon = input.lon || input.longitude;

    if (throwInvalid && (!lat || !lon)) {
        throw new Error('geopoint must contain keys lat,lon or latitude/longitude');
    }

    lat = toNumber(lat);
    lon = toNumber(lon);
    if (throwInvalid && (!isNumber(lat) || !isNumber(lon))) {
        throw new Error('geopoint lat and lon must be numbers');
    }

    return [lat, lon];
}

export function parseGeoPoint(point: GeoPointInput): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: true): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: false): GeoPoint | null;
export function parseGeoPoint(point: GeoPointInput, throwInvalid = true): GeoPoint | null {
    let results = null;

    if (typeof point === 'string') {
        if (point.match(',')) {
            results = parseNumberList(point);
        } else {
            try {
                results = Object.values(geoHash.decode(point));
            } catch (err) {
                // do nothing
            }
        }
    } else if (Array.isArray(point)) {
        results = parseNumberList(point);
    } else if (isPlainObject(point)) {
        results = getLonAndLat(point, throwInvalid);
    }

    if (throwInvalid && (!results || results.length !== 2)) {
        throw new Error(`incorrect point given to parse, point:${point}`);
    }

    // data incoming is lat,lon and we must return lon,lat
    if (results) {
        return {
            lat: results[0],
            lon: results[1],
        };
    }
    return null;
}

export type CreateJoinQueryOptions = {
    typeConfig?: TypeConfig;
    fieldParams?: Record<string, string>;
    joinBy?: JoinBy;
    arrayJoinBy?: JoinBy;
};

function isGeoJSONData(input: any): input is GeoShape {
    return input.coordinates != null
        && Array.isArray(input.coordinates)
        && input.type != null;
}

type JoinGeoShape = GeoShape | ESGeoShape;

const relationList = Object.values(GeoShapeRelation);

// TODO: change all FieldType.Geo to FieldType.GeoPoint

function makeXluceneGeoDistanceQuery(field: string, value: GeoPointInput, fieldParam?: string) {
    const distance = fieldParam ? escapeValue(fieldParam) : '"100m"';
    const results = parseGeoPoint(value, false);
    if (!results) return '';
    const { lat, lon } = results;
    return `${field}:geoDistance(point:"${lat},${lon}" distance:${distance})`;
}

function makeXlucenePolyContainsPoint(field: string, value: GeoPointInput) {
    const results = parseGeoPoint(value, false);
    if (!results) return '';
    const { lat, lon } = results;
    return `${field}:geoContainsPoint(point:"${lat},${lon}")`;
}

function coordinateToXlucene(cord: CoordinateTuple) {
    // tuple is [lon, lat], need to return "lat, lon"
    return `"${cord[1]}, ${cord[0]}"`;
}

function wrap(arr: any[]) {
    return `[${arr}]`;
}

function makeList(list: any[]) {
    return wrap(list.map(coordinateToXlucene));
}

function makeXlucenePolyQuery(field: string, value: CoordinateTuple[][], fieldParam?: string) {
    let points: string;
    // there there is more than one, the other polygons listed are holes
    if (value.length > 1) {
        points = wrap(value.map(makeList));
    } else {
        points = makeList(value[0]);
    }
    if (fieldParam && relationList.includes(fieldParam as GeoShapeRelation)) return `${field}:geoPolygon(points:${points} relation: "${fieldParam}")`;
    return `${field}:geoPolygon(points:${points})`;
}

function isGeoShapePoint(shape: JoinGeoShape): shape is GeoShapePoint {
    return shape.type === GeoShapeType.Point || shape.type === ESGeoShapeType.Point;
}

function isGeoShapePolygon(shape: JoinGeoShape): shape is GeoShapePolygon {
    return shape.type === GeoShapeType.Polygon || shape.type === ESGeoShapeType.Polygon;
}

function isGeoShapeMultiPolygon(shape: JoinGeoShape): shape is GeoShapeMultiPolygon {
    return shape.type === GeoShapeType.MultiPolygon || shape.type === ESGeoShapeType.MultiPolygon;
}

function createGeoQuery(field: string, value: any, targetType: FieldType, fieldParam?: string) {
    if (isGeoPointType(targetType)) {
        if (isGeoJSONData(value)) {
            if (isGeoShapePolygon(value)) {
                return makeXlucenePolyQuery(field, value.coordinates, fieldParam);
            }

            if (isGeoShapeMultiPolygon(value)) {
                return value.coordinates.map((coordinates) => makeXlucenePolyQuery(field, coordinates, fieldParam)).join(' OR ');
            }

            if (isGeoShapePoint(value)) {
                // geoShape point is [lon, lat] need to return [lat, lon]
                const data = [value.coordinates[1], value.coordinates[0]];
                return makeXluceneGeoDistanceQuery(field, data, fieldParam);
            }
            // We do not support any other geoJSON types;
            return '';
        }
        // incoming value is a geo-point and we compare to another geo-point by geoDistance query
        return makeXluceneGeoDistanceQuery(field, value, fieldParam);
    }

    if (isGeoJSONType(targetType)) {
        if (isGeoShapePolygon(value)) {
            return makeXlucenePolyQuery(field, value.coordinates, fieldParam);
        }

        if (isGeoShapeMultiPolygon(value)) {
            return value.coordinates.map((coordinates) => makeXlucenePolyQuery(field, coordinates, fieldParam)).join(' OR ');
        }

        if (isGeoShapePoint(value)) {
            // geoShape point is [lon, lat] need to return [lat, lon]
            const data = [value.coordinates[1], value.coordinates[0]];
            return makeXlucenePolyContainsPoint(field, data);
        }
        return makeXlucenePolyContainsPoint(field, value);
    }
    // Not valid geo join, return empty string
    return '';
}

function isGeoQuery(type: FieldType) {
    return isGeoPointType(type) || isGeoJSONType(type);
}

function isGeoPointType(type: FieldType) {
    return type === FieldType.Geo || type === FieldType.GeoPoint;
}

function isGeoJSONType(type: FieldType) {
    return type === FieldType.GeoJSON;
}

export function createJoinQuery(input: AnyObject, options: CreateJoinQueryOptions = {}): string {
    const {
        fieldParams = {},
        joinBy = 'AND',
        arrayJoinBy = 'AND',
        typeConfig = {}
    } = options;

    const obj = withoutNil(input);
    if (!Object.keys(obj).length) return '';

    return Object.entries(obj)
        .map(([field, val]) => {
            let value: string;

            if (isGeoQuery(typeConfig[field])) {
                return createGeoQuery(field, val, typeConfig[field], fieldParams[field]);
            }

            if (Array.isArray(val)) {
                if (val.length > 1) {
                    value = `(${uniq(val)
                        .map(escapeValue)
                        .join(` ${arrayJoinBy} `)})`;
                } else {
                    value = escapeValue(val);
                }
            } else {
                value = escapeValue(val);
            }
            return `${field}: ${value}`;
        })
        .join(` ${joinBy} `)
        .trim();
}

function escapeValue(val: any) {
    return `"${escapeString(val)}"`;
}
