import * as ts from '@terascope/utils';
import ipaddr from 'ipaddr.js';
import { isIP as checkIP, isIPv6 } from 'net';
// @ts-ignore
import ip6addr from 'ip6addr';
import validateCidr from 'is-cidr';
import PhoneValidator from 'awesome-phonenumber';
import validator from 'validator';
import * as url from 'valid-url';
import { MACAddress } from '@terascope/types';

import {
    FQDNOptions,
    HashConfig,
    LengthConfig,
    PostalCodeLocale,
    ArgsISSNOptions,
} from './interfaces';

import * as i from '../interfaces';

export const repository: i.Repository = {
    isBoolean: { fn: isBoolean, config: {} },
    isBooleanLike: { fn: isBooleanLike, config: {} },
    isEmail: { fn: isEmail, config: {} },
    isGeoJSON: { fn: isGeoJSON, config: {} },
    isGeoPoint: { fn: isGeoPoint, config: {} },
    isGeoShapePoint: { fn: isGeoShapePoint, config: {} },
    isGeoShapePolygon: { fn: isGeoShapePolygon, config: {} },
    isGeoShapeMultiPolygon: { fn: isGeoShapeMultiPolygon, config: {} },
    isIP: { fn: isIP, config: {} },
    isISDN: { fn: isISDN, config: {} },
    isMACAddress: {
        fn: isMACAddress,
        config: {
            delimiter: { type: 'String', array: true }
        },

    },
    isNumber: { fn: isNumber, config: {} },
    isInteger: { fn: isInteger, config: {} },
    inNumberRange: {
        fn: inNumberRange,
        config: {
            min: { type: 'Number' },
            max: { type: 'Number' },
            inclusive: { type: 'Boolean' }
        },

    },
    isString: { fn: isString, config: {} },
    isURL: { fn: isURL, config: {} },
    isUUID: { fn: isUUID, config: {} },
    contains: {
        fn: contains,
        config: {
            value: { type: 'String' }
        },

    },
    equals: {
        fn: equals,
        config: { value: { type: 'String' } },

    },
    isAlpha: {
        fn: isAlpha,
        config: {
            locale: { type: 'String' }
        },

    },
    isAlphanumeric: {
        fn: isAlphanumeric,
        config: {
            locale: { type: 'String' }
        },

    },
    isASCII: { fn: isASCII, config: {} },
    isBase64: { fn: isBase64, config: {} },
    isEmpty: {
        fn: isEmpty,
        config: {
            ignoreWhitespace: { type: 'Boolean' }
        },

    },
    isFQDN: {
        fn: isFQDN,
        config: {
            requireTld: { type: 'Boolean' },
            allowUnderscores: { type: 'Boolean' },
            allowTrailingDot: { type: 'Boolean' },
        },

    },
    isHash: {
        fn: isHash,
        config: {
            algo: { type: 'String' }
        },

    },
    isCountryCode: { fn: isCountryCode, config: {} },
    isISO8601: { fn: isISO8601, config: {} },
    isISSN: {
        fn: isISSN,
        config: {
            caseSensitive: { type: 'Boolean' },
            requireHyphen: { type: 'Boolean' }
        },

    },
    isRFC3339: { fn: isRFC3339, config: {} },
    isJSON: { fn: isJSON, config: {} },
    isLength: {
        fn: isLength,
        config: {
            size: { type: 'Number' },
            min: { type: 'Number' },
            max: { type: 'Number' },
        },

    },
    isMIMEType: { fn: isMIMEType, config: {} },
    isPostalCode: {
        fn: isPostalCode,
        config: {
            locale: { type: 'String' }
        },

    },
    isRoutableIP: { fn: isRoutableIP, config: {} },
    isNonRoutableIP: { fn: isNonRoutableIP, config: {} },
    inIPRange: {
        fn: inIPRange,
        config: {
            min: { type: 'String' },
            max: { type: 'String' },
            cidr: { type: 'String' }
        },

    },
    isCIDR: { fn: isCIDR, config: {} },
    exists: { fn: exists, config: {} },
    guard: { fn: guard, config: {} },
    isArray: { fn: isArray, config: {} },
    some: {
        fn: some,
        config: {
            fn: { type: 'String' },
            options: { type: 'Object' }
        }
    },
    every: {
        fn: every,
        config: {
            fn: { type: 'String' },
            options: { type: 'Object' }
        }
    },
};

function _lift(fn: any, input: any[], args?: any) {
    const sanitized = input.filter(ts.isNotNil);
    if (sanitized.length === 0) return false;

    return sanitized.every((data) => fn(data, args));
}

/**
 * Checks to see if input is a boolean.
 * If given an array, will check if all values are booleans
 *
 * @example
 * expect(FieldValidator.isBoolean('true')).toEqual(false);
 * expect(FieldValidator.isBoolean(false)).toEqual(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isBoolean(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isBoolean, input);

    return ts.isBoolean(input);
}

/**
 * Checks to see if input is a boolean-like value. If an given an array, it will check
 * to see if all values in the array are boolean-like, does NOT ignore null/undefined values
 *
 * @example
 * expect(FieldValidator.isBooleanLike()).toEqual(true);
 * expect(FieldValidator.isBooleanLike(null)).toEqual(true);
 * expect(FieldValidator.isBooleanLike(0)).toEqual(true);
 * expect(FieldValidator.isBooleanLike('0')).toEqual(true);
 * expect(FieldValidator.isBooleanLike('false')).toEqual(true);
 * expect(FieldValidator.isBooleanLike('no')).toEqual(true);
 * expect(FieldValidator.isBooleanLike(['no', '0', null])).toEqual(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isBooleanLike(input: any): boolean {
    if (isArray(input)) return input.every(ts.isBooleanLike);

    return ts.isBooleanLike(input);
}

/**
 * Return true if value is a valid email, or a list of valid emails
 *
 * @example
 * FieldValidator.isEmail('ha3ke5@pawnage.com') === true
 * FieldValidator.isEmail('user@blah.com/junk.junk?a=<tag value="junk"') === true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isEmail(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isEmail, input);

    return ts.isEmail(input);
}

/**
 * Checks to see if input is a valid geo-point, or a list of valid geo-points
 * excluding null/undefined values
 *
 * @example
 * expect(FieldValidator.isGeoPoint('60,80')).toEqual(true);
 * expect(FieldValidator.isGeoPoint([80, 60])).toEqual(true);
 * expect(FieldValidator.isGeoPoint({ lat: 60, lon: 80 })).toEqual(true);
 * expect(FieldValidator.isGeoPoint({ latitude: 60, longitude: 80 })).toEqual(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isGeoPoint(input: any) {
    if (ts.isNil(input)) return false;

    if (isArray(input) && !isNumberTuple(input)) {
        return _lift(ts.parseGeoPoint, input, false);
    }

    // TODO: check for tuple vs an array of numbers
    const results = ts.parseGeoPoint(input, false);
    return results != null;
}

/**
 * Checks to see if input is a valid geo-json geometry, or a list of geo-json geometeries
 *
 * @example
 * expect(FieldValidator.isGeoJSON('hello')).toEqual(false);
 *
 * const polygon = {
 *   type: "Polygon",
 *   coordinates: [
 *       [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *   ]
 * };
 * expect(FieldValidator.isGeoJSON(polygon)).toEqual(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isGeoJSON(input: any) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isGeoJSON, input);

    return ts.isGeoJSON(input);
}

/**
 * Checks to see if input is a valid geo-json point, or a list of geo-json points
 * @example
 * expect(FieldValidator.isGeoShapePoint(3)).toEqual(false);
 *
 * const matchingPoint = {
 *   type: 'Point',
 *   coordinates: [12, 12]
 * };
 * expect(FieldValidator.isGeoShapePoint(matchingPoint)).toEqual(true);
 *
 * @param {JoinGeoShape} input
 * @returns {boolean} boolean
 */

export function isGeoShapePoint(input: any) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isGeoShapePoint, input);

    return ts.isGeoShapePoint(input);
}

/**
 * Checks to see if input is a valid geo-json polygon or a list of geo-json polygons
 * @example
 * expect(FieldValidator.isGeoShapePolygon(3)).toEqual(false);
 *
 * const polygon = {
 *   type: 'Polygon',
 *   coordinates: [
 *       [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *   ]
 * };
 * expect(FieldValidator.isGeoShapePolygon(matchingPoint)).toEqual(true);
 *
 * @param {JoinGeoShape} input
 * @returns {boolean} boolean
 */

export function isGeoShapePolygon(input: any) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isGeoShapePolygon, input);

    return ts.isGeoShapePolygon(input);
}

/**
 * Checks to see if input is a valid geo-json multipolygon or a list of geo-json multipolygons
 * @example
 * expect(FieldValidator.isGeoShapeMultiPolygon(3)).toEqual(false);
 *
 * const multiPolygon = {
 *   type: 'MultiPolygon',
 *   coordinates: [
 *       [
 *           [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *       ],
 *       [
 *           [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
 *       ]
 *   ]
 * };
 * expect(FieldValidator.isGeoShapeMultiPolygon(multiPolygon)).toEqual(true);
 *
 * @param {JoinGeoShape} input
 * @returns {boolean} boolean
 */

export function isGeoShapeMultiPolygon(input: any) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isGeoShapeMultiPolygon, input);

    return ts.isGeoShapeMultiPolygon(input);
}

/**
 * Validates that the input is an IP address, or a list of IP addresses
 *
 * @example
 * expect(FieldValidator.isIP('8.8.8.8')).toBe(true);
 * expect(FieldValidator.isIP('192.172.1.18')).toBe(true);
 * expect(FieldValidator.isIP('11.0.1.18')).toBe(true);
 * expect(FieldValidator.isIP('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
 * expect(FieldValidator.isIP('fe80::1ff:fe23:4567:890a%eth2')).toBe(true);
 * expect(FieldValidator.isIP('2001:DB8::1')).toBe(true);
 * expect(FieldValidator.isIP('172.16.0.1')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isIP(input: any) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(_isIp, input);

    return _isIp(input);
}

function _isIp(input: any) {
    if (checkIP(input) === 0) return false;

    // needed to check for inputs like - '::192.168.1.18'
    if (input.includes(':') && input.includes('.')) return false;

    return true;
}

/**
 * Validate is input is a routable IP, or a list of routable IP's
 *
 * @example
 * expect(FieldValidator.isRoutableIP('192.168.0.1')).toBe(false);
 * expect(FieldValidator.isRoutableIP('2001:db8::1')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isRoutableIP(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(_isRoutableIP, input);

    return _isRoutableIP(input);
}

function _isRoutableIP(input: any): boolean {
    if (!isIP(input)) return false;

    const range = ipaddr.parse(input).range();
    return range !== 'private' && range !== 'uniqueLocal';
}

/**
 * Validate is input is a non-routable IP, or a list of non-routable IP's
 * @example
 * expect(FieldValidator.isRoutableIP('192.168.0.1')).toBe(true);
 * expect(FieldValidator.isRoutableIP('2001:db8::1')).toBe(false);
 *
 * @param {*} input
 * @returns { boolean } boolean
 */

export function isNonRoutableIP(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(_isNonRoutableIP, input);

    return _isNonRoutableIP(input);
}

function _isNonRoutableIP(input: any): boolean {
    if (!isIP(input)) return false;

    const range = ipaddr.parse(input).range();
    return range === 'private' || range === 'uniqueLocal';
}

/**
 * Validates that input is a cidr or a list of cidr values
 *
 * @example
 * expect(FieldValidator.isIPCidr('8.8.0.0/12')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isCIDR(input: any) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(_isCidr, input);

    return _isCidr(input);
}

function _isCidr(input: any): boolean {
    return validateCidr(input) > 0;
}

/**
 * Validates if the input is within a given range of IP's
 * @example
 * expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.0', max: '8.8.8.64' })).toBe(true);
 * expect(FieldValidator.inIPRange('8.8.8.8', { max: '8.8.8.64' })).toBe(true);
 * expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.0' })).toBe(true);
 *
 * @param {*} input
 * @param {{ min?: string; max?: string; cidr?: string }} args
 * @returns {boolean} boolean
 */

export function inIPRange(input: any, args: { min?: string; max?: string; cidr?: string }) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(_inIPRange, input, args);

    return _inIPRange(input, args);
}

function _inIPRange(input: any, args: { min?: string; max?: string; cidr?: string }) {
    const MIN_IPV4_IP = '0.0.0.0';
    const MAX_IPV4_IP = '255.255.255.255';
    const MIN_IPV6_IP = '::';
    const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

    if (!isIP(input)) return false;

    // assign min/max IP range values
    if (args.cidr) {
        if (!isCIDR(args.cidr)) return false;
        return ip6addr.createCIDR(args.cidr).contains(input);
    }

    // assign upper/lower bound even if min or max is missing
    let { min, max } = args;
    if (!min) min = isIPv6(input) ? MIN_IPV6_IP : MIN_IPV4_IP;
    if (!max) max = isIPv6(input) ? MAX_IPV6_IP : MAX_IPV4_IP;

    // min and max must be valid ips, same IP type, and min < max
    if (!isIP(min) || !isIP(max) || isIPv6(min) !== isIPv6(max)
        || ip6addr.compare(max, min) === -1) {
        return false;
    }

    return ip6addr.createAddrRange(min, max).contains(input);
}

/**
 * Validates that the input is a valid phone number, or a list of phone numbers
 *
 * @example
 * expect(FieldValidator.isISDN('+18089156800')).toBe(true);
 * expect(FieldValidator.isISDN('+7-952-5554-602')).toBe(true);
 * expect(FieldValidator.isISDN('79525554602')).toBe(true);
 * expect(FieldValidator.isISDN(79525554602)).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isISDN(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) {
        const fn = (data: any) => {
            const phoneNumber = new PhoneValidator(`+${data}`);
            return phoneNumber.isValid();
        };

        return _lift(fn, input);
    }

    const phoneNumber = new PhoneValidator(`+${input}`);
    return phoneNumber.isValid();
}

/**
 * Validates that the input is a MacAddress, or a list of MacAddresses
 *
 * @example
 * FieldValidator.isMACAddress('001f.f35b.2b1f') === true
 * FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: 'any' }) === true
 * FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', { delimiter: 'colon' }) === true
 * FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', { delimiter: 'dash' }) === true
 * FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: 'none' }) === true
 * FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', { delimiter: ['dash', 'colon'] }) === true
 * FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', { delimiter: 'dash' }) === false
 * FieldValidator.isMACAddress('00 1f f3 5b 2b 1f', { delimiter: 'colon' }) === false
 * FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: 'colon' }) === false
 * FieldValidator.isMACAddress('001ff35b2b1f', { delimiter: ['dash', 'colon'] }) === false
 *
 * @param {*} input
 * @param {{delimiter}} [{ delimiter?: string}] may be set to 'colon'|'space'|'dash'|'dot'|'none'
 * @returns {boolean} boolean
 */

export function isMACAddress(input: any, args?: MACAddress): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isMacAddress, input, args);

    return ts.isMacAddress(input, args);
}

/**
 * Will return true if number is between args provided, or that the list
 * of numbers are between the values
 *
 * @example
 * expect(FieldValidator.inNumberRange(-12, { min: -100, max: 45 })).toBe(true);
 * expect(FieldValidator.inNumberRange(0, { max: 45 })).toBe(true);
 *
 * @param {number} input
 * @param {{ min?: number; max?: number; inclusive?: boolean }} args
 * @returns {boolean} boolean
 */

export function inNumberRange(input: any,
    args: { min?: number; max?: number; inclusive?: boolean }): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) {
        const fn = (data: any) => {
            if (!isNumber(data)) return false;
            return ts.inNumberRange(data, args);
        };

        return _lift(fn, input, args);
    }

    if (!isNumber(input)) return false;
    return ts.inNumberRange(input, args);
}

/**
 * Validates that input is a number or a list of numbers
 *
 * @example
 * expect(FieldValidator.isNumber(17.343)).toBe(true);
 * expect(FieldValidator.isNumber(Infinity)).toBe(true);
 * expect(FieldValidator.isNumber('1')).toBe(false);
 * expect(FieldValidator.isNumber(true)).toBe(false);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isNumber(input: any): input is number {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isNumber, input);

    return ts.isNumber(input);
}

/**
 * Validates that input is a integer or a list of integers
 *
 * @example
 * expect(FieldValidator.isInteger(17.343)).toBe(true);
 * expect(FieldValidator.isInteger(Infinity)).toBe(false);
 * expect(FieldValidator.isInteger('1')).toBe(false);
 * expect(FieldValidator.isInteger(true)).toBe(false);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isInteger(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isInteger, input);

    return ts.isInteger(input);
}

/**
 * Validates that input is a string or a list of strings
 *
 * @example
 * expect(FieldValidator.isInteger(17.343)).toBe(false);
 * expect(FieldValidator.isInteger(Infinity)).toBe(false);
 * expect(FieldValidator.isInteger('1')).toBe(true);
 * expect(FieldValidator.isInteger(true)).toBe(false);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isString(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return _lift(ts.isString, input);

    return ts.isString(input);
}

/**
 * Validates that the input is a url or a list of urls
 *
 * @example
 * expect(FieldValidator.isURL('https://someurl.cc.ru.ch')).toBe(true);
 * expect(FieldValidator.isURL('ftp://someurl.bom:8080?some=bar&hi=bob')).toBe(true);
 * expect(FieldValidator.isURL('http://xn--fsqu00a.xn--3lr804guic')).toBe(true)
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isURL(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && url.isUri(data) !== null;
        return _lift(fn, input);
    }

    return isString(input) && url.isUri(input) != null;
}

/**
 * Validates that input is a UUID or a list of UUID's
 *
 * @example
 * expect(FieldValidator.isUUID('123e4567-e89b-82d3-f456-426655440000')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isUUID(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isUUID(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isUUID(input);
}

/**
 * Validates the input contains the values specified in args,
 * or that the array of inputs contains the value in args
 *
 * @example
 * expect(FieldValidator.contains('12345', { value: '12345' })).toBe(true);
 * expect(FieldValidator.contains('hello', { value: 'llo' })).toBe(false);
 *
 * @param {*} input
 * @param {{ value: string }} { value }
 * @returns {boolean} boolean
 */

export function contains(input: any, args: { value: string }): boolean {
    if (ts.isNil(input)) return false;
    if (!args.value) throw new Error('Parameter value must provided');

    if (isArray(input)) {
        const fn = (data: any) => ts.includes(data, args.value);
        return _lift(fn, input);
    }

    return ts.includes(input, args.value);
}

/**
 * Validates that the input matches the value, of that the input array matches the value provided
 *
 * @example
 * expect(FieldValidator.equals('12345', { value: '12345' })).toBe(true);
 * expect(FieldValidator.equals('hello', { value: 'llo' })).toBe(false);
 *
 * @param {*} input
 * @param {{ value: string }} { value }
 * @returns {boolean} boolean
 */

export function equals(input: any, args: { value: string }): boolean {
    if (ts.isNil(input)) return false;
    if (!args.value) throw new Error('A value must provided with the input');

    if (isArray(input)) {
        const fn = (data: any) => Object.is(data, args.value);
        return _lift(fn, input);
    }

    return Object.is(input, args.value);
}

/**
 * Validates that the input is alpha or a list of alpha values
 *
 * @example
 * expect(FieldValidator.isAlpha('ThiSisAsTRing')).toBe(true);
 * expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', { locale: 'pl-Pl' })).toBe(true);
 *
 * @param {*} input
 * @param {{ locale: validator.AlphaLocale }} [args]
 * @returns {boolean} boolean
 */

export function isAlpha(input: any, args?: { locale: validator.AlphaLocale }): boolean {
    if (ts.isNil(input)) return false;

    const locale: validator.AlphaLocale = args && args.locale ? args.locale : 'en-US';

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isAlpha(data, locale);
        return _lift(fn, input);
    }

    return isString(input) && validator.isAlpha(input, locale);
}

/**
 * Validates that the input is alphanumeric or a list of alphanumieric values
 *
 * @example
 * expect(FieldValidator.isAlphanumeric('1234')).toBe(true);
 * expect(FieldValidator.isAlphanumeric('allalpa')).toBe(true);
 * expect(FieldValidator.isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' })).toBe(true);
 *
 * @param {*} input
 * @param {{ locale: validator.AlphanumericLocale }} [args]
 * @returns {boolean} boolean
 */

export function isAlphanumeric(input: any,
    args?: { locale: validator.AlphanumericLocale }): boolean {
    if (ts.isNil(input)) return false;

    const locale: validator.AlphanumericLocale = args && args.locale ? args.locale : 'en-US';

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isAlphanumeric(data, locale);
        return _lift(fn, input);
    }

    return isString(input) && validator.isAlphanumeric(input, locale);
}

/**
 * Validates that the input is ascii chars or a list of ascii chars
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isASCII(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isAscii(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isAscii(input);
}

/**
 * Validates that the input is a base64 encoded string or a list of base64 encoded strings
 *
 * @example
 * expect(FieldValidator.isBase64('ZWFzdXJlLg==')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isBase64(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isBase64(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isBase64(input);
}

/**
 * Validates that the iput is empty
 * @example
 * expect(FieldValidator.isEmpty('')).toBe(true);
 * expect(FieldValidator.isEmpty(undefined)).toBe(true);
 * expect(FieldValidator.isEmpty(null)).toBe(true);
 * expect(FieldValidator.isEmpty({})).toBe(true);
 * expect(FieldValidator.isEmpty([])).toBe(true);
 * expect(FieldValidator.isEmpty('     ', { ignoreWhitespace: true })).toBe(true);
 *
 * @param {*} input
 * @param {{ ignoreWhitespace: boolean }} [args] set to true if you want the value to be trimed
 * @returns {boolean} boolean
 */

export function isEmpty(input: any, args?: { ignoreWhitespace: boolean }): boolean {
    let value = input;

    if (isString(value) && args && args.ignoreWhitespace) {
        value = value.trim();
    }

    return ts.isEmpty(value);
}

/**
 * Validate that the input is a valid domain name, or a list of domian names
 *
 * @example
 *
 * expect(FieldValidator.isFQDN('john.com.uk.bob')).toBe(true);
 *
 * @param {*} input
 * @param {args} [{ require_tld = true, allow_underscores = false, allow_trailing_dot = false}]
 * @returns {boolean} boolean
 */

export function isFQDN(input: any, args?: FQDNOptions): boolean {
    if (ts.isNil(input)) return false;

    const config = {
        require_tld: args?.requireTld || true,
        allow_underscores: args?.allowUnderscores || false,
        allow_trailing_dot: args?.allowTrailingDot || false
    };

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isFQDN(data, config);
        return _lift(fn, input);
    }

    return isString(input) && validator.isFQDN(input, config);
}

/**
 * Validates that the input is a hash, or a list of hashes
 *
 * @example
 * const md5Config = { algo: 'md5'};
 * const sha256Config = { algo: 'sha256' }
 * const sha1Config = { algo: 'sha1' }
 *
 * expect(FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', md5Config)).toBe(true);
 * expect(FieldValidator.isHash(
 *  '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
 *  sha256Config
 * )).toBe(true);
 * expect(FieldValidator.isHash('98fc121ea4c749f2b06e4a768b92ef1c740625a0', sha1Config)).toBe(true);
 *
 * @param {*} input
 * @param {HashConfig} { algo }
 * @returns {boolean} boolean
 */

export function isHash(input: any, args: HashConfig): boolean {
    if (ts.isNil(input)) return false;
    if (args?.algo === undefined) throw new Error('Parameter property algo was not provided');

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isHash(data, args.algo);
        return _lift(fn, input);
    }

    return isString(input) && validator.isHash(input, args.algo);
}

/**
 * Validates that input is a valid country code or a list of country codes
 *
 * @example
 * expect(FieldValidator.isCountryCode('IS')).toBe(true);
 * expect(FieldValidator.isCountryCode('RU')).toBe(true);
 * expect(FieldValidator.isCountryCode('ru')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isCountryCode(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isISO31661Alpha2(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isISO31661Alpha2(input);
}

/**
 * Checks to see if input is a valid ISO8601 string dates or a list of valid dates
 * @example
 * expect(FieldValidator.isISO8601('2020-01-01T12:03:03.494Z')).toBe(true);
 * expect(FieldValidator.isISO8601('2020-01-01')).toBe(true);
 * expect(FieldValidator.isISO8601('2020-01-01T12:03:03')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isISO8601(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isISO8601(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isISO8601(input);
}

/**
 * Validates that input is a valid ISSN or a list of valid ISSN
 * @example
 * expect(FieldValidator.isISSN('0378-5955')).toBe(true);
 * expect(FieldValidator.isISSN('03785955')).toBe(true)
 * expect(FieldValidator.isISSN('0378-5955', { requireHyphen: true })).toBe(true);
 *
 * @param {*} input
 * @param {ArgsISSNOptions} [{ requireHyphen?: boolean; caseSensitive?: boolean;}]
 * @returns {boolean} boolean
 */

export function isISSN(input: any, args?: ArgsISSNOptions): boolean {
    if (ts.isNil(input)) return false;

    const config = {
        case_sensitive: args?.caseSensitive || false,
        require_hyphen: args?.requireHyphen || false
    };

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isISSN(data, config);
        return _lift(fn, input);
    }

    return isString(input) && validator.isISSN(input, config);
}

/**
 * Validates that input is a valid RFC3339 dates or a list of valid RFC3339 dates
 *
 * @example
 * expect(FieldValidator.isRFC3339('2020-01-01T12:05:05.001Z')).toBe(true);
 * expect(FieldValidator.isRFC3339('2020-01-01 12:05:05.001Z')).toBe(true);
 * expect(FieldValidator.isRFC3339('2020-01-01T12:05:05Z')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isRFC3339(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isRFC3339(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isRFC3339(input);
}

/**
 * Validates that input is a valid JSON string or a list of valid JSON
 *
 * @example
 * expect(FieldValidator.isJSON('{ "bob": "gibson" }')).toBe(true);
 * expect(FieldValidator.isJSON('[{ "bob": "gibson" }, { "dizzy": "dean" }]')).toBe(true);
 * expect(FieldValidator.isJSON('[]')).toBe(true);
 * expect(FieldValidator.isJSON('{}')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isJSON(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isJSON(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isJSON(input);
}

/**
 * Check to see if input is a string with given length ranges, or a list of valid string lengths
 * @example
 * expect(FieldValidator.isLength('astring', { size: 7 })).toBe(true);
 * expect(FieldValidator.isLength('astring', { min: 5, max: 10 })).toBe(true);
 * expect(FieldValidator.isLength('astring', { size: 5 })).toBe(false);
 * expect(FieldValidator.isLength('astring', { min: 8 })).toBe(false);
 *
 * @param {*} input
 * @param {LengthConfig} { size, min, max }
 * @returns {boolean} boolean
 */

export function isLength(input: any, { size, min, max }: LengthConfig) {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => {
            if (size) return isString(data) && data.length === size;
            if (min || max) return validator.isLength(data, { min, max });
            return false;
        };
        return _lift(fn, input);
    }

    if (isString(input)) {
        if (size) return input.length === size;
        if (min || max) return validator.isLength(input, { min, max });
    }

    return false;
}

/**
 * Validates that input is a valid mimeType or a list of mimeTypes
 *
 * @example
 * expect(FieldValidator.isMIMEType('application/javascript')).toBe(true);
 * expect(FieldValidator.isMIMEType('application/graphql')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isMIMEType(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isMimeType(data);
        return _lift(fn, input);
    }

    return isString(input) && validator.isMimeType(input);
}

/**
 * Validates that input is a valid postal code or a list of postal codes
 *
 * @example
 * expect(FieldValidator.isPostalCode('85249', { locale: 'any' })).toBe(true);
 * expect(FieldValidator.isPostalCode('85249', { locale: 'ES' })).toBe(true);
 * expect(FieldValidator.isPostalCode('85249', { locale: 'ES' })).toBe(true);
 * expect(FieldValidator.isPostalCode('852', { locale: 'IS' })).toBe(true);
 * expect(FieldValidator.isPostalCode('885 49', { locale: 'SE' })).toBe(true);
 *
 * @param {*} input
 * @param {({ locale: 'any' | PostalCodeLocale })} { locale }
 * @returns {boolean} boolean
 */

export function isPostalCode(input: any, args: { locale: 'any' | PostalCodeLocale }): boolean {
    if (ts.isNil(input)) return false;
    if (!args?.locale) throw new Error('Invalid parameter locale, must provide an object with locale');

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isPostalCode(data, args.locale);
        return _lift(fn, input);
    }

    return isString(input) && validator.isPostalCode(input, args.locale);
}

/**
 * Validates that the input is a valid date or a list of valid dates
 *
 * @example
 * expect(FieldValidator.isValidDate('2019-03-17T23:08:59.673Z')).toBe(true);
 * expect(FieldValidator.isValidDate('2019-03-17')).toBe(true);
 * expect(FieldValidator.isValidDate('2019-03-17T23:08:59')).toBe(true);
 * expect(FieldValidator.isValidDate('03/17/2019')).toBe(true);
 * expect(FieldValidator.isValidDate('03-17-2019')).toBe(true);
 * expect(FieldValidator.isValidDate('Jan 22, 2012')).toBe(true);
 * expect(FieldValidator.isValidDate('23 Jan 2012')).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isValidDate(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        return _lift(ts.isValidDate, input);
    }

    return !isBoolean(input) && ts.isValidDate(input);
}

/**
 * Will throw if input is null or undefined
 * @example
 * expect(FieldValidator.guard({ hello: 'world' })).toBe(true);
 * expect(() => FieldValidator.guard(null)).toThrow();
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function guard(input: any) {
    if (ts.isNil(input)) throw new Error('Expected value not to be empty');
    return true;
}

/**
 * Will return false if input is null or undefined
 * @example
 * expect(FieldValidator.exists({ hello: 'world' })).toBe(true);
 * expect(FieldValidator.exists(null)).toBe(false);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function exists(input: any): boolean {
    return !ts.isNil(input);
}

/**
 * Validates that the input is an array
 * @example
 *  expect(FieldValidator.isArray(undefined)).toBe(false);
 * expect(FieldValidator.isArray([1, 2, 3])).toBe(true);
 * expect(FieldValidator.isArray([])).toBe(true);
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isArray(input: any): input is any[] {
    if (Array.isArray(input)) return true;
    return false;
}

/**
 * Validates that the function specified returns true at least once on the list of values
 *
 * @example
 * expect(FieldValidator.some(['hello', 3, { some: 'obj' }], { fn: 'isString' })).toBe(true);
 * expect(FieldValidator.some(['hello', 3, { some: 'obj' }], { fn: 'isBoolean' })).toBe(false);
 *
 * @param {*} input
 * @param {{ fn: string; options?: any }} { fn, options } fn is the name of method on FieldValidator
 * options is any other arguments nessecary for that function call
 * @returns {boolean} boolean
 */

export function some(input: any, { fn, options }: { fn: string; options?: any }): boolean {
    if (!isArray(input)) return false;

    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field validator respository`);

    return input.some((data: any) => repoConfig.fn(data, options));
}

/**
 * Validates that the function specified returns true for every single value in the list
 *
 * @example
 * expect(FieldValidator.every(['hello', 3, { some: 'obj' }], { fn: 'isString' })).toBe(false);
 * expect(FieldValidator.every(['hello', 'world'], { fn: 'isString' })).toBe(true);
 *
 * @param {*} input
 * @param {{ fn: string; options?: any }} { fn, options } fn is the name of method on FieldValidator
 * options is any other arguments nessecary for that function call
 * @returns {boolean} boolean
 */

export function every(input: any, { fn, options }: { fn: string; options?: any }): boolean {
    if (!isArray(input)) return false;

    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field validator respository`);

    return input.every((data: any) => repoConfig.fn(data, options));
}

export function isNumberTuple(input: any) {
    if (Array.isArray(input) && input.length === 2) {
        return input.every(isNumber);
    }

    return false;
}
