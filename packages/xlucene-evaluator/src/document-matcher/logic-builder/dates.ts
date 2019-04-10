
import _ from 'lodash';
import dateFns from 'date-fns';
import { Term, Range } from '../../parser';
import { isInfiniteMax, isInfiniteMin, ParseNodeRangeResult } from '../../utils';
import { DateInput } from '../../interfaces';

// TODO: handle datemath

export function compareTermDates(node: Term) {
    const nodeTermTime = convert(node.value as string);
    if (!nodeTermTime) throw new Error(`was not able to convert ${node.value} to a date value`);
    return (date: string) =>  convert(date) === nodeTermTime;
}

function parseRange(node:Range): ParseNodeRangeResult {
    const results = {};
    results[node.left.operator] = node.left.value;
    if (node.right) results[node.right.operator] = node.right.value;
    return results;
}

export function dateRange(node: Range) {
    const rangeQuery = parseRange(node);
    const incMin = rangeQuery.gte != null;
    const incMax = rangeQuery.lte != null;
    let minValue = rangeQuery.gte || rangeQuery.gt || '*';
    let maxValue = rangeQuery.lte || rangeQuery.lt || '*';

    // javascript min/max date allowable http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
    if (isInfiniteMin(minValue)) minValue = -8640000000000000;
    if (isInfiniteMax(maxValue)) maxValue = 8640000000000000;

    if (!incMin) {
        const convertedValue = typeof minValue === 'number' ? minValue : convert(minValue as DateInput);
        if (!convertedValue) throw new Error(`was not able to convert ${minValue} to a date value`);
        minValue = convertedValue + 1;
    }
    if (!incMax) {
        const convertedValue = typeof maxValue === 'number' ? maxValue : convert(maxValue as DateInput);
        if (!convertedValue) throw new Error(`was not able to convert ${maxValue} to a date value`);
        maxValue = convertedValue - 1;
    }
    return (date: string) =>  dateFns.isWithinRange(date, minValue as DateInput, maxValue as DateInput);
}

function convert(value: DateInput): number | null {
    const results = new Date(value).getTime();
    if (results) return results;
    return null;
}
