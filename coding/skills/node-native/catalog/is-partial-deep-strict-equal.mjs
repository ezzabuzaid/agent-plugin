// Partial deep equality: does a value contain everything another value describes?
import { isPartialDeepStrictEqual } from 'node:util';

const cases = {
  subset: () => [{ a: 1, b: { c: 2, d: 3 } }, { b: { c: 2 } }],
  arrayPrefix: () => [{ a: [1, 2, 3] }, { a: [1] }],
  arrayMember: () => [{ a: [1, 2, 3] }, { a: [2] }],
  mismatch: () => [{ a: 1 }, { a: 2 }],
  set: () => [new Set([1, 2, 3]), new Set([2])],
  map: () => [new Map([[1, 1], [2, 2]]), new Map([[2, 2]])],
  nan: () => [{ a: NaN }, { a: NaN }],
  missingUndefined: () => [{}, { a: undefined }],
};
const agree = Object.values(cases);
const negativeZero = () => [{ a: 0 }, { a: -0 }];

const rows = (name, isMatch) => ({
  [name]: {
    native: () => agree.map((pair) => isPartialDeepStrictEqual(...pair())),
    package: (module) => agree.map((pair) => isMatch(module, ...pair())),
  },
  [`${name}: negative zero`]: {
    gap: '0 and -0 are different values natively (Object.is); the package calls them equal',
    native: () => isPartialDeepStrictEqual(...negativeZero()),
    package: (module) => isMatch(module, ...negativeZero()),
  },
});

export default {
  apis: ['util:util.isPartialDeepStrictEqual'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'lodash.ismatch@4.4.0': rows('default', ({ default: isMatch }, object, source) => isMatch(object, source)),
    'lodash@4.18.1': rows('isMatch', ({ default: _ }, object, source) => _.isMatch(object, source)),
    'lodash-es@4.18.1': rows('isMatch', ({ isMatch }, object, source) => isMatch(object, source)),
  },
  lint: {
    banLodashIsMatch: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import isMatch from 'lodash.ismatch';",
    },
  },
};
