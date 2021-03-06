/* eslint-disable quotes */
import { xLuceneFieldType } from '@terascope/types';
import { escapeString } from '@terascope/utils';
import { ASTType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    [
        'bar',
        'an unquoted string',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: false,
            value: '\\"bar',
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'foo:"\\""',
        'field with using a quoted escaped quote',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: true,
            value: '"',
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'foo:bar',
        'field with string value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'phone.tokens:3848',
        'an analyzed field',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'phone.tokens',
            quoted: false,
            analyzed: true,
            value: '3848',
        },
        {
            phone: xLuceneFieldType.String
        }
    ],
    [
        'foo:   bar',
        'field with space between string value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: true,
            value: 'bar',
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        "foo:'bar'",
        'field with single quoted string value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: true,
            value: 'bar',
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'count:123',
        'field with no type and unquoted integer value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: 123,
        },
    ],
    [
        'count:"123"',
        'field with no type and quoted integer value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: 123,
        },
        {
            count: xLuceneFieldType.Integer
        }
    ],
    [
        'count:"22.5"',
        'field with integer type and quoted float value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: 22,
        },
        {
            count: xLuceneFieldType.Integer
        }
    ],
    [
        'count:22.5',
        'field with integer type and unquoted float value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: 22,
        },
        {
            count: xLuceneFieldType.Integer
        }
    ],
    [
        'count_str:123',
        'field with unqouted string type that is numeric',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.Float,
            field: 'cash',
            value: 50.5,
        },
        {
            cash: xLuceneFieldType.Float
        }
    ],
    [
        'cash:"50.50"',
        'field no type and quoted float value',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.Float,
            field: 'cash',
            value: 50.50,
        },
        {
            cash: xLuceneFieldType.Float
        }
    ],
    [
        'bool:false',
        'field with bool false',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.Boolean,
            field: 'bool',
            value: false,
        },
    ],
    [
        'bool:true',
        'field type of string with bool',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'bool',
            value: 'true',
        },
        {
            bool: xLuceneFieldType.String
        }
    ],
    [
        'bool:"false"',
        'field type of boolean with string "false"',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.Boolean,
            field: 'bool',
            value: false,
        },
        {
            bool: xLuceneFieldType.Boolean
        }
    ],
    [
        'bool:"true"',
        'field with no type with a quoted boolean',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'bool',
            value: 'true',
        },
    ],
    [
        'fo?:bar',
        'field name with wildcard',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'fo?',
            value: 'bar',
        },
    ],
    [
        'foo:"ba?"',
        'field with q quoted wildcard',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
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
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'id',
            value: 'some"thing"else',
        },
    ],
    [
        'field:"valueSomething(abcd70576983)"',
        'a double qouted value with unescaped parens',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: "valueSomething(abcd70576983)",
        },
    ],
    [
        '"hi(hello)howdy"',
        'a field-less double qouted value with unescaped parens',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: null,
            value: "hi(hello)howdy",
        },
    ],
    [
        "field:' hello(123) there'",
        'a single qouted value with unescaped parens',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: " hello(123) there",
        },
    ],
    [
        "' :(hello)'",
        'a field-less single qouted value with unescaped parens',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: null,
            value: " :(hello)",
        },
    ],
    [
        "example: '+ -  ( ) { } [ ] ^ \\' \" ? & | / ~ * OR NOT'",
        'a single qouted value with all of the reserved characters',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'example',
            value: "+ -  ( ) { } [ ] ^ ' \" ? & | / ~ * OR NOT",
        },
    ],
    [
        'example: "+ -  ( ) { } [ ] ^ \' \\" ? & | / ~ * OR NOT" ',
        'a double qouted value with all of the reserved characters',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'example',
            value: "+ -  ( ) { } [ ] ^ ' \" ? & | / ~ * OR NOT",
        },
    ],
    [
        "id:some'other'thing",
        'an inner single quoted string string',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'id',
            value: "some'other'thing",
        },
    ],
    [
        `id:${escapeString('some\\"thing\\"else')}`,
        'an unqouted string with qoutes inside',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'id',
            value: 'some\\\\\\"thing\\\\\\"else',
        },
    ],
    [
        'id:"some thing else"',
        'a quoted multiword string with spaces',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'id',
            value: 'some thing else',
        },
    ],
    [
        `id:"${escapeString('some \\"thing\\" else')}"`,
        'a double qouted value with escaped double qoutes',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'id',
            value: 'some \\"thing\\" else',
        },
    ],
    [
        `id:'${escapeString('some\\ \\"thing\\" else')}'`,
        'a single qouted value with escaped double qoutes and spaces',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'id',
            value: 'some\\ \\"thing\\" else',
        },
    ],
    [
        "foo:'\"bar\"'",
        'double quoted escaped value at start and end',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'foo',
            value: '"bar"',
        },
    ],
    [
        `foo:'${escapeString(`"ba\\'r"`)}'`,
        'value with single quotes at the start, middle and end',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'foo',
            value: '"ba\\\'r"',
        },
    ],
    [
        'foo:"\\"bar\\""',
        'double quoted escaped value at start and end',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'foo',
            value: '"bar"',
        },
    ],
    [
        `field:'${escapeString('/value\\\\')}'`,
        'single qouted value with ending double escape',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: `/value\\\\`,
        },
    ],
    [
        `field:"${escapeString('/value\\\\')}"`,
        'double quoted value with ending double escape',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: `/value\\\\`,
        },
    ],
    [
        `field:$bar`,
        'variable with value is a string',
        {
            value: 'someValue',
            field: 'field',
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
        },
        {
            field: 'string'
        },
        {
            bar: 'someValue'
        }
    ],
    [
        `field:$bar`,
        'variable with value is a boolean',
        {
            value: false,
            field: 'field',
            type: ASTType.Term,
            field_type: xLuceneFieldType.Boolean,
        },
        {
            field: 'boolean'
        },
        {
            bar: false
        }
    ],
    [
        `field:$bar`,
        'variable with value is a number',
        {
            value: 2345,
            field: 'field',
            type: ASTType.Term,
            field_type: xLuceneFieldType.Integer,
        },
        {
            field: 'integer'
        },
        {
            bar: 2345
        }
    ],
    [
        'field:something.com',
        'can parse string values with dots',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            restricted: true,
            field: 'field',
            value: 'something.com',
        },
    ],
    [
        'field:false.com',
        'can parse string values that have true/false in them',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field',
            value: 'false.com',
        },
    ],
    [
        'field.right:false.com',
        'can parse string values that have true/false in them with fields that have dots',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field.right',
            value: 'false.com',
        },
    ],
    [
        'field.right:3.com',
        'can parse string values that have integers in them',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field.right',
            value: '3.com',
        },
    ],
    [
        'field.right:3.3.com',
        'can parse string values that have floats in them',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field.right',
            value: '3.3.com',
        },
    ],
] as TestCase[];
