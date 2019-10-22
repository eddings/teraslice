/* eslint-disable quotes */
import { FieldType, ASTType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    [
        'bar',
        'an unquoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: false,
            field: null,
            value: 'bar',
        },
    ],
    [
        'foo bar',
        'an unquoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: false,
            field: null,
            value: 'foo bar',
        },
    ],
    [
        '"foo"',
        'a quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: null,
            quoted: true,
            value: 'foo',
        },
    ],
    [
        "'foo'",
        'a quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: null,
            quoted: true,
            value: 'foo',
        },
    ],
    [
        '\\"foo\\"',
        'an escaped quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: null,
            quoted: false,
            value: '\\"foo\\"',
        },
    ],
    [
        'foo:\\"bar\\"',
        'field with escaped quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: '\\"bar\\"',
        },
    ],
    [
        'foo:\\"bar',
        'field with one escaped quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: '\\"bar',
        },
        {
            foo: FieldType.String
        }
    ],
    [
        'foo:"\\""',
        'field with using a quoted escaped quote',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: true,
            value: '"',
        },
        {
            foo: FieldType.String
        }
    ],
    [
        'foo:bar',
        'field with string value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
        {
            foo: FieldType.String
        }
    ],
    [
        'foo:   bar',
        'field with space between string value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
    [
        'foo:"bar"',
        'field with quoted string value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: true,
            value: 'bar',
        },
        {
            foo: FieldType.String
        }
    ],
    [
        "foo:'bar'",
        'field with single quoted string value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: true,
            value: 'bar',
        },
        {
            foo: FieldType.String
        }
    ],
    [
        'count:123',
        'field with no type and unquoted integer value',
        {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            field: 'count',
            value: 123,
        },
    ],
    [
        'count:"123"',
        'field with no type and quoted integer value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'count',
            quoted: true,
            value: '123',
        },
    ],
    [
        'count:"123"',
        'field with integer type and quoted integer value',
        {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            field: 'count',
            value: 123,
        },
        {
            count: FieldType.Integer
        }
    ],
    [
        'count:"22.5"',
        'field with integer type and quoted float value',
        {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            field: 'count',
            value: 22,
        },
        {
            count: FieldType.Integer
        }
    ],
    [
        'count:22.5',
        'field with integer type and unquoted float value',
        {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            field: 'count',
            value: 22,
        },
        {
            count: FieldType.Integer
        }
    ],
    [
        'count_str:123',
        'field with unqouted string type that is numeric',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'count_str',
            quoted: false,
            value: '123',
        },
        {
            count_str: 'string'
        }
    ],
    [
        'large_numeric_str:4555029426647693529',
        'field with unqouted string type that is large numeric value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'large_numeric_str',
            quoted: false,
            value: '4555029426647693529',
        },
        {
            large_numeric_str: 'string'
        }
    ],
    [
        'cash:50.50',
        'field with float value',
        {
            type: ASTType.Term,
            field_type: FieldType.Float,
            field: 'cash',
            value: 50.5,
        },
        {
            cash: FieldType.Float
        }
    ],
    [
        'cash:"50.50"',
        'field no type and quoted float value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'cash',
            quoted: true,
            value: '50.50',
        },
    ],
    [
        'cash:"50.50"',
        'field with float type and quoted float value',
        {
            type: ASTType.Term,
            field_type: FieldType.Float,
            field: 'cash',
            value: 50.50,
        },
        {
            cash: FieldType.Float
        }
    ],
    [
        'bool:false',
        'field with bool false',
        {
            type: ASTType.Term,
            field_type: FieldType.Boolean,
            field: 'bool',
            value: false,
        },
    ],
    [
        'bool:true',
        'field type of string with bool',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'bool',
            value: 'true',
        },
        {
            bool: FieldType.String
        }
    ],
    [
        'bool:"false"',
        'field type of boolean with string "false"',
        {
            type: ASTType.Term,
            field_type: FieldType.Boolean,
            field: 'bool',
            value: false,
        },
        {
            bool: FieldType.Boolean
        }
    ],
    [
        'bool:"true"',
        'field with no type with a quoted boolean',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'bool',
            value: 'true',
        },
    ],
    [
        'fo?:bar',
        'field name with wildcard',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'fo?',
            value: 'bar',
        },
    ],
    [
        'foo:"ba?"',
        'field with q quoted wildcard',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: true,
            value: 'ba?',
        },
    ],
    [
        'val:(155 223)',
        'a field with parens unqouted integers',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'val',
            quoted: false,
            value: '155 223',
        },
    ],
    [
        '(155 223)',
        'a parens unqouted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: null,
            quoted: false,
            value: '155 223',
        },
    ],
    [
        '(foo:bar)',
        'a field value with parens',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
    [
        'id:some"thing"else',
        'an inner double quoted string string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: false,
            field: 'id',
            value: 'some"thing"else',
        },
    ],
    [
        "id:some'other'thing",
        'an inner single quoted string string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: false,
            field: 'id',
            value: "some'other'thing",
        },
    ],
    [
        // eslint-disable-next-line quotes
        "id:some\\\"thing\\\"else",
        'an inner quoted string string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: false,
            field: 'id',
            value: 'some\\"thing\\"else',
        },
    ],
    [
        'id:"some \\"thing\\" else"',
        'an inner quoted string with spaces',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'id',
            value: 'some "thing" else',
        },
    ],

    [
        'id:"some thing else"',
        'a quoted multiword string with spaces',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'id',
            value: 'some thing else',
        },
    ],
    [
        'id:"some \\"thing\\" else"',
        'an inner doublequoted string with spaces with outer single quoted',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'id',
            value: 'some "thing" else',
        },
    ],
    [
        'id:\'some \\"thing\\" else\'',
        'an inner doublequoted string with spaces with outer double quoted',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'id',
            value: 'some "thing" else',
        },
    ],
    [
        "foo:'\"bar\"'",
        'double quoted escaped value at start and end',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'foo',
            value: '"bar"',
        },
    ],

    [
        "foo:'\"ba\\'r\"'",
        'value with single quotes at the start, middle and end',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'foo',
            value: '"ba\'r"',
        },
    ],
    [
        'foo:"\\"bar\\""',
        'double quoted escaped value at start and end',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'foo',
            value: '"bar"',
        },
    ],
    [
        `field:'/value\\\\'`,
        'value with ending double escaped',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'field',
            value: `/value\\\\`,
        },
    ],
    [
        `field:"/value\\\\"`,
        'quoted value with ending double escaped',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            field: 'field',
            value: `/value\\\\`,
        },
    ],
] as TestCase[];
