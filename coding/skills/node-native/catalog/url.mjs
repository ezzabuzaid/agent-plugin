// Parse, resolve, validate and edit URLs with the WHATWG URL parser.
import url from 'node:url';
import { outcome } from './support/outcome.mjs';

// The parts of a parsed URL; url-parse and url.parse name `search` `query`
// when parsing the query is off, so each side reads the string form.
const parts = (url) => ({
  href: url.href,
  protocol: url.protocol,
  username: url.username,
  password: url.password,
  host: url.host,
  hostname: url.hostname,
  port: url.port,
  pathname: url.pathname,
  search: url.search ?? url.query,
  hash: url.hash,
  origin: url.origin,
});
const FULL = 'https://user:pw@Example.COM:8080/b/c?x=1&y=2#frag';
const parsed = (make, input) => outcome(() => parts(make(input)));
const samples = [FULL, 'HTTP://example.com:80/', 'http://[::1]:3000/p', 'mailto:x@y.z', 'https://example.com/%7Efoo'];
const whatwgSamples = [
  ...samples,
  'https://example.com/a/../b/./c',
  'https://mañana.com/',
  'https://example.com/a b?q=a b',
  'http://0x7f.1/',
  'file:///tmp/a b',
];
const all = (make, inputs) => inputs.map((input) => parsed(make, input));
const valid = (check) => ['https://example.com/', 'not a url', 'http://', '/relative'].map(check);
const editedNative = () => {
  const url = new URL('https://a.com/p?x=1#h');
  url.pathname = '/q';
  url.hash = '';
  url.port = '8080';
  return url.href;
};

export default {
  apis: ['url:URL', 'url:new URL', 'url:URL.canParse', 'url:URL.parse', 'globals:URL', 'js:URL', 'js:URL.canParse', 'js:URL.parse'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'whatwg-url@17.3.0': {
      URL: {
        native: () => all((input) => new URL(input), whatwgSamples),
        package: ({ URL }) => all((input) => new URL(input), whatwgSamples),
      },
      'URL: relative to a base': {
        native: () => new URL('../x?y#z', 'http://a/b/c').href,
        package: ({ URL }) => new URL('../x?y#z', 'http://a/b/c').href,
      },
      'URL: canParse': {
        native: () => valid((input) => URL.canParse(input)),
        package: ({ URL }) => valid((input) => URL.canParse(input)),
      },
      'URL: parse': {
        native: () => valid((input) => URL.parse(input)?.href ?? null),
        package: ({ URL }) => valid((input) => URL.parse(input)?.href ?? null),
      },
      'URL: setters': {
        native: () => editedNative(),
        package: ({ URL }) => {
          const url = new URL('https://a.com/p?x=1#h');
          url.pathname = '/q';
          url.hash = '';
          url.port = '8080';
          return url.href;
        },
      },
    },
    'url-parse@1.5.10': {
      default: {
        native: () => all((input) => new URL(input), samples),
        package: ({ default: Url }) => all((input) => new Url(input), samples),
      },
      'default: relative to a base': {
        native: () => new URL('../x?y#z', 'http://a/b/c').href,
        package: ({ default: Url }) => new Url('../x?y#z', 'http://a/b/c').href,
      },
      'default: dot segments': {
        gap: 'url-parse keeps ./ and ../ in the path; URL resolves them (/a/../b/./c → /b/c)',
        native: () => parsed((input) => new URL(input), 'https://example.com/a/../b/./c'),
        package: ({ default: Url }) => parsed((input) => new Url(input), 'https://example.com/a/../b/./c'),
      },
      'default: internationalised host': {
        gap: 'url-parse keeps a Unicode host as written; URL converts it to punycode (mañana.com → xn--maana-pta.com)',
        native: () => parsed((input) => new URL(input), 'https://mañana.com/'),
        package: ({ default: Url }) => parsed((input) => new Url(input), 'https://mañana.com/'),
      },
      'default: spaces': {
        gap: 'url-parse leaves spaces in the path and query; URL percent-encodes them',
        native: () => parsed((input) => new URL(input), 'https://example.com/a b?q=a b'),
        package: ({ default: Url }) => parsed((input) => new Url(input), 'https://example.com/a b?q=a b'),
      },
      'default: IPv4 shorthand': {
        gap: 'url-parse keeps a numeric shorthand host (0x7f.1); URL normalises it to dotted IPv4 (127.0.0.1)',
        native: () => parsed((input) => new URL(input), 'http://0x7f.1/'),
        package: ({ default: Url }) => parsed((input) => new Url(input), 'http://0x7f.1/'),
      },
      'default: invalid input': {
        gap: 'url-parse turns any string into a URL object ("not a url" becomes a path); URL throws TypeError, and URL.canParse says false',
        native: () => parsed((input) => new URL(input), 'not a url'),
        package: ({ default: Url }) => parsed((input) => new Url(input), 'not a url'),
      },
      'default: parsed query': {
        native: () => Object.fromEntries(new URL('https://a.com/?x=1&y').searchParams),
        package: ({ default: Url }) => ({ ...new Url('https://a.com/?x=1&y', true).query }),
      },
      'default: parsed query with a repeated key': {
        gap: 'url-parse keeps the first value of a repeated key; Object.fromEntries(url.searchParams) keeps the last, and searchParams.getAll returns every one',
        native: () => Object.fromEntries(new URL('https://a.com/?x=1&x=2').searchParams),
        package: ({ default: Url }) => ({ ...new Url('https://a.com/?x=1&x=2', true).query }),
      },
      set: {
        native: () => editedNative(),
        package: ({ default: Url }) => {
          const url = new Url('https://a.com/p?x=1#h');
          url.set('pathname', '/q');
          url.set('hash', '');
          url.set('port', '8080');
          return url.href;
        },
      },
      'set: query object': {
        gap: 'url-parse encodes a space in a query value as %20; URLSearchParams encodes it as +',
        native: () => {
          const url = new URL('https://a.com/p');
          url.search = new URLSearchParams({ a: 'b c' }).toString();
          return url.href;
        },
        package: ({ default: Url }) => {
          const url = new Url('https://a.com/p');
          url.set('query', { a: 'b c' });
          return url.href;
        },
      },
    },
  },
  idioms: {
    tryNewURL: {
      // The URL is thrown away: only whether it parses matters.
      seed: 'try\\s*\\{\\s*new URL\\([^}]*\\}\\s*catch\\b',
      native: () => valid((input) => URL.canParse(input)),
      idiom: () =>
        valid((input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return false;
          }
        }),
    },
    tryNewURLKept: {
      // The parsed URL is kept, or null when the input does not parse.
      seed: 'try\\s*\\{\\s*(?:(?:const|let|var)\\s+[\\w$]+\\s*=\\s*|[\\w$.]+\\s*=\\s*|return\\s+)new URL\\([^}]*\\}\\s*catch\\b',
      native: () => valid((input) => URL.parse(input)?.href ?? null),
      idiom: () =>
        valid((input) => {
          try {
            return new URL(input).href;
          } catch {
            return null;
          }
        }),
    },
    legacyUrlParse: {
      seed: '\\burl\\.parse\\(|\\bparse\\(\\s*req(uest)?\\.url',
      native: () => {
        const url = new URL('https://example.com:8080/a?x=1#h');
        return [url.protocol, url.host, url.pathname, url.search, url.hash];
      },
      idiom: () => {
        const parsedUrl = url.parse('https://example.com:8080/a?x=1#h');
        return [parsedUrl.protocol, parsedUrl.host, parsedUrl.pathname, parsedUrl.search, parsedUrl.hash];
      },
    },
    'legacyUrlParse: dot segments': {
      gap: 'url.parse keeps ./ and ../ in the path; URL resolves them',
      native: () => new URL('https://example.com/a/../b').pathname,
      idiom: () => url.parse('https://example.com/a/../b').pathname,
    },
    'legacyUrlParse: invalid input': {
      gap: 'url.parse returns an object for any string; URL throws TypeError on input that is not a URL',
      native: () => parsed((input) => new URL(input), 'not a url'),
      idiom: () => url.parse('not a url').href,
    },
  },
  lint: {
    tryNewURL: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-url-can-parse',
      code: 'function isUrl(value) { try { new URL(value); return true; } catch { return false; } }',
    },
    legacyUrlParse: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-n@18.5.0',
      rule: 'n/no-deprecated-api',
      code: "import url from 'node:url'; const parsed = url.parse(href);",
    },
  },
};
