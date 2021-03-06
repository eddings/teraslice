/** Convert any input into a boolean, this will work with stringified boolean */
export function toBoolean(input: any): boolean {
    if (isFalsy(input)) return false;
    if (isTruthy(input)) return true;

    return Boolean(input);
}

const _falsy = Object.freeze({
    0: true,
    false: true,
    no: true,
});

const _truthy = Object.freeze({
    1: true,
    true: true,
    yes: true,
});

export function isTruthy(input: any): boolean {
    if (input === true) return true;
    const val = typeof input === 'string' ? input.trim().toLowerCase() : String(input);
    return _truthy[val] === true;
}

export function isFalsy(input: any): boolean {
    if (input === false || input == null || input === '') return true;
    const val = typeof input === 'string' ? input.trim().toLowerCase() : String(input);
    return _falsy[val] === true;
}

export function isBoolean(input: any): input is boolean {
    if (typeof input === 'boolean') return true;
    return false;
}

export function isBooleanLike(input: any): boolean {
    return isFalsy(input) || isTruthy(input);
}
