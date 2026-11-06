// Match URLs and paths against route patterns and read the named parameters.
import { outcome } from './support/outcome.mjs';

// The named groups a pathname pattern captures, or null when it does not match.
const groups = (pattern, path, options) => {
  const result = new URLPattern({ pathname: pattern }, options).exec({ pathname: path });
  return result ? { ...result.pathname.groups } : null;
};
// path-to-regexp's params, or null when the path does not match.
const params = (match, pattern, path, options) => {
  const result = match(pattern, options)(path);
  return result ? { ...result.params } : null;
};
const matched = (UrlPattern, pattern, path) => {
  const result = new UrlPattern(pattern).match(path);
  return result ? { ...result } : null;
};

export default {
  apis: [
    'url:URLPattern',
    'url:new URLPattern',
    'url:urlPattern.exec',
    'url:urlPattern.test',
    'globals:URLPattern',
    'js:URLPattern',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'path-to-regexp@9.0.0': {
      match: {
        native: () => groups('/users/:id', '/users/42'),
        package: ({ match }) => params(match, '/users/:id', '/users/42'),
      },
      'match: no match': {
        native: () => groups('/users/:id', '/posts/42'),
        package: ({ match }) => params(match, '/users/:id', '/posts/42'),
      },
      'match: suffix after a parameter': {
        native: () => groups('/files/:name.:ext', '/files/a.json'),
        package: ({ match }) => params(match, '/files/:name.:ext', '/files/a.json'),
      },
      'match: optional segment': {
        native: () => [groups('/users{/:id}?', '/users/1'), groups('/users{/:id}?', '/users')?.id],
        package: ({ match }) => [params(match, '/users{/:id}', '/users/1'), params(match, '/users{/:id}', '/users')?.id],
      },
      'match: ignore case': {
        native: () => groups('/Users/:id', '/users/1', { ignoreCase: true }),
        package: ({ match }) => params(match, '/Users/:id', '/users/1'),
      },
      'match: case': {
        gap: 'path-to-regexp matches without case by default; URLPattern is case-sensitive unless { ignoreCase: true }',
        native: () => groups('/Users/:id', '/users/1'),
        package: ({ match }) => params(match, '/Users/:id', '/users/1'),
      },
      'match: trailing slash': {
        gap: 'path-to-regexp accepts a trailing slash by default; URLPattern needs it in the pattern ({/}?)',
        native: () => groups('/users/:id', '/users/42/'),
        package: ({ match }) => params(match, '/users/:id', '/users/42/'),
      },
      'match: percent-encoded parameter': {
        gap: 'path-to-regexp decodes a parameter (a%20b → "a b"); URLPattern returns it encoded, so call decodeURIComponent',
        native: () => groups('/users/:id', '/users/a%20b'),
        package: ({ match }) => params(match, '/users/:id', '/users/a%20b'),
      },
      'match: wildcard segments': {
        native: () => groups('/files/*', '/files/a/b')[0].split('/'),
        package: ({ match }) => params(match, '/files/*path', '/files/a/b').path,
      },
      'match: wildcard': {
        gap: 'path-to-regexp names a wildcard (*path) and splits it into segments; URLPattern captures * as one string under the index "0"',
        native: () => groups('/files/*', '/files/a/b'),
        package: ({ match }) => params(match, '/files/*path', '/files/a/b'),
      },
      'match: regular expression group': {
        gap: 'URLPattern takes a regular expression group (:id(\\d+)); path-to-regexp 9 refuses one with TypeError',
        native: () => outcome(() => groups('/users/:id(\\d+)', '/users/42')),
        package: ({ match }) => outcome(() => params(match, '/users/:id(\\d+)', '/users/42')),
      },
      compile: {
        gap: 'path-to-regexp builds a path from parameters; URLPattern only matches and has no way to generate a URL',
        native: () => typeof URLPattern.prototype.generate,
        package: ({ compile }) => typeof compile('/users/:id')({ id: '42' }),
      },
    },
    'url-pattern@1.0.3': {
      'default: match': {
        native: () => groups('/users/:id', '/users/42'),
        package: ({ default: UrlPattern }) => matched(UrlPattern, '/users/:id', '/users/42'),
      },
      'default: trailing slash': {
        native: () => groups('/users/:id', '/users/42/'),
        package: ({ default: UrlPattern }) => matched(UrlPattern, '/users/:id', '/users/42/'),
      },
      'default: optional segment': {
        native: () => [groups('/users{/:id}?', '/users/1'), groups('/users{/:id}?', '/users')?.id],
        package: ({ default: UrlPattern }) => [
          matched(UrlPattern, '/users(/:id)', '/users/1'),
          matched(UrlPattern, '/users(/:id)', '/users')?.id,
        ],
      },
      'default: wildcard value': {
        native: () => groups('/files/*', '/files/a/b')[0],
        package: ({ default: UrlPattern }) => matched(UrlPattern, '/files/*', '/files/a/b')._,
      },
      'default: wildcard': {
        gap: 'url-pattern captures * under the key "_"; URLPattern under the index "0"',
        native: () => groups('/files/*', '/files/a/b'),
        package: ({ default: UrlPattern }) => matched(UrlPattern, '/files/*', '/files/a/b'),
      },
      'default: stringify': {
        gap: 'url-pattern builds a path from parameters with stringify(); URLPattern only matches',
        native: () => typeof URLPattern.prototype.stringify,
        package: ({ default: UrlPattern }) => typeof new UrlPattern('/users/:id').stringify({ id: '42' }),
      },
    },
    'urlpattern-polyfill@10.1.0/urlpattern': {
      URLPattern: {
        native: () => {
          const pattern = new URLPattern('https://*.example.com/users/:id');
          const result = pattern.exec('https://api.example.com/users/42');
          return [pattern.test('https://example.org/users/1'), { ...result.hostname.groups }, { ...result.pathname.groups }];
        },
        package: ({ URLPattern }) => {
          const pattern = new URLPattern('https://*.example.com/users/:id');
          const result = pattern.exec('https://api.example.com/users/42');
          return [pattern.test('https://example.org/users/1'), { ...result.hostname.groups }, { ...result.pathname.groups }];
        },
      },
    },
  },
};
