// Tell whether a value is a real Error object.
import { runInNewContext } from 'node:vm';

// Values every candidate judges the same way: a real error, one from another
// realm, a DOMException, an error-shaped plain object, and a non-object.
const agreed = () => [new TypeError('x'), runInNewContext('new Error("x")'), new DOMException('x'), { name: 'Error', message: 'x' }, 'Error'];
const judge = (isError, values) => values.map((value) => isError(value));
const inheritsOnly = () => [Object.create(Error.prototype)];
const tagged = () => [{ [Symbol.toStringTag]: 'Error' }];
const otherRealm = () => [runInNewContext('new Error("x")')];

// lodash and lodash-es export the same isError; `lodash` reads it from the module.
const lodashRows = (lodash) => ({
  isError: {
    native: () => judge(Error.isError, agreed()),
    package: (module) => judge(lodash(module).isError, agreed()),
  },
  'isError: inherits Error.prototype': {
    gap: 'lodash says true for an object that only inherits Error.prototype; Error.isError checks for a real error',
    native: () => judge(Error.isError, inheritsOnly()),
    package: (module) => judge(lodash(module).isError, inheritsOnly()),
  },
});

export default {
  apis: ['js:Error.isError'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-error@2.2.2': {
      default: {
        native: () => judge(Error.isError, agreed()),
        package: ({ default: isError }) => judge(isError, agreed()),
      },
      'default: inherits Error.prototype': {
        gap: 'is-error says true for an object that only inherits Error.prototype; Error.isError checks for a real error',
        native: () => judge(Error.isError, inheritsOnly()),
        package: ({ default: isError }) => judge(isError, inheritsOnly()),
      },
      'default: Symbol.toStringTag': {
        gap: 'is-error says true for an object whose Symbol.toStringTag is "Error"; Error.isError says false',
        native: () => judge(Error.isError, tagged()),
        package: ({ default: isError }) => judge(isError, tagged()),
      },
    },
    'lodash@4.18.1': lodashRows(({ default: _ }) => _),
    'lodash-es@4.18.1': lodashRows((lodashEs) => lodashEs),
    'es-toolkit@1.53.1': {
      isError: {
        native: () => judge(Error.isError, [new TypeError('x'), new DOMException('x'), { name: 'Error', message: 'x' }, 'Error']),
        package: ({ isError }) => judge(isError, [new TypeError('x'), new DOMException('x'), { name: 'Error', message: 'x' }, 'Error']),
      },
      'isError: other realm': {
        improves: 'Error.isError says true for an error from another realm (vm, iframe); es-toolkit uses instanceof, so it says false',
        native: () => judge(Error.isError, otherRealm()),
        package: ({ isError }) => judge(isError, otherRealm()),
      },
      'isError: inherits Error.prototype': {
        gap: 'es-toolkit says true for an object that only inherits Error.prototype; Error.isError checks for a real error',
        native: () => judge(Error.isError, inheritsOnly()),
        package: ({ isError }) => judge(isError, inheritsOnly()),
      },
    },
  },
  idioms: {
    instanceofError: {
      seed: 'instanceof Error\\b',
      native: () => judge(Error.isError, [new TypeError('x'), { message: 'x' }, null]),
      idiom: () => judge((value) => value instanceof Error, [new TypeError('x'), { message: 'x' }, null]),
    },
    'instanceofError: other realm': {
      improves: 'Error.isError says true for an error from another realm (vm, iframe); instanceof Error says false',
      native: () => judge(Error.isError, otherRealm()),
      idiom: () => judge((value) => value instanceof Error, otherRealm()),
    },
    'instanceofError: inherits Error.prototype': {
      gap: 'instanceof Error is true for an object that only inherits Error.prototype; Error.isError checks for a real error',
      native: () => judge(Error.isError, inheritsOnly()),
      idiom: () => judge((value) => value instanceof Error, inheritsOnly()),
    },
    toStringTag: {
      seed: "\\[object Error\\]",
      gap: "Object.prototype.toString says '[object Error]' for any object whose Symbol.toStringTag is \"Error\"; Error.isError says false",
      native: () => judge(Error.isError, tagged()),
      idiom: () => judge((value) => Object.prototype.toString.call(value) === '[object Error]', tagged()),
    },
  },
  lint: {
    instanceofError: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-error-is-error',
      idiom: 'instanceofError',
      on: 'modern-node/recommended',
      code: 'const failed = value instanceof Error;',
    },
    toStringTag: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-error-is-error',
      idiom: 'toStringTag',
      on: 'modern-node/recommended',
      code: "const failed = Object.prototype.toString.call(value) === '[object Error]';",
    },
  },
};
