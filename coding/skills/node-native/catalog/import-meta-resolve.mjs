// Resolving a module specifier to a URL the way `import` would.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { esm, output } from './support/child.mjs';
import { outcome } from './support/outcome.mjs';
import { inScratch } from './support/scratch.mjs';

const code = (error) => error.code;
const tree = {
  'package.json': JSON.stringify({ name: 'app', type: 'module', imports: { '#config': './config.js' } }),
  'resolver.js': 'export const resolve = (specifier) => import.meta.resolve(specifier);\n',
  'config.js': '',
  'local.js': '',
  'node_modules/dep/package.json': JSON.stringify({ name: 'dep', exports: { '.': './index.js', './sub': './sub.js' } }),
  'node_modules/dep/index.js': '',
  'node_modules/dep/sub.js': '',
  'node_modules/cond/package.json': JSON.stringify({ name: 'cond', exports: { custom: './custom.js', default: './default.js' } }),
  'node_modules/cond/custom.js': '',
  'node_modules/cond/default.js': '',
};
// URLs relative to the tree, so two runs in two directories compare.
const relative = (dir, url) => url.replace(pathToFileURL(dir).href, '<root>');
// import.meta.resolve of `specifier` in the tree's resolver.js.
const native = (specifier) =>
  inScratch(tree, async (dir) => {
    const { resolve } = await import(pathToFileURL(join(dir, 'resolver.js')).href);
    return relative(dir, outcome(() => resolve(specifier), code));
  });
const theirs = (resolve, specifier) =>
  inScratch(tree, (dir) => relative(dir, outcome(() => resolve(specifier, pathToFileURL(join(dir, 'resolver.js')).href), code)));

const specifiers = {
  relative: './local.js',
  'package subpath': 'dep/sub',
  'subpath not exported': 'dep/missing',
  'missing package': 'missing',
  'missing relative file': './missing.js',
  'built-in without node:': 'fs',
  'subpath import': '#config',
  'conditional exports': 'cond',
};

export default {
  apis: ['esm:import.meta.resolve'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'import-meta-resolve@4.2.0': {
      resolve: {
        native: () => native('dep'),
        package: ({ resolve }) => theirs(resolve, 'dep'),
      },
      ...Object.fromEntries(
        Object.entries(specifiers).map(([name, specifier]) => [
          `resolve: ${name}`,
          { native: () => native(specifier), package: ({ resolve }) => theirs(resolve, specifier) },
        ]),
      ),
      'resolve: another parent': {
        gap: 'resolves against the calling module only: the parent argument needs --experimental-import-meta-resolve, and without it is ignored',
        native: () =>
          inScratch(tree, async (dir) => {
            const code = `console.log(import.meta.resolve('./local.js', ${JSON.stringify(pathToFileURL(join(dir, 'resolver.js')).href)}))`;
            return relative(dir, (await output(esm(code), { cwd: join(dir, 'node_modules') })).trim());
          }),
        package: ({ resolve }) => theirs(resolve, './local.js'),
      },
      moduleResolve: {
        native: () => native('cond'),
        package: ({ moduleResolve }) =>
          inScratch(tree, (dir) => relative(dir, moduleResolve('cond', pathToFileURL(join(dir, 'resolver.js'))).href)),
      },
      'moduleResolve: conditions': {
        gap: 'takes no conditions: the export conditions are fixed for the process (--conditions)',
        native: () => native('cond'),
        package: ({ moduleResolve }) =>
          inScratch(tree, (dir) => relative(dir, moduleResolve('cond', pathToFileURL(join(dir, 'resolver.js')), new Set(['custom'])).href)),
      },
    },
  },
};
