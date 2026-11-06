// Assertions on a throw or a rejection: pass when the function throws (or the
// promise rejects) with an error that matches a class, a RegExp, an object of
// expected properties or a validation function.
import assert from 'node:assert/strict';
import { verdict } from './support/assertion.mjs';

const boom = () => {
  const error = new RangeError('out of range: 7');
  error.code = 'E_RANGE';
  throw error;
};
const quiet = () => 1;
const outcomes = (checks) => Promise.all(checks.map(verdict));

// The native form of every case.
const native = {
  classMatches: () => assert.throws(boom, RangeError),
  classDiffers: () => assert.throws(boom, TypeError),
  regexpMatches: () => assert.throws(boom, /range: 7/),
  regexpDiffers: () => assert.throws(boom, /nope/),
  nothingThrown: () => assert.throws(quiet),
  propertiesMatch: () => assert.throws(boom, { name: 'RangeError', code: 'E_RANGE' }),
  propertiesDiffer: () => assert.throws(boom, { code: 'E_OTHER' }),
  errorInstance: () => assert.throws(boom, new RangeError('out of range: 7')),
  doesNotThrow: () => assert.doesNotThrow(quiet),
  doesNotThrowFails: () => assert.doesNotThrow(boom),
  stringMessage: () => assert.throws(boom, 'nope'),
};
const nativeOf = (keys) => () => outcomes(keys.map((key) => native[key]));

const chaiChecks = (chai) => ({
  classMatches: () => chai.throws(boom, RangeError),
  classDiffers: () => chai.throws(boom, TypeError),
  regexpMatches: () => chai.throws(boom, /range: 7/),
  regexpDiffers: () => chai.throws(boom, /nope/),
  nothingThrown: () => chai.throws(quiet),
  doesNotThrow: () => chai.doesNotThrow(quiet),
  doesNotThrowFails: () => chai.doesNotThrow(boom),
});
const expectChecks = (expect) => ({
  classMatches: () => expect(boom).toThrow(RangeError),
  classDiffers: () => expect(boom).toThrow(TypeError),
  regexpMatches: () => expect(boom).toThrow(/range: 7/),
  regexpDiffers: () => expect(boom).toThrow(/nope/),
  nothingThrown: () => expect(quiet).toThrow(),
  propertiesMatch: () => expect(boom).toThrow(expect.objectContaining({ name: 'RangeError', code: 'E_RANGE' })),
  propertiesDiffer: () => expect(boom).toThrow(expect.objectContaining({ code: 'E_OTHER' })),
  errorInstance: () => expect(boom).toThrow(new RangeError('out of range: 7')),
  doesNotThrow: () => expect(quiet).not.toThrow(),
  doesNotThrowFails: () => expect(boom).not.toThrow(),
});
const chaiCases = Object.keys(chaiChecks({}));
const expectCases = Object.keys(expectChecks({}));

const rejected = (reason) => Promise.reject(reason);
// expect reports a promise that resolved where it should reject with a plain
// Error; both sides fail the test, so the probe reads any throw as a failure.
const failed = async (assertion) => {
  try {
    await assertion();
    return 'pass';
  } catch {
    return 'fail';
  }
};

export default {
  apis: ['assert:assert.throws', 'assert:assert.rejects', 'assert:assert.doesNotThrow', 'assert:assert.doesNotReject'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'chai@6.3.0': {
      assert: {
        native: nativeOf(chaiCases),
        package: ({ assert: chai }) => outcomes(Object.values(chaiChecks(chai))),
      },
      'assert: string matcher': {
        gap: 'a string as the second argument of assert.throws is the failure message, so any throw passes; chai matches it against the error message',
        native: nativeOf(['stringMessage']),
        package: ({ assert: chai }) => outcomes([() => chai.throws(boom, 'nope')]),
      },
      'assert: error instance': {
        gap: 'native matches an expected error instance by its properties; chai passes only for the same instance',
        native: nativeOf(['errorInstance']),
        package: ({ assert: chai }) => outcomes([() => chai.throws(boom, new RangeError('out of range: 7'))]),
      },
    },
    'expect@30.5.2': {
      expect: {
        native: nativeOf(expectCases),
        package: ({ expect }) => outcomes(Object.values(expectChecks(expect))),
      },
      'expect: string matcher': {
        gap: 'a string as the second argument of assert.throws is the failure message, so any throw passes; toThrow matches it against the error message',
        native: nativeOf(['stringMessage']),
        package: ({ expect }) => outcomes([() => expect(boom).toThrow('nope')]),
      },
      'expect: rejects': {
        native: () =>
          Promise.all([
            failed(() => assert.rejects(rejected(new RangeError('x')), RangeError)),
            failed(() => assert.rejects(rejected(new RangeError('x')), TypeError)),
            failed(() => assert.rejects(Promise.resolve(1))),
            failed(() => assert.rejects(rejected('reason'), (reason) => reason === 'reason')),
          ]),
        package: ({ expect }) =>
          Promise.all([
            failed(() => expect(rejected(new RangeError('x'))).rejects.toThrow(RangeError)),
            failed(() => expect(rejected(new RangeError('x'))).rejects.toThrow(TypeError)),
            failed(() => expect(Promise.resolve(1)).rejects.toThrow()),
            failed(() => expect(rejected('reason')).rejects.toBe('reason')),
          ]),
      },
      'expect: rejects a non-error': {
        gap: 'assert.rejects with no matcher passes for any rejection; rejects.toThrow() fails when the reason is not an Error',
        native: () => failed(() => assert.rejects(rejected('reason'))),
        package: ({ expect }) => failed(() => expect(rejected('reason')).rejects.toThrow()),
      },
      'expect: resolves': {
        native: () =>
          Promise.all([failed(() => assert.doesNotReject(Promise.resolve(1))), failed(() => assert.doesNotReject(rejected(new Error('x'))))]),
        package: ({ expect }) =>
          Promise.all([failed(() => expect(Promise.resolve(1)).resolves.toBe(1)), failed(() => expect(rejected(new Error('x'))).resolves.toBe(1))]),
      },
    },
  },
};
