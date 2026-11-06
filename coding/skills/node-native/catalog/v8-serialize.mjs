// Turning a value with Dates, Maps, Sets, BigInts and cycles into bytes and back.
import { deserialize, serialize } from 'node:v8';
import { outcome } from './support/outcome.mjs';

const rich = {
  date: new Date(0),
  map: new Map([[1, { a: 1 }]]),
  set: new Set(['x']),
  pattern: /a+/gi,
  big: 10n,
  holes: [undefined],
  numbers: [Number.NaN, -0, -Infinity],
  bytes: new Uint8Array([1, 2]),
};
const roundTrip = (value) => deserialize(serialize(value));
const cyclic = () => {
  const node = { name: 'loop' };
  node.self = node;
  return node;
};

export default {
  apis: ['v8:v8.serialize', 'v8:v8.deserialize'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'superjson@2.2.6': {
      parse: {
        native: () => roundTrip(rich),
        package: ({ default: superjson }) => superjson.parse(superjson.stringify(rich)),
      },
      'parse: cycle': {
        native: () => {
          const copy = roundTrip(cyclic());
          return copy.self === copy;
        },
        package: ({ default: superjson }) => {
          const copy = superjson.parse(superjson.stringify(cyclic()));
          return copy.self === copy;
        },
      },
      deserialize: {
        native: () => roundTrip(rich),
        package: ({ default: superjson }) => superjson.deserialize(superjson.serialize(rich)),
      },
      'stringify: output': {
        gap: 'serialize gives a Buffer in V8 wire format that only V8 reads; superjson gives JSON text a browser can parse',
        native: () => typeof serialize(rich),
        package: ({ default: superjson }) => typeof superjson.stringify(rich),
      },
      'parse: URL': {
        gap: 'a URL comes back as an empty object',
        native: () => String(roundTrip({ url: new URL('https://example.com/') }).url),
        package: ({ default: superjson }) => String(superjson.parse(superjson.stringify({ url: new URL('https://example.com/') })).url),
      },
      'parse: function': {
        gap: 'throws on a function ("could not be cloned"); superjson leaves it out',
        native: () => outcome(() => roundTrip({ run: () => 1 })),
        package: ({ default: superjson }) => outcome(() => superjson.parse(superjson.stringify({ run: () => 1 }))),
      },
      registerClass: {
        gap: 'a class instance comes back as a plain object; superjson keeps a registered class',
        native: () => {
          class Point {
            x = 1;
          }
          return roundTrip(new Point()).constructor.name;
        },
        package: ({ default: superjson }) => {
          class Point {
            x = 1;
          }
          const local = new superjson();
          local.registerClass(Point);
          return local.parse(local.stringify(new Point())).constructor.name;
        },
      },
    },
  },
};
