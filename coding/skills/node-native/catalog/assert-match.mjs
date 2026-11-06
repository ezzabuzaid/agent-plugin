// String pattern assertions: match passes when a string matches a RegExp,
// doesNotMatch when it does not.
import assert from 'node:assert/strict';
import { verdict } from './support/assertion.mjs';

const regexpCases = [
  ['abc', /b/],
  ['abc', /z/],
  ['line one\nline two', /^line two$/m],
];
const both = (match, doesNotMatch) =>
  regexpCases.flatMap(([text, pattern]) => [verdict(() => match(text, pattern)), verdict(() => doesNotMatch(text, pattern))]);

export default {
  apis: ['assert:assert.match', 'assert:assert.doesNotMatch'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'chai@6.3.0': {
      assert: {
        native: () => both(assert.match, assert.doesNotMatch),
        package: ({ assert: chai }) => both(chai.match, chai.notMatch),
      },
      'assert: non-string value': {
        gap: 'assert.match fails for a value that is not a string; chai turns it into a string first',
        native: () => verdict(() => assert.match(5, /5/)),
        package: ({ assert: chai }) => verdict(() => chai.match(5, /5/)),
      },
    },
    'expect@30.5.2': {
      expect: {
        native: () => both(assert.match, assert.doesNotMatch),
        package: ({ expect }) =>
          both(
            (text, pattern) => expect(text).toMatch(pattern),
            (text, pattern) => expect(text).not.toMatch(pattern),
          ),
      },
      'expect: substring': {
        gap: 'assert.match takes only a RegExp and throws a TypeError for a string; toMatch also takes a substring',
        native: () => verdict(() => assert.match('abc', 'b')),
        package: ({ expect }) => verdict(() => expect('abc').toMatch('b')),
      },
    },
  },
};
