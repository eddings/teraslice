import 'jest-extended';
import { Example } from '../src';

describe('Example', () => {
    const example = new Example();

    it('should be an instance of Example', () => {
        expect(example).toBeInstanceOf(Example);
    });
});
