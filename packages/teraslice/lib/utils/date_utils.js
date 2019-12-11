'use strict';

function dateOptions(value) {
    const options = {
        year: 'y',
        years: 'y',
        y: 'y',
        months: 'M',
        month: 'M',
        mo: 'M',
        mos: 'M',
        M: 'M',
        weeks: 'w',
        week: 'w',
        wks: 'w',
        wk: 'w',
        w: 'w',
        days: 'd',
        day: 'd',
        d: 'd',
        hours: 'h',
        hour: 'h',
        hr: 'h',
        hrs: 'h',
        h: 'h',
        minutes: 'm',
        minute: 'm',
        min: 'm',
        mins: 'm',
        m: 'm',
        seconds: 's',
        second: 's',
        s: 's',
        milliseconds: 'ms',
        millisecond: 'ms',
        ms: 'ms'
    };

    if (options[value]) {
        return options[value];
    }

    throw new Error(`the time descriptor of "${value}" for the interval is malformed`);
}

function timeseriesIndex(timeseriesFormat, index, dateStr) {
    const timestamp = new Date().toISOString();
    const formatter = { daily: 10, monthly: 7, yearly: 4 };
    const dateString = dateStr || timestamp;
    return { index: `${index}-${dateString.slice(0, formatter[timeseriesFormat]).replace(/-/g, '.')}`, timestamp };
}

module.exports = {
    dateOptions,
    timeseriesIndex
};
