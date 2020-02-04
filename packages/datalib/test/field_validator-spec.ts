import { FieldValidator } from '../src/validations';
import * as i from '../src/interfaces';

const multiPolygon: i.GeoShapeMultiPolygon = {
    type: i.GeoShapeType.MultiPolygon,
    coordinates: [
        [
            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
        ],
        [
            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
        ]
    ]
};

const polygon: i.GeoShapePolygon = {
    type: i.GeoShapeType.Polygon,
    coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
    ]
};

const polygonWithHoles: i.GeoShapePolygon = {
    type: i.GeoShapeType.Polygon,
    coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
        [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
    ]
};

const matchingPoint: i.GeoShapePoint = {
    type: i.GeoShapeType.Point,
    coordinates: [12, 12]
};

describe('field validators', () => {
    describe('isBoolean', () => {
        it('should check if a value is a boolean', () => {
            // @ts-ignore
            expect(FieldValidator.isBoolean()).toEqual(false);
            expect(FieldValidator.isBoolean(['asdf'])).toEqual(false);
            expect(FieldValidator.isBoolean({ one: 1 })).toEqual(false);
            expect(FieldValidator.isBoolean(3)).toEqual(false);
            expect(FieldValidator.isBoolean('hello')).toEqual(false);

            expect(FieldValidator.isBoolean(true)).toEqual(true);
            expect(FieldValidator.isBoolean(false)).toEqual(true);
        });
    });

    describe('isBooleanLike', () => {
        it('should check if a value is programatically a boolean', () => {
            expect(FieldValidator.isBooleanLike(['asdf'])).toEqual(false);
            expect(FieldValidator.isBooleanLike({ one: 1 })).toEqual(false);
            expect(FieldValidator.isBooleanLike(3)).toEqual(false);
            expect(FieldValidator.isBooleanLike('hello')).toEqual(false);

            expect(FieldValidator.isBooleanLike(true)).toEqual(true);
            expect(FieldValidator.isBooleanLike(false)).toEqual(true);
            // @ts-ignore
            expect(FieldValidator.isBooleanLike()).toEqual(true);
            expect(FieldValidator.isBooleanLike(null)).toEqual(true);
            expect(FieldValidator.isBooleanLike(0)).toEqual(true);
            expect(FieldValidator.isBooleanLike('0')).toEqual(true);
            expect(FieldValidator.isBooleanLike('false')).toEqual(true);
            expect(FieldValidator.isBooleanLike('no')).toEqual(true);

            expect(FieldValidator.isBooleanLike(1)).toEqual(true);
            expect(FieldValidator.isBooleanLike('1')).toEqual(true);
            expect(FieldValidator.isBooleanLike('true')).toEqual(true);
            expect(FieldValidator.isBooleanLike('yes')).toEqual(true);
        });
    });

    describe('isEmail', () => {
        it('should check if a value is an email', () => {
            // @ts-ignore
            expect(FieldValidator.isEmail()).toEqual(false);
            expect(FieldValidator.isEmail(['asdf'])).toEqual(false);
            expect(FieldValidator.isEmail({ one: 1 })).toEqual(false);
            expect(FieldValidator.isEmail(3)).toEqual(false);
            expect(FieldValidator.isEmail('hello')).toEqual(false);

            const list = [
                'ha3ke5@pawnage.com',
                'ha3ke5@pawnage.com',
                'user@blah@blah.com',
                'junk user@blah.com',
                'user@blah.com/junk.morejunk',
                'user@blah.com&value=junk',
                'user@blah.com/junk.junk?a=<tag value="junk"'
            ];

            const results = list.map(FieldValidator.isEmail);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });

    describe('isGeoJSON', () => {
        it('should check if a value is GeoJSON', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoJSON()).toEqual(false);
            expect(FieldValidator.isGeoJSON(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoJSON({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoJSON(3)).toEqual(false);
            expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

            const list = [
                matchingPoint,
                polygon,
                polygonWithHoles,
                multiPolygon
            ];

            const results = list.map(FieldValidator.isGeoJSON);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });

    describe('isGeoShapePoint', () => {
        it('should check if a value is GeoShapePoint', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint()).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint(['asdf'])).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint({ one: 1 })).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint(3)).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint('hello')).toEqual(false);

            expect(FieldValidator.isGeoShapePoint(matchingPoint)).toEqual(true);
            expect(FieldValidator.isGeoShapePoint(polygon)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(polygonWithHoles)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(multiPolygon)).toEqual(false);
        });
    });

    describe('isGeoShapePolygon', () => {
        it('should check if a value is GeoShapePolygon', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon()).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon(['asdf'])).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon({ one: 1 })).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon(3)).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon('hello')).toEqual(false);

            expect(FieldValidator.isGeoShapePolygon(matchingPoint)).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon(polygon)).toEqual(true);
            expect(FieldValidator.isGeoShapePolygon(polygonWithHoles)).toEqual(true);
            expect(FieldValidator.isGeoShapePolygon(multiPolygon)).toEqual(false);
        });
    });

    describe('isGeoShapeMultiPolygon', () => {
        it('should check if a value is GeoShapeMultiPolygon', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon()).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon(['asdf'])).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon({ one: 1 })).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon(3)).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon('hello')).toEqual(false);

            expect(FieldValidator.isGeoShapeMultiPolygon(matchingPoint)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(polygon)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(polygonWithHoles)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(multiPolygon)).toEqual(true);
        });
    });

    describe('isGeoJSON', () => {
        it('should check if a value is GeoJSON', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoJSON()).toEqual(false);
            expect(FieldValidator.isGeoJSON(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoJSON({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoJSON(3)).toEqual(false);
            expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

            const list = [
                matchingPoint,
                polygon,
                polygonWithHoles,
                multiPolygon
            ];

            const results = list.map(FieldValidator.isGeoJSON);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });

    describe('isGeoJSON', () => {
        it('should check if a value is GeoJSON', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoJSON()).toEqual(false);
            expect(FieldValidator.isGeoJSON(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoJSON({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoJSON(3)).toEqual(false);
            expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

            const list = [
                matchingPoint,
                polygon,
                polygonWithHoles,
                multiPolygon
            ];

            const results = list.map(FieldValidator.isGeoJSON);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });

    describe('isIp should', () => {
        it('return true for valid ips', () => {
            expect(FieldValidator.isIp('8.8.8.8')).toBe(true);
            expect(FieldValidator.isIp('192.172.1.18')).toBe(true);
            expect(FieldValidator.isIp('11.0.1.18')).toBe(true);
            expect(FieldValidator.isIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
            expect(FieldValidator.isIp('fe80::1ff:fe23:4567:890a%eth2')).toBe(true);
            expect(FieldValidator.isIp('2001:DB8::1')).toBe(true);
            expect(FieldValidator.isIp('172.16.0.1')).toBe(true);
            expect(FieldValidator.isIp('10.168.0.1')).toBe(true);
            expect(FieldValidator.isIp('fc00:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
        });

        it('return true for private or public ips if specified', () => {
            expect(FieldValidator.isIp('8.8.8.8', { public: true })).toBe(true);
            expect(FieldValidator.isIp('192.172.1.18', { public: false })).toBe(false);
            expect(FieldValidator.isIp('2001:db8:85a3:8d3:1319:8a2e:370:7348', { public: true })).toBe(true);
            expect(FieldValidator.isIp('fe80::1ff:fe23:4567:890a%eth2', { public: false })).toBe(false);

            expect(FieldValidator.isIp('172.16.0.1', { public: true })).toBe(false);
            expect(FieldValidator.isIp('10.168.0.1', { public: false })).toBe(true);
            expect(FieldValidator.isIp('fc00:db8:85a3:8d3:1319:8a2e:370:7348', { public: false })).toBe(true);
            expect(FieldValidator.isIp('fc00:db8::1', { public: true })).toBe(false);
        });

        it('return false for invalid ip addresses', () => {
            expect(FieldValidator.isIp('NA')).toBe(false);
            expect(FieldValidator.isIp('')).toBe(false);
            expect(FieldValidator.isIp('172.394.0.1')).toBe(false);
            expect(FieldValidator.isIp(undefined)).toBe(false);
            expect(FieldValidator.isIp('ZXXY:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(false);
            expect(FieldValidator.isIp('::192.168.1.18')).toBe(false);
            expect(FieldValidator.isIp('11.222.33.001')).toBe(false);
            expect(FieldValidator.isIp('87')).toBe(false);
            expect(FieldValidator.isIp('02751178')).toBe(false);
            expect(FieldValidator.isIp(true)).toBe(false);
            expect(FieldValidator.isIp({})).toBe(false);
            expect(FieldValidator.isIp([])).toBe(false);
            expect(FieldValidator.isIp(123456678)).toBe(false);
            expect(FieldValidator.isIp(12.4345)).toBe(false);
        });
    });

    describe('isPublicIp', () => {
        it('should check if an ip is public', () => {
            // private ips
            expect(FieldValidator.isPublicIp('192.168.0.1')).toBe(false);
            expect(FieldValidator.isPublicIp('fc00:db8::1')).toBe(false);

            // public ips
            expect(FieldValidator.isPublicIp('8.8.8.8')).toBe(true);
            expect(FieldValidator.isPublicIp('2001:db8::1')).toBe(true);
            expect(FieldValidator.isPublicIp('172.194.0.1')).toBe(true);

            // bad ip address
            expect(FieldValidator.isPublicIp('badIpaddress')).toBe(false);
        });

        it('should check if an ip is prive based on options', () => {
            // private ips
            expect(FieldValidator.isPublicIp('192.168.0.1', { private: true })).toBe(true);
            expect(FieldValidator.isPublicIp('fc00:db8::1', { private: true })).toBe(true);

            // public ips
            expect(FieldValidator.isPublicIp('8.8.8.8', { private: true })).toBe(false);
            expect(FieldValidator.isPublicIp('2001:db8::1', { private: true })).toBe(false);
            expect(FieldValidator.isPublicIp('172.194.0.1', { private: true })).toBe(false);

            // bad ip address
            expect(FieldValidator.isPublicIp('badIpaddress', { private: true })).toBe(false);
        });
    });

    describe('isIpCidr', () => {
        it('should return true for valid ips with cidr notation', () => {
            expect(FieldValidator.isIpCidr('1.2.3.4/32')).toBe(true);
            expect(FieldValidator.isIpCidr('8.8.0.0/12')).toBe(true);
            expect(FieldValidator.isIpCidr('2001:0db8:0123:4567:89ab:cdef:1234:5678/128')).toBe(true);
            expect(FieldValidator.isIpCidr('2001::1234:5678/128')).toBe(true);
        });

        it('should return false for invalid ips with cidr notation', () => {
            expect(FieldValidator.isIpCidr('1.2.3.4/128')).toBe(false);
            expect(FieldValidator.isIpCidr('notanipaddress/12')).toBe(false);
            expect(FieldValidator.isIpCidr('2001:0db8:0123:4567:89ab:cdef:1234:5678/412')).toBe(false);
            expect(FieldValidator.isIpCidr('2001::1234:5678/b')).toBe(false);
            expect(FieldValidator.isIpCidr('8.8.8.10')).toBe(false);
            expect(FieldValidator.isIpCidr(true)).toBe(false);
            expect(FieldValidator.isIpCidr({})).toBe(false);
        });
    });

    describe('should inIpRange', () => {
        it('return true for ip addresses in a given range using cidr notation', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { cidr: '8.8.8.0/24'})).toBe(true);
            expect(FieldValidator.inIpRange('2001:0db8:0123:4567:89ab:cdef:1234:5678', { cidr: '2001:0db8:0123:4567:89ab:cdef:1234:0/112'})).toBe(true);
        });

        it('should validate based on exclusive options', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { cidr: '8.8.8.0/24', exclusive: true })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.0', { cidr: '8.8.8.0/24', exclusive: true })).toBe(false);
            expect(FieldValidator.inIpRange('2001:0db8::5678', { cidr: '2001:0db8::0/112', exclusive: true })).toBe(true);
            expect(FieldValidator.inIpRange('2001:0db8::ffff', { cidr: '2001:0db8::0/112', exclusive: true })).toBe(false);
            expect(FieldValidator.inIpRange('2001:0db8::0', { min: '2001:0db8::0', exclusive: true })).toBe(false);
            expect(FieldValidator.inIpRange('2001:0db8::ffff', { min: '2001:0db8::0', max: '2001:0db8::ffff', exclusive: true })).toBe(false);
            expect(FieldValidator.inIpRange('2001:0db8::ab00', { min: '2001:0db8::0', max: '2001:0db8::ffff', exclusive: true })).toBe(true);
        });

        it('should return true for valid ips in a range with max and min', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.0', max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.8', { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.0', { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.64', { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::123', max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::b000', max: 'fd00::ea00' })).toBe(true)
        });

        it('should return false for ips out of the ranges, cidr notation defined range', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { cidr: '8.8.8.10/32'})).toBe(false);
            expect(FieldValidator.inIpRange('1.2.3.4', { cidr: '8.8.2.0/24'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { cidr: '8.8.2.0/24'})).toBe(false);
            expect(FieldValidator.inIpRange('badIpAddress', { cidr: '8.8.2.0/24'})).toBe(false);
            expect(FieldValidator.inIpRange('8.8.1.12', { cidr: '8.8.2.0/23'})).toBe(false);
            expect(FieldValidator.inIpRange('8.8.1.12', { cidr: 'badCidr'})).toBe(false);
        });

        it('should return false for ips out of range, min and max defined range', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.102', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('badIpAddress', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: 'badIpAddress', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.24', max: 'badIpAddress' })).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: 'fd00::b000', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.0', max: 'fd00::b000' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: 'fd00::a000', max: 'fd00::b000' })).toBe(false);

            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::c000', max: 'fd00::f000'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::f000', max: 'fd00::1000'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: '8.8.8.24', max: 'fd00::b000'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::a000', max: '8.8.8.24'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: '8.8.8.0', max: '8.8.8.24'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { max: 'fd00::1000' })).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::f000' })).toBe(false);
        });
    });

    describe('validValue', () => {
        it('should validate against null and undefined', () => {
            expect(FieldValidator.validValue(undefined)).toBe(false);
            expect(FieldValidator.validValue(null)).toBe(false);
            expect(FieldValidator.validValue(false)).toBe(true);
            expect(FieldValidator.validValue(324324)).toBe(true);
            expect(FieldValidator.validValue('bob')).toBe(true);
        });

        it('should validate using options.invalidValues', () => {
            const options = {
                invalidValues: ['', 'n/a', 'NA', 12345]
            };
            expect(FieldValidator.validValue('bob', options)).toBe(true);
            expect(FieldValidator.validValue(true, options)).toBe(true);
            expect(FieldValidator.validValue('', options)).toBe(false);
            expect(FieldValidator.validValue('n/a', options)).toBe(false);
            expect(FieldValidator.validValue('NA', options)).toBe(false);
            expect(FieldValidator.validValue(12345, options)).toBe(false);
        });
    });

    describe('isTimestamp', () => {
        it('should validate timestamps', () => {
            // iso8601 string dates
            expect(FieldValidator.isTimestamp('2019-03-07T23:08:59.673Z')).toBe(true);
            expect(FieldValidator.isTimestamp('2019-03-07')).toBe(true);
            expect(FieldValidator.isTimestamp('2019-03-07T23:08:59')).toBe(true);

            // different string date formats
            expect(FieldValidator.isTimestamp('03/07/2019')).toBe(true);
            expect(FieldValidator.isTimestamp('03-07-2019')).toBe(true);
            expect(FieldValidator.isTimestamp('Jan 12, 2012')).toBe(true);
            expect(FieldValidator.isTimestamp('23 Jan 2012')).toBe(true);
            expect(FieldValidator.isTimestamp('12.03.2012')).toBe(true);

            // millisecond and second timestamps
            expect(FieldValidator.isTimestamp('1552000139673')).toBe(true);
            expect(FieldValidator.isTimestamp('1552000139')).toBe(true);

            // date object
            expect(FieldValidator.isTimestamp(new Date())).toBe(true);

            // bad dates
            expect(FieldValidator.isTimestamp('2020-23-09')).toBe(false);
            expect(FieldValidator.isTimestamp('21.03.2012')).toBe(false);
            expect(FieldValidator.isTimestamp('21/01/2019')).toBe(false);
            expect(FieldValidator.isTimestamp('123432as;ldkfjasoej293432423')).toBe(false);
            expect(FieldValidator.isTimestamp('1552000        139673')).toBe(false);
            expect(FieldValidator.isTimestamp('unknown')).toBe(false);
            expect(FieldValidator.isTimestamp('1')).toBe(false);
            expect(FieldValidator.isTimestamp('undefined')).toBe(false);
            expect(FieldValidator.isTimestamp(0)).toBe(false);
            expect(FieldValidator.isTimestamp('baddate')).toBe(false);
            expect(FieldValidator.isTimestamp(null)).toBe(false);
            expect(FieldValidator.isTimestamp(undefined)).toBe(false);
            expect(FieldValidator.isTimestamp(true)).toBe(false);
            expect(FieldValidator.isTimestamp(false)).toBe(false);
            expect(FieldValidator.isTimestamp('')).toBe(false);
            expect(FieldValidator.isTimestamp('    ')).toBe(false);
            // 9 digits
            expect(FieldValidator.isTimestamp('155200013')).toBe(false);
            // 14 digits
            expect(FieldValidator.isTimestamp('15520001333212')).toBe(false);
        });
    });

    describe('isISDN', () => {
        it('should validate isdn numbers', () => {
            expect(FieldValidator.isISDN('46707123456')).toBe(true);
            expect(FieldValidator.isISDN('1 808 915 6800')).toBe(true);
            expect(FieldValidator.isISDN('1-808-915-6800')).toBe(true);
            expect(FieldValidator.isISDN('+18089156800')).toBe(true);
            expect(FieldValidator.isISDN('+7-952-5554-602')).toBe(true);
            expect(FieldValidator.isISDN('79525554602')).toBe(true);
            expect(FieldValidator.isISDN(79525554602)).toBe(true);
            expect(FieldValidator.isISDN('unknown')).toBe(false);
            expect(FieldValidator.isISDN('52')).toBe(false);
            expect(FieldValidator.isISDN('34000000000')).toBe(false);
            expect(FieldValidator.isISDN('4900000000000')).toBe(false);
            expect(FieldValidator.isISDN('1234')).toBe(false);
            expect(FieldValidator.isISDN('22345')).toBe(false);
            expect(FieldValidator.isISDN('223457')).toBe(false);
            expect(FieldValidator.isISDN('2234578')).toBe(false);
            expect(FieldValidator.isISDN('123')).toBe(false);
            expect(FieldValidator.isISDN('5')).toBe(false);
            expect(FieldValidator.isISDN('011')).toBe(false);
            expect(FieldValidator.isISDN(7)).toBe(false);
            expect(FieldValidator.isISDN(true)).toBe(false);
            expect(FieldValidator.isISDN({})).toBe(false);
            expect(FieldValidator.isISDN([])).toBe(false);
        });
    });

    describe('isMacAddress', () => {
        it('should return true for a valid mac address', () => {
            expect(FieldValidator.isMacAddress('00:1f:f3:5b:2b:1f')).toBe(true);
            expect(FieldValidator.isMacAddress('00-1f-f3-5b-2b-1f')).toBe(true);
            expect(FieldValidator.isMacAddress('001f.f35b.2b1f')).toBe(true);
            expect(FieldValidator.isMacAddress('00 1f f3 5b 2b 1f')).toBe(true);
            expect(FieldValidator.isMacAddress('001ff35b2b1f')).toBe(true);
        });

        it('should return false for a invalid mac address', () => {
            expect(FieldValidator.isMacAddress('00:1:f:5b:2b:1f')).toBe(false);
            expect(FieldValidator.isMacAddress('00-1Z-fG-5b-2b-1322f')).toBe(false);
            expect(FieldValidator.isMacAddress('23423423')).toBe(false);
            expect(FieldValidator.isMacAddress('00_1Z_fG_5b_2b_13')).toBe(false);
        });
    });

    describe('inRange', () => {
        it('should return true if number in range', () => {
            expect(FieldValidator.inRange(44, { min: 0, max: 45 })).toBe(true);
            expect(FieldValidator.inRange(-12, { min: -100, max: 45 })).toBe(true);
            expect(FieldValidator.inRange(0, { max: 45 })).toBe(true);
            expect(FieldValidator.inRange(0, { min: -45 })).toBe(true);
        });

        it('should return false if number out of range', () => {
            expect(FieldValidator.inRange(44, { min: 0, max: 25 })).toBe(false);
            expect(FieldValidator.inRange(-12, { min: -10, max: 45 })).toBe(false);
            expect(FieldValidator.inRange(0, { max: -45 })).toBe(false);
            expect(FieldValidator.inRange(0, { min: 45 })).toBe(false);
        });
    });

    describe('isNumber', () => {
        it('should return true for a valid number', () => {
            expect(FieldValidator.isNumber(1)).toBe(true);
            expect(FieldValidator.isNumber(-11232)).toBe(true);
            expect(FieldValidator.isNumber(0o32)).toBe(true);
            expect(FieldValidator.isNumber(17.343)).toBe(true);
            expect(FieldValidator.isNumber(Infinity)).toBe(true);
        });

        it(' should return false for not a number', () => {
            expect(FieldValidator.isNumber('1')).toBe(false);
            expect(FieldValidator.isNumber(true)).toBe(false);
            expect(FieldValidator.isNumber({})).toBe(false);
            expect(FieldValidator.isNumber([])).toBe(false);
            expect(FieldValidator.isNumber(null)).toBe(false);
            expect(FieldValidator.isNumber(undefined)).toBe(false);
            expect(FieldValidator.isNumber('astring')).toBe(false);
        })

        it('should validate a number string if args set', () => {
            expect(FieldValidator.isNumber('1', { coerceStrings: true })).toBe(true);
            expect(FieldValidator.isNumber('-11343.343', { coerceStrings: true })).toBe(true);
            expect(FieldValidator.isNumber('0034598348554784', { coerceStrings: true })).toBe(true);
        })

        it('should validate an int if args set', () => {
            expect(FieldValidator.isNumber(10, { integer: true })).toBe(true);
            expect(FieldValidator.isNumber('1', { integer: true })).toBe(false);
            expect(FieldValidator.isNumber(true, { integer: true })).toBe(false);
            expect(FieldValidator.isNumber('-11343.343', { coerceStrings: true, integer: true })).toBe(false);
            expect(FieldValidator.isNumber('0034598348554784', { coerceStrings: true, integer: true })).toBe(true);
        })

        it('should validate if num in a range and args set', () => {
            expect(FieldValidator.isNumber('1', { coerceStrings: true, min: -10, max: 5 })).toBe(true);
            expect(FieldValidator.isNumber(1232, { coerceStrings: true, min: -10, max: 5 })).toBe(false);
            expect(FieldValidator.isNumber(11343.343, { min: 10 })).toBe(true);
            expect(FieldValidator.isNumber(11343.343, { min: 10, integer: true })).toBe(false);
        })
    });

    describe('isString', () => {
        it('should return true for valid strings', () => {
            expect(FieldValidator.isString('this is a string')).toBe(true);
            expect(FieldValidator.isString('false')).toBe(true);
            expect(FieldValidator.isString('12345')).toBe(true);
        });

        it('should return false for non-strings', () => {
            expect(FieldValidator.isString(new Buffer('some string', 'utf8'))).toBe(false);
            expect(FieldValidator.isString(true)).toBe(false);
            expect(FieldValidator.isString(12345)).toBe(false);
            expect(FieldValidator.isString({})).toBe(false);
            expect(FieldValidator.isString([])).toBe(false);
        });
    });

    describe('isUrl', () => {
        it('should return true for valid uris', () => {
            expect(FieldValidator.isUrl('http://someurl.com')).toBe(true);
            expect(FieldValidator.isUrl('http://someurl.com.uk')).toBe(true);
            expect(FieldValidator.isUrl('https://someurl.cc.ru.ch')).toBe(true);
            expect(FieldValidator.isUrl('ftp://someurl.bom:8080?some=bar&hi=bob')).toBe(true);
            expect(FieldValidator.isUrl('http://xn--fsqu00a.xn--3lr804guic')).toBe(true);
            expect(FieldValidator.isUrl('http://example.com/%E5%BC%95%E3%81%8D%E5%89%B2%E3%82%8A.html')).toBe(true);
        });

        it('should return false for invalid uris', () => {
            expect(FieldValidator.isUrl('')).toBe(false);
            expect(FieldValidator.isUrl('null')).toBe(false);
            expect(FieldValidator.isUrl(true)).toBe(false);
            expect(FieldValidator.isUrl({ url: 'http:thisisaurl.com'})).toBe(false);
            expect(FieldValidator.isUrl(12345)).toBe(false);
        });
    });

    describe('isUUID', () => {
        it('should return true for valid UUIDs', () => {
            expect(FieldValidator.isUUID('95ecc380-afe9-11e4-9b6c-751b66dd541e')).toBe(true);
            expect(FieldValidator.isUUID('0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B')).toBe(true);
            expect(FieldValidator.isUUID('123e4567-e89b-82d3-f456-426655440000')).toBe(true);
        });

        it('should return false for invalid UUIDs', () => {
            expect(FieldValidator.isUUID('')).toBe(false);
            expect(FieldValidator.isUUID('95ecc380:afe9:11e4:9b6c:751b66dd541e')).toBe(false);
            expect(FieldValidator.isUUID('123e4567-e89b-x2d3-0456-426655440000')).toBe(false);
            expect(FieldValidator.isUUID('123e4567-e89b-12d3-a456-42600')).toBe(false);
            expect(FieldValidator.isUUID(undefined)).toBe(false);
            expect(FieldValidator.isUUID('randomstring')).toBe(false);
            expect(FieldValidator.isUUID(true)).toBe(false);
            expect(FieldValidator.isUUID({})).toBe(false);
        });
    });

    describe('contains', () => {
        it('should return true if string contains substring', () => {
            expect(FieldValidator.contains('hello', { value: 'hello' })).toBe(true);
            expect(FieldValidator.contains('hello', { value: 'll' })).toBe(true);
            expect(FieldValidator.contains('12345', { value: '45' })).toBe(true);
        });

        it('should return false if string does not contain substring', () => {
            expect(FieldValidator.contains('hello', { value: 'bye' })).toBe(false);
            expect(FieldValidator.contains(true, { value: 'rue' })).toBe(false);
            expect(FieldValidator.contains(12345, { value: '12' })).toBe(false);
            expect(FieldValidator.contains([ 'hello' ], { value: 'hello' })).toBe(false);
            expect(FieldValidator.contains({}, { value: 'hello' })).toBe(false);
        });
    });

    describe('equals', () => {
        it('should return true if string is equal to a value', () => {
            expect(FieldValidator.equals('hello', { value: 'hello' })).toBe(true);
            expect(FieldValidator.equals('false', { value: 'false' })).toBe(true);
            expect(FieldValidator.equals('12345', { value: '12345' })).toBe(true);
        });

        it('should return false if string is not equal to value', () => {
            expect(FieldValidator.equals('hello', { value: 'llo' })).toBe(false);
            expect(FieldValidator.equals(true, { value: 'true' })).toBe(false);
            expect(FieldValidator.equals(12345, { value: '12345' })).toBe(false);
            expect(FieldValidator.equals([ 'hello' ], { value: 'hello' })).toBe(false);
            expect(FieldValidator.equals({}, { value: 'hello' })).toBe(false);
        });
    });

    describe('isAlpha', () => {
        it('should return true if value is alpha characters', () => {
            expect(FieldValidator.isAlpha('ThiSisAsTRing')).toBe(true);
            expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', { locale: 'pl-Pl' })).toBe(true);
        });

        it('should return false if value is not alpha characters', () => {
            expect(FieldValidator.isAlpha('ThiSisAsTRing%03$')).toBe(false);
            expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ')).toBe(false);
            expect(FieldValidator.isAlpha(false)).toBe(false);
            expect(FieldValidator.isAlpha({})).toBe(false);
            expect(FieldValidator.isAlpha('1234ThisiZĄĆĘŚŁ', { locale: 'pl-PL' })).toBe(false);
            expect(FieldValidator.isAlpha(['thisis a string'])).toBe(false);
            expect(FieldValidator.isAlpha('dude howdy')).toBe(false);
        });
    });

    describe('isAlphaNumeric', () => {
        it('should return true if string is all alphaNumeric chars for locale', () => {
            expect(FieldValidator.isAlphanumeric('alpha1234')).toBe(true);
            expect(FieldValidator.isAlphanumeric('1234')).toBe(true);
            expect(FieldValidator.isAlphanumeric('allalpa')).toBe(true);
            expect(FieldValidator.isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' })).toBe(true);
            expect(FieldValidator.isAlphanumeric('12343534', { locale: 'ku-IQ' })).toBe(true);
            expect(FieldValidator.isAlphanumeric('فڤقک', { locale: 'ku-IQ' })).toBe(true);
        });

        it('should return false if string is not alphaNumeric chars for locale', () => {
            expect(FieldValidator.isAlphanumeric('alpha1.23%4')).toBe(false);
            expect(FieldValidator.isAlphanumeric('فڤقکگ1234')).toBe(false);
            expect(FieldValidator.isAlphanumeric(false)).toBe(false);
            expect(FieldValidator.isAlphanumeric(123456)).toBe(false);
            expect(FieldValidator.isAlphanumeric({ string: 'somestring' })).toBe(false);
        });
    });

    describe('isAscii', () => {
        it('should return true if string is all ascii chars', () => {
            expect(FieldValidator.isAscii('sim,pleAscii\t8*7!@#"\n')).toBe(true);
            expect(FieldValidator.isAscii('\x03, \x5A~')).toBe(true);
        });

        it('should return false for not ascii strings', () => {
            expect(FieldValidator.isAscii(true)).toBe(false);
            expect(FieldValidator.isAscii({})).toBe(false);
            expect(FieldValidator.isAscii(12334)).toBe(false);
            expect(FieldValidator.isAscii('˜∆˙©∂ß')).toBe(false);
            expect(FieldValidator.isAscii('ڤقک')).toBe(false);
        });
    });

    describe('isBase64', () => {
        it('should return true for base64 strings', () => {
            expect(FieldValidator.isBase64('ZWFzdXJlLg==')).toBe(true);
            expect(FieldValidator.isBase64('YW55IGNhcm5hbCBwbGVhc3Vy')).toBe(true);
        });

        it('should return false for non-base64 strings', () => {
            expect(FieldValidator.isBase64('thisisjustastring')).toBe(false);
            expect(FieldValidator.isBase64(true)).toBe(false);
            expect(FieldValidator.isBase64([])).toBe(false);
            expect(FieldValidator.isBase64(123345)).toBe(false);
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty input', () => {
            expect(FieldValidator.isEmpty('')).toBe(true);
            expect(FieldValidator.isEmpty(undefined)).toBe(true);
            expect(FieldValidator.isEmpty(null)).toBe(true);
            expect(FieldValidator.isEmpty({})).toBe(true);
            expect(FieldValidator.isEmpty([])).toBe(true);
            expect(FieldValidator.isEmpty('     ', { ignore_whitespace: true })).toBe(true);
        });

        it('should return false for non-empty inputs', () => {
            expect(FieldValidator.isEmpty('not empty')).toBe(false);
            // expect(FieldValidator.isEmpty(123445)).toBe(false);
            // expect(FieldValidator.isEmpty(0)).toBe(false);
            expect(FieldValidator.isEmpty({ a: 'something' })).toBe(false);
            expect(FieldValidator.isEmpty(['one', 2, 'three'])).toBe(false);
            expect(FieldValidator.isEmpty('     ')).toBe(false);
            // expect(FieldValidator.isEmpty(true)).toBe(false);
            // expect(FieldValidator.isEmpty(false)).toBe(false);
        });
    });

    describe('isFQDN', () => {
        it('should return true for valid fully qualified domain name', () => {
            
        });
    });
});
