import { FieldType } from '../../../src';

export default [
    [
        'does not throw when fields are not present',
        'some:field',
        [
            {},
            {
                ip: null,
                key: null,
                created: null,
                location: null,
            },
        ],
        [false, false],
        {
            ip: FieldType.IP,
            created: FieldType.Date,
            location: FieldType.Geo,
        },
    ],
    [
        'does not throw when types are not present',
        '(ipfield:{"192.198.0.0" TO "192.198.0.255"] AND date:"2018-10-18T18:15:34.123Z") OR (str:foo* AND location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902"))',
        [
            {},
            {
                ip: null,
                key: null,
                created: null,
                location: null,
            },
        ],
        [false, false],
    ],
    [
        'should not throw with AND NOT chaining',
        'date:["2018-10-10T17:36:13Z" TO "2018-10-10T17:36:13Z"] AND NOT value:(251 OR 252) AND NOT type:example',
        [
            { date: '2018-10-10T17:36:13Z', value: 252, type: 'example' },
            { date: '2018-10-10T17:36:13Z', value: 253, type: 'other' },
            { date: '["2018-10-10T17:36:13Z" TO "2018-10-10T17:36:13Z"]', value: 253, type: 'other' },
        ],
        [false, true, false],
        { date: 'date' },
    ],
    [
        'should not throw with AND ! chaining',
        'date:["2018-10-10T17:36:13Z" TO "2018-10-10T17:36:13Z"] AND ! value:(251 OR 252) AND ! type:example',
        [
            { date: '2018-10-10T17:36:13Z', value: 252, type: 'example' },
            { date: '2018-10-10T17:36:13Z', value: 253, type: 'other' },
            { date: '["2018-10-10T17:36:13Z" TO "2018-10-10T17:36:13Z"]', value: 253, type: 'other' },
        ],
        [false, true, false],
        { date: 'date' },
    ],
    [
        'can can complex queries part1',
        'some:key AND (_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322))',
        [
            { _created: '2018-10-18T18:13:20.683Z', some: 'key', bytes: 1232322 },
            {
                _created: '2018-10-18T18:13:20.683Z',
                other: 'key',
                bytes: 1232322,
                _updated: '2018-10-18T20:13:20.683Z',
            },
            { _created: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 122 },
            { _created: '2018-04-02T12:15:34.123Z', bytes: 12233 },
            { _updated: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 1232322 },
        ],
        [true, false, false, false, false],
        { _created: 'date', _updated: 'date' },
    ],
    [
        'can can complex queries part2',
        '_exists_:other OR (_created:["2018-04-02" TO "2018-10-19"] OR bytes:<200)',
        [
            { _created: '2018-10-18T18:13:20.683Z', some: 'key', bytes: 1232322 },
            {
                _created: '2018-10-18T18:13:20.683Z',
                other: 'key',
                bytes: 1232322,
                _updated: '2018-10-18T20:13:20.683Z',
            },
            { _created: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 122 },
            { _created: '2018-04-02T12:15:34.123Z', bytes: 12233 },
            { _updated: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 1232322 },
        ],
        [true, true, true, true, false],
        { _created: 'date', _updated: 'date' },
    ],
    [
        'can can complex queries part3',
        'some:key AND ((_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322)) OR _updated:>="2018-10-18T18:13:20.683Z")',
        [
            { _created: '2018-10-18T18:13:20.683Z', some: 'key', bytes: 1232322 },
            {
                _created: '2018-10-18T18:13:20.683Z',
                other: 'key',
                bytes: 1232322,
                _updated: '2018-10-18T20:13:20.683Z',
            },
            { _created: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 122 },
            { _created: '2018-04-02T12:15:34.123Z', bytes: 12233 },
            { _updated: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 1232322 },
        ],
        [true, false, false, false, true],
        { _created: 'date', _updated: 'date' },
    ],
    [
        'can can complex queries part4',
        'date:[2018-10-10T19:30:00Z TO *] AND field1.subfield:value AND field2:(1 OR 2 OR 5 OR 20 OR 50 OR 60) AND NOT (field3:15 AND field4:sometext) AND NOT field5:value2',
        [
            {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field4: 'other',
                field5: 'other',
            },
            {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 2,
                field3: 25,
                field4: 'sometext',
                field5: 'other',
            },
            {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 25,
                field4: 'sometext',
                field5: 'value2',
            },
            {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field4: 'sometext',
                field5: 'other',
            },
            {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 62,
                field3: 15,
                field4: 'other',
                field5: 'other',
            },
            {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'other' },
                field2: 62,
                field3: 15,
                field4: 'other',
                field5: 'other',
            },
            {
                date: '2018-09-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 62,
                field3: 15,
                field4: 'other',
                field5: 'other',
            },
            {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field4: 'other',
            },
            {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field5: 'other',
            },
            {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field4: 'other',
                field5: 'other',
            },
        ],
        [true, true, false, false, false, false, false, true, true, true],
        { date: 'date' },
    ],
    [
        'can can complex queries part5',
        'date1:[2018-09-10T00:00:00Z TO 2018-10-10T23:39:01Z] AND ip_field:[192.168.196.145 TO 192.168.196.195] AND date2:[2018-09-10T00:00:00Z TO 2018-10-10T23:39:01Z] AND field1:1',
        [
            {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-10T23:39:01Z',
                field1: 1,
            },
            {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-10T23:39:01Z',
                field1: 2,
            },
            {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-11T23:39:01Z',
                field1: 1,
            },
            {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.196',
                date2: '2018-10-10T23:39:01Z',
                field1: 1,
            },
            {
                date1: '2018-09-09T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-10T23:39:01Z',
                field1: 1,
            },
        ],
        [true, false, false, false, false],
        { date1: FieldType.Date, ip_field: FieldType.IP, date2: FieldType.Date },
    ],
    [
        'can can complex queries part6',
        'field1:m?-?????*.blahblah AND ip_field:[192.168.196.145 TO 192.168.196.195] AND date:[2018-09-30T23:20:01Z TO *]',
        [
            { field1: 12343, ip_field: '192.168.196.145', date: '2048-09-30T23:20:01Z' },
            { field1: [{ some: 'stuff' }], ip_field: '192.168.196.145', date: '2017-09-30T23:20:01Z' },
            { field1: 'm1-234567.blahblah', ip_field: '192.168.196.145', date: '2048-09-30T23:20:01Z' },
            { field1: 'm1-234567.blahblah', ip_field: '192.168.196.144', date: '2048-09-30T23:20:01Z' },
            { field1: 'something else', ip_field: '192.168.196.145', date: '2048-09-30T23:20:01Z' },
        ],
        [false, false, true, false, false],
        { ip_field: FieldType.IP, date: FieldType.Date },
    ],
];
