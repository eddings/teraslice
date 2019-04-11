import { toNumber } from 'lodash';
import { trimAndToLower, isPlainObject, parseNumberList } from '@terascope/utils';
import geoHash from 'latlon-geohash';
import { path, any, values } from 'rambda';
import { GeoDistance, GeoPoint, BooleanCB } from './interfaces';
import { Range } from './parser';
import { isWildCard, findWildcardField } from './document-matcher/logic-builder/string';

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

export interface ParseNodeRangeResult {
    'gte'?: number|string;
    'gt'?: number|string;
    'lte'?: number|string;
    'lt'?: number|string;
}

export function parseRange(node: Range, excludeInfinite = false): ParseNodeRangeResult {
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

export function checkValue(field: string|undefined, cb: BooleanCB) {
    if (field && isWildCard(field)) {
        return findWildcardField(field, cb);
    }
    return (obj: any) => {
        let data;
        if (field) {
            data = path(field, obj);
        } else {
            data = values(obj);
        }

        if (Array.isArray(data)) {
            return any(cb, data);
        }
        return cb(data);
    };
}

export function parseGeoDistance(str: string): GeoDistance {
    const trimed = trimAndToLower(str);
    const matches = trimed.match(/(\d+)(.*)$/);
    if (!matches || !matches.length) {
        throw new Error(`Incorrect geo distance parameter provided: ${str}`);
    }

    const distance = Number(matches[1]);
    const unit = GEO_DISTANCE_UNITS[matches[2]];
    if (!unit) {
        throw new Error(`Incorrect distance unit provided: ${matches[2]}`);
    }

    return { distance, unit };
}

export function getLonAndLat(input: any, throwInvalid = true): [number, number] {
    const lat = input.lat || input.latitude;
    const lon = input.lon || input.longitude;

    if (throwInvalid && (!lat || !lon)) {
        throw new Error('geopoint must contain keys lat,lon or latitude/longitude');
    }

    return [toNumber(lat), toNumber(lon)];
}

export function parseGeoPoint(point: GeoPoint | number[] | object): number[];
export function parseGeoPoint(point: GeoPoint | number[] | object, throwInvalid: true): number[];
export function parseGeoPoint(point: GeoPoint | number[] | object, throwInvalid: false): number[] | null;
export function parseGeoPoint(point: GeoPoint | number[] | object, throwInvalid = true): number[] | null {
    let results = null;

    if (typeof point === 'string') {
        if (point.match(',')) {
            results = parseNumberList(point);
        } else {
            try {
                results = Object.values(geoHash.decode(point));
            } catch (err) {}
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
    if (results) return results.reverse();
    return results;
}

const mileUnits = {
    mi: 'miles',
    miles: 'miles',
    mile: 'miles',
};

const nmileUnits = {
    NM:'nauticalmiles',
    nmi: 'nauticalmiles',
    nauticalmile: 'nauticalmiles',
    nauticalmiles: 'nauticalmiles'
};

const inchUnits = {
    in: 'inches',
    inch: 'inches',
    inches: 'inches'
};

const yardUnits = {
    yd: 'yards',
    yard: 'yards',
    yards: 'yards'
};

const meterUnits = {
    m: 'meters',
    meter: 'meters',
    meters: 'meters'
};

const kilometerUnits = {
    km: 'kilometers',
    kilometer: 'kilometers',
    kilometers: 'kilometers'
};

const millimeterUnits = {
    mm: 'millimeters',
    millimeter: 'millimeters',
    millimeters: 'millimeters'
};

const centimetersUnits = {
    cm: 'centimeters',
    centimeter: 'centimeters',
    centimeters: 'centimeters'
};

const feetUnits = {
    ft: 'feet',
    feet: 'feet'
};

export const GEO_DISTANCE_UNITS = {
    ...mileUnits,
    ...nmileUnits,
    ...inchUnits,
    ...yardUnits,
    ...meterUnits,
    ...kilometerUnits,
    ...millimeterUnits,
    ...centimetersUnits,
    ...feetUnits
};
