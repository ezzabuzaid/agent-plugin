// Parse and write JSON numbers past 2^53 without losing digits.
const TEXT = '{"id":12345678901234567890,"count":42,"ratio":1.5,"debt":-98765432109876543210,"label":"12345678901234567890","list":[9007199254740993]}';
// JSON.parse hands a reviver the source text of each number.
const bigIntegers = (key, value, { source }) =>
  typeof value === 'number' && !Number.isSafeInteger(value) && /^-?\d+$/.test(source) ? BigInt(source) : value;
const rawBigInts = (key, value) => (typeof value === 'bigint' ? JSON.rawJSON(String(value)) : value);
const VALUE = () => ({ id: 12345678901234567890n, count: 42, label: 'x', list: [1n, 2] });

export default {
  apis: ['js:JSON.parse', 'js:JSON.stringify', 'js:JSON.rawJSON'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'json-bigint@1.0.0': {
      // json-bigint builds null-prototype objects; structuredClone makes them
      // plain so the values can be compared, and the prototype row records it.
      default: {
        native: () => JSON.parse(TEXT, bigIntegers),
        package: ({ default: JSONbig }) => structuredClone(JSONbig({ useNativeBigInt: true }).parse(TEXT)),
      },
      'default: prototype': {
        gap: 'json-bigint parses objects with a null prototype; JSON.parse gives plain objects',
        native: () => Object.getPrototypeOf(JSON.parse(TEXT, bigIntegers)) === Object.prototype,
        package: ({ default: JSONbig }) => Object.getPrototypeOf(JSONbig({ useNativeBigInt: true }).parse(TEXT)) === Object.prototype,
      },
      stringify: {
        native: () => JSON.stringify(VALUE(), rawBigInts),
        package: ({ default: JSONbig }) => JSONbig.stringify(VALUE()),
      },
      parse: {
        gap: 'JSONbig.parse without useNativeBigInt gives bignumber.js BigNumber objects; the native reviver gives bigint',
        native: () => typeof JSON.parse(TEXT, bigIntegers).id,
        package: ({ default: JSONbig }) => typeof JSONbig.parse(TEXT).id,
      },
    },
    'lossless-json@4.3.3': {
      stringify: {
        native: () => JSON.stringify(VALUE(), rawBigInts),
        package: ({ stringify }) => stringify(VALUE()),
      },
      parse: {
        gap: 'lossless-json parses every number into a LosslessNumber object; the native reviver keeps safe numbers as numbers',
        native: () => typeof JSON.parse(TEXT, bigIntegers).count,
        package: ({ parse }) => typeof parse(TEXT).count,
      },
      parseNumberAndBigInt: {
        gap: 'parseNumberAndBigInt turns every integer, even 42, into a bigint; the native reviver above turns only unsafe integers into bigint',
        native: () => JSON.parse(TEXT, bigIntegers).count,
        package: ({ parse, parseNumberAndBigInt }) => parse(TEXT, null, parseNumberAndBigInt).count,
      },
      'parse: number source text': {
        native: () => JSON.parse('{"x":0.1000000000000000055511151231257827}', (key, value, { source }) => (key === 'x' ? source : value)),
        package: ({ parse }) => parse('{"x":0.1000000000000000055511151231257827}', null, (text) => text),
      },
      'parse: duplicate keys': {
        gap: 'lossless-json throws on a duplicate key; JSON.parse keeps the last value',
        native: () => JSON.parse('{"a":1,"a":2}'),
        package: ({ parse }) => {
          try {
            return parse('{"a":1,"a":2}');
          } catch {
            return 'refused';
          }
        },
      },
    },
  },
};
