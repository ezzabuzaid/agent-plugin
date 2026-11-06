// A readable string form of any value, for logs and debug output.
import { inspect } from 'node:util';

const same = () => [{ a: 1, b: 's' }, [1, 2], 'x', null, undefined, 1n, Symbol('s'), function named() {}, /a/g, Object.create(null), { a: { b: { c: 1 } } }];

export default {
  apis: ['util:util.inspect'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'object-inspect@1.13.4': {
      default: {
        native: () => same().map((value) => inspect(value)),
        package: ({ default: objectInspect }) => same().map((value) => objectInspect(value)),
      },
      'default: Map and Set': {
        gap: 'collections print as "Map(1) { 1 => 2 }", not "Map (1) {1 => 2}"',
        native: () => [inspect(new Map([[1, 2]])), inspect(new Set([1]))],
        package: ({ default: objectInspect }) => [objectInspect(new Map([[1, 2]])), objectInspect(new Set([1]))],
      },
      'default: depth': {
        gap: 'objects deeper than 2 levels print as [Object] by default; object-inspect prints 5 levels',
        native: () => inspect({ a: { b: { c: { d: 1 } } } }),
        package: ({ default: objectInspect }) => objectInspect({ a: { b: { c: { d: 1 } } } }),
      },
      'default: Error': {
        gap: 'an Error prints with its stack; object-inspect prints [Error: message]',
        native: () => inspect(new Error('e')),
        package: ({ default: objectInspect }) => objectInspect(new Error('e')),
      },
    },
  },
};
