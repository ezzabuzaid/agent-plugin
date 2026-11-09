// Parse and build application/x-www-form-urlencoded query strings.

// A query string as an object the way qs and query-string return one: a
// repeated key becomes an array of its values.
const toObject = (query) => {
  const params = new URLSearchParams(query);
  return Object.fromEntries(
    [...new Set(params.keys())].map((key) => {
      const values = params.getAll(key);
      return [key, values.length > 1 ? values : values[0]];
    }),
  );
};
// An object as a query string, an array value as one pair per item.
const toQuery = (object) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(object)) {
    for (const item of [value].flat()) params.append(key, item);
  }
  return params.toString();
};
// The pairs a query string decodes to, so two encodings of one form compare.
const decoded = (query) => [...new URLSearchParams(query)];
const flat = ['a=1&b=2', 'a=1&a=2', 'a=b%20c+d', 'a=', 'a=%E2%9C%93', 'a=1&&b=2', 'a.b=1'];
const parsedAll = (parse) => flat.map((query) => ({ ...parse(query) }));
const record = { b: '2', a: '1', n: 1, yes: true };
const ordered = (params) => {
  params.sort();
  return params.toString();
};

export default {
  apis: [
    'url:URLSearchParams',
    'url:new URLSearchParams',
    'url:urlSearchParams.getAll',
    'url:urlSearchParams.sort',
    'url:urlSearchParams.toString',
    'globals:URLSearchParams',
    'js:URLSearchParams',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'qs@6.17.1': {
      parse: {
        native: () => parsedAll(toObject),
        package: ({ default: qs }) => parsedAll(qs.parse),
      },
      'parse: bracket nesting': {
        gap: 'qs builds nested objects from a[b]=1; URLSearchParams keeps "a[b]" as a flat key',
        native: () => toObject('a[b]=1&a[c]=2'),
        package: ({ default: qs }) => qs.parse('a[b]=1&a[c]=2'),
      },
      'parse: bracket arrays': {
        gap: 'qs builds an array from a[]=1&a[]=2 under the key a; URLSearchParams keeps the key "a[]"',
        native: () => toObject('a[]=1&a[]=2'),
        package: ({ default: qs }) => qs.parse('a[]=1&a[]=2'),
      },
      'parse: leading question mark': {
        gap: 'URLSearchParams drops a leading ?; qs keeps it in the first key unless ignoreQueryPrefix is set',
        native: () => toObject('?a=1'),
        package: ({ default: qs }) => qs.parse('?a=1'),
      },
      stringify: {
        native: () => decoded(new URLSearchParams(record).toString()),
        package: ({ default: qs }) => decoded(qs.stringify(record)),
      },
      'stringify: space': {
        gap: 'URLSearchParams encodes a space as +; qs encodes it as %20 (both decode the same)',
        native: () => new URLSearchParams({ a: 'b c' }).toString(),
        package: ({ default: qs }) => qs.stringify({ a: 'b c' }),
      },
      'stringify: array with arrayFormat repeat': {
        native: () => toQuery({ a: ['1', '2'] }),
        package: ({ default: qs }) => qs.stringify({ a: ['1', '2'] }, { arrayFormat: 'repeat' }),
      },
      'stringify: array': {
        gap: 'qs writes an array as a[0]=1&a[1]=2; new URLSearchParams({ a: [...] }) joins it into a=1,2, so append each item',
        native: () => new URLSearchParams({ a: ['1', '2'] }).toString(),
        package: ({ default: qs }) => qs.stringify({ a: ['1', '2'] }),
      },
      'stringify: nested object': {
        gap: 'qs writes a nested object as a[b]=1; URLSearchParams writes the text "[object Object]"',
        native: () => new URLSearchParams({ a: { b: '1' } }).toString(),
        package: ({ default: qs }) => qs.stringify({ a: { b: '1' } }),
      },
      'stringify: null and undefined': {
        gap: 'qs leaves out an undefined value and writes null as an empty value; URLSearchParams writes the texts "undefined" and "null"',
        native: () => new URLSearchParams({ a: undefined, b: null }).toString(),
        package: ({ default: qs }) => qs.stringify({ a: undefined, b: null }),
      },
    },
    'query-string@10.0.0': {
      parse: {
        native: () => parsedAll(toObject),
        package: ({ default: queryString }) => parsedAll(queryString.parse),
      },
      'parse: null prototype': {
        gap: 'query-string returns a null-prototype object; a URLSearchParams turned into an object has Object.prototype',
        native: () => Object.getPrototypeOf(toObject('a=1')) === null,
        package: ({ default: queryString }) => Object.getPrototypeOf(queryString.parse('a=1')) === null,
      },
      'parse: key without value': {
        gap: 'query-string parses a bare key ("a") as null; URLSearchParams gives an empty string',
        native: () => toObject('a'),
        package: ({ default: queryString }) => ({ ...queryString.parse('a') }),
      },
      stringify: {
        native: () => ordered(new URLSearchParams(record)),
        package: ({ default: queryString }) => queryString.stringify(record),
      },
      'stringify: key order': {
        gap: 'query-string sorts keys by default; URLSearchParams keeps insertion order until sort() is called',
        native: () => new URLSearchParams(record).toString(),
        package: ({ default: queryString }) => queryString.stringify(record),
      },
      'stringify: array': {
        native: () => toQuery({ a: ['1', '2'] }),
        package: ({ default: queryString }) => queryString.stringify({ a: ['1', '2'] }),
      },
      'stringify: space': {
        gap: 'URLSearchParams encodes a space as +; query-string encodes it as %20 (both decode the same)',
        native: () => new URLSearchParams({ a: 'b c' }).toString(),
        package: ({ default: queryString }) => queryString.stringify({ a: 'b c' }),
      },
      'stringify: null and undefined': {
        gap: 'query-string leaves out an undefined value and writes null as a bare key; URLSearchParams writes the texts "undefined" and "null"',
        native: () => new URLSearchParams({ a: undefined, b: null }).toString(),
        package: ({ default: queryString }) => queryString.stringify({ a: undefined, b: null }),
      },
      parseUrl: {
        native: () => {
          const url = new URL('https://x.test/p?a=1#h');
          return { url: `${url.origin}${url.pathname}`, query: toObject(url.search) };
        },
        package: ({ default: queryString }) => {
          const { url, query } = queryString.parseUrl('https://x.test/p?a=1#h');
          return { url, query: { ...query } };
        },
      },
      stringifyUrl: {
        native: () => {
          const url = new URL('https://x.test/p?z=0');
          url.searchParams.append('a', '1');
          url.searchParams.sort();
          return url.href;
        },
        package: ({ default: queryString }) => queryString.stringifyUrl({ url: 'https://x.test/p?z=0', query: { a: '1' } }),
      },
    },
    '@ungap/url-search-params@0.2.2': {
      default: {
        native: () => URLSearchParams,
        package: ({ default: Polyfill }) => Polyfill,
      },
    },
  },
  idioms: {
    encodeURIComponentJoin: {
      seed: 'encodeURIComponent\\([^)]*\\)\\s*\\}?=\\$?\\{?\\s*encodeURIComponent\\(|\\.map\\([^)]*encodeURIComponent[\\s\\S]{0,80}\\.join\\([\'"]&[\'"]\\)',
      native: () => decoded(new URLSearchParams({ q: 'a b&c', page: '2' }).toString()),
      idiom: () =>
        decoded(
          Object.entries({ q: 'a b&c', page: '2' })
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&'),
        ),
    },
    'encodeURIComponentJoin: space': {
      gap: 'encodeURIComponent writes a space as %20; URLSearchParams writes + (both decode the same)',
      native: () => new URLSearchParams({ q: 'a b' }).toString(),
      idiom: () => `q=${encodeURIComponent('a b')}`,
    },
    splitQuery: {
      seed: '\\.split\\([\'"]&[\'"]\\)',
      native: () => Object.fromEntries(new URLSearchParams('?a=1&b=2')),
      idiom: () =>
        Object.fromEntries(
          '?a=1&b=2'
            .slice(1)
            .split('&')
            .map((pair) => pair.split('=')),
        ),
    },
    'splitQuery: encoded values': {
      gap: 'splitting on & and = leaves %20 and + undecoded; URLSearchParams decodes both to a space',
      native: () => Object.fromEntries(new URLSearchParams('?a=b%20c+d')),
      idiom: () =>
        Object.fromEntries(
          '?a=b%20c+d'
            .slice(1)
            .split('&')
            .map((pair) => pair.split('=')),
        ),
    },
  },
  lint: {
    splitQuery: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-url-search-parameters',
      on: 'modern-node/recommended',
      code: 'const query = Object.fromEntries(search.slice(1).split("&").map((pair) => pair.split("=")));',
    },
    banQs: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import qs from 'qs';",
    },
  },
};
