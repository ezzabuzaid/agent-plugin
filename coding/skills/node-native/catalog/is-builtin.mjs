// Telling a Node built-in module specifier from a package name.
import { builtinModules, isBuiltin } from 'node:module';

const names = ['fs', 'node:fs', 'fs/promises', 'node:fs/promises', 'node:test', 'test', 'node:sqlite', 'sqlite', 'lodash', 'fs/missing'];
const retired = ['punycode', 'sys', '_http_agent'];

const ban = (name) => ({
  eslint: '10.12.0',
  plugin: 'eslint-plugin-depend@1.5.0',
  rule: 'depend/ban-dependencies',
  code: `import x from '${name}';`,
});

export default {
  apis: ['module:module.isBuiltin', 'node:module.builtinModules'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-builtin-module@5.0.0': {
      default: {
        native: () => names.map((name) => isBuiltin(name)),
        package: ({ default: isBuiltinModule }) => names.map((name) => isBuiltinModule(name)),
      },
      'default: deprecated and internal modules': {
        gap: 'isBuiltin is true for deprecated and underscore-internal built-ins (punycode, sys, _http_agent); is-builtin-module leaves them out',
        native: () => retired.map((name) => isBuiltin(name)),
        package: ({ default: isBuiltinModule }) => retired.map((name) => isBuiltinModule(name)),
      },
    },
    'builtin-modules@5.5.0': {
      'default: list': {
        gap: "builtinModules lists each module once without its node: prefix and keeps deprecated ones; builtin-modules is a snapshot that lists both spellings and drops deprecated ones",
        native: () => [...builtinModules].sort(),
        package: ({ default: builtins }) => [...builtins].sort(),
      },
      'default: membership': {
        native: () => names.map((name) => isBuiltin(name)),
        package: ({ default: builtins }) => names.map((name) => builtins.includes(name)),
      },
    },
  },
  lint: {
    banIsBuiltinModule: ban('is-builtin-module'),
    banBuiltinModules: ban('builtin-modules'),
  },
};
