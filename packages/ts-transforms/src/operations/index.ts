/* eslint-disable max-classes-per-file */
import OperationBase from './lib/base';
import TransformOpBase from './lib/transforms/base';
import ValidationOpBase from './lib/validations/base';

import Join from './lib/transforms/join';
import Selector from './lib/transforms/selector';
import Extraction from './lib/transforms/extraction';
import Base64Decode from './lib/transforms/base64decode';
import UrlDecode from './lib/transforms/urldecode';
import HexDecode from './lib/transforms/hexdecode';
import JsonParse from './lib/transforms/jsonparse';
import Lowercase from './lib/transforms/lowercase';
import Uppercase from './lib/transforms/uppercase';
import MakeArray from './lib/transforms/array';
import Dedup from './lib/transforms/dedup';
import Trim from './lib/transforms/trim';
import Base64Encode from './lib/transforms/base64encode';
import UrlEncode from './lib/transforms/urlencode';
import HexEncode from './lib/transforms/hexencode';
import Md5Encode from './lib/transforms/md5encode';
import Sha1Encode from './lib/transforms/sha1encode';
import Sha2Encode from './lib/transforms/sha2encode';

import Geolocation from './lib/validations/geolocation';
import StringValidation from './lib/validations/string';
import NumberValidation from './lib/validations/number';
import BooleanValidation from './lib/validations/boolean';
import Url from './lib/validations/url';
import Email from './lib/validations/email';
import Ip from './lib/validations/ip';
import MacAddress from './lib/validations/mac-address';
import Uuid from './lib/validations/uuid';
import ISDN from './lib/validations/isdn';
import { Validator, ValidatorPlugins } from './lib/validations/validator';

import {
    OperationsDict, PluginClassType, BaseOperationClass, PluginList
} from '../interfaces';

class CorePlugins implements PluginClassType {
    init(): OperationsDict {
        return {
            join: Join,
            selector: Selector,
            extraction: Extraction,
            geolocation: Geolocation,
            string: StringValidation,
            boolean: BooleanValidation,
            number: NumberValidation,
            url: Url,
            email: Email,
            ip: Ip,
            base64decode: Base64Decode,
            urldecode: UrlDecode,
            hexdecode: HexDecode,
            macaddress: MacAddress,
            isdn: ISDN,
            uuid: Uuid,
            jsonparse: JsonParse,
            lowercase: Lowercase,
            uppercase: Uppercase,
            array: MakeArray,
            dedup: Dedup,
            trim: Trim,
            base64encode: Base64Encode,
            urlencode: UrlEncode,
            hexencode: HexEncode,
            md5encode: Md5Encode,
            sha1encode: Sha1Encode,
            sha2encode: Sha2Encode,
        };
    }
}

class OperationsManager {
    operations: OperationsDict;

    constructor(pluginList: PluginList = []) {
        pluginList.push(CorePlugins);
        // @ts-ignore FIXME: try to remove this ignore
        pluginList.push(ValidatorPlugins);
        const operations = pluginList.reduce((plugins, PluginClass) => {
            const plugin = new PluginClass();
            const pluginOps = plugin.init();
            Object.assign(plugins, pluginOps);
            return plugins;
        }, {});

        this.operations = operations;
    }

    getTransform(name: string): BaseOperationClass {
        const op = this.operations[name];
        if (!op) throw new Error(`could not find transform module ${name}`);
        return op;
    }
}

export {
    OperationBase,
    TransformOpBase,
    ValidationOpBase,
    Join,
    Selector,
    Extraction,
    Geolocation,
    StringValidation,
    NumberValidation,
    BooleanValidation,
    Url,
    Email,
    Ip,
    Base64Decode,
    UrlDecode,
    HexDecode,
    OperationsManager,
    MacAddress,
    Uuid,
    ISDN,
    Validator,
    CorePlugins,
    JsonParse,
    Lowercase,
    Uppercase,
    MakeArray,
    Dedup,
    Trim,
    Base64Encode,
    UrlEncode,
    HexEncode,
    Md5Encode,
    Sha1Encode,
    Sha2Encode
};
