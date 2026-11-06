// Test a path against a glob pattern: *, **, ?, [..], {a,b}, {1..3} and extglobs.
// Node runs its bundled minimatch with nocase and nocaseMagicOnly on macOS and
// Windows (only a path segment with glob magic ignores case), windowsPathsNoEscape,
// nonegate and nocomment, and takes no options.
import { matchesGlob } from 'node:path';

const ignoresCase = ['darwin', 'win32'].includes(process.platform);
// [path, pattern] pairs every matcher reads the same way.
const shared = [
  ['a.js', '*.js'],
  ['src/a.js', '*.js'],
  ['src/a.js', '**/*.js'],
  ['b.js', '**/b.js'],
  ['src/b/c.js', 'src/**'],
  ['a/b/c.js', 'src/**'],
  ['a/c', 'a/**/c'],
  ['a.ts', '*.{js,ts}'],
  ['a1.js', 'a{1..3}.js'],
  ['a1.js', 'a[0-9].js'],
  ['a.js', '[[:alpha:]].js'],
  ['a.js', '?.js'],
  ['a.js', '+(a|b).js'],
  ['c.js', '!(a|b).js'],
  ['ab.js', '@(a|b).js'],
  ['.env', '*'],
  ['.git/x', '**/x'],
];
const each = (match, pairs = shared) => pairs.map(([path, pattern]) => match(path, pattern));
const native = (pairs) => each(matchesGlob, pairs);
const negated = [
  ['a.js', '!*.md'],
  ['a.md', '!*.md'],
];
const escaped = [['a{b', 'a\\{b']];
const dotfile = [['.env', '*']];
const dotSlash = [['x/a.js', './x/*.js']];
const doubleSlash = [['a//b', 'a/*/b']];
// Upper-case paths against a magic segment, a literal pattern and a literal directory segment.
const upper = [
  ['A.JS', '*.js'],
  ['A.JS', 'a.js'],
  ['SRC/A.JS', 'src/*.js'],
];
// A globstar right after the leading slash, where it has to match zero segments.
const rootGlobstar = [['/index.ts', '/**/index.ts']];

export default {
  apis: ['path:path.matchesGlob'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'minimatch@11.0.5': {
      minimatch: {
        native: () => native(),
        package: ({ minimatch }) => each(minimatch),
      },
      'minimatch: ./ prefix and repeated slashes': {
        native: () => native([...dotSlash, ...doubleSlash]),
        package: ({ minimatch }) => each(minimatch, [...dotSlash, ...doubleSlash]),
      },
      'minimatch: case follows the platform': {
        native: () => native(upper),
        package: ({ minimatch }) =>
          each((path, pattern) => minimatch(path, pattern, { nocase: ignoresCase, nocaseMagicOnly: true }), upper),
      },
      'minimatch: negation': {
        gap: 'matchesGlob runs with nonegate: a leading ! is a literal, so "!*.md" matches nothing; minimatch negates the pattern',
        native: () => native(negated),
        package: ({ minimatch }) => each(minimatch, negated),
      },
      'minimatch: backslash escape': {
        gap: 'matchesGlob runs with windowsPathsNoEscape on every platform: a backslash is a path separator, not an escape, so "a\\{b" does not match "a{b"; minimatch escapes',
        native: () => native(escaped),
        package: ({ minimatch }) => each(minimatch, escaped),
      },
      'minimatch: dot option': {
        gap: 'matchesGlob takes no options: * never matches a dotfile; minimatch matches one with { dot: true }',
        native: () => native(dotfile),
        package: ({ minimatch }) => each((path, pattern) => minimatch(path, pattern, { dot: true }), dotfile),
      },
    },
    'micromatch@4.0.8': {
      isMatch: {
        native: () => native(),
        package: ({ default: micromatch }) => each(micromatch.isMatch),
      },
      'isMatch: pattern list': {
        native: () => ['a.js', 'a.css', 'a.md'].map((path) => ['*.js', '*.css'].some((pattern) => matchesGlob(path, pattern))),
        package: ({ default: micromatch }) => ['a.js', 'a.css', 'a.md'].map((path) => micromatch.isMatch(path, ['*.js', '*.css'])),
      },
      default: {
        native: () => ['a.js', 'b.md', 'src/c.js'].filter((path) => matchesGlob(path, '**/*.js')),
        package: ({ default: micromatch }) => micromatch(['a.js', 'b.md', 'src/c.js'], '**/*.js'),
      },
      'isMatch: negation': {
        gap: 'matchesGlob runs with nonegate: a leading ! is a literal, so "!*.md" matches nothing; micromatch negates the pattern',
        native: () => native(negated),
        package: ({ default: micromatch }) => each(micromatch.isMatch, negated),
      },
      'isMatch: backslash escape': {
        gap: 'a backslash never escapes in matchesGlob (windowsPathsNoEscape); micromatch escapes "a\\{b" to match "a{b"',
        native: () => native(escaped),
        package: ({ default: micromatch }) => each(micromatch.isMatch, escaped),
      },
      'isMatch: ./ prefix and repeated slashes': {
        gap: 'micromatch strips a leading ./ from the pattern and lets * match an empty segment (a//b); matchesGlob does neither',
        native: () => native([...dotSlash, ...doubleSlash]),
        package: ({ default: micromatch }) => each(micromatch.isMatch, [...dotSlash, ...doubleSlash]),
      },
      'isMatch: case': {
        gap: 'matchesGlob matches case on Linux; on macOS and Windows it ignores case only in a path segment with glob magic ("*.js" matches A.JS, but the literal pattern "a.js" and the literal segment "src" in "src/*.js" compare exactly), with no option to choose; micromatch matches case unless { nocase: true }, which ignores it everywhere',
        native: () => [false, true].map(() => native(upper)),
        package: ({ default: micromatch }) => [false, true].map((nocase) => each((path, pattern) => micromatch.isMatch(path, pattern, { nocase }), upper)),
      },
      'isMatch: globstar after the root slash': {
        gap: '"/**/index.ts" matches "/index.ts" in matchesGlob (the globstar matches zero segments); micromatch needs at least one segment there',
        native: () => native(rootGlobstar),
        package: ({ default: micromatch }) => each(micromatch.isMatch, rootGlobstar),
      },
      'isMatch: dot option': {
        gap: 'matchesGlob takes no options: * never matches a dotfile; micromatch matches one with { dot: true }',
        native: () => native(dotfile),
        package: ({ default: micromatch }) => each((path, pattern) => micromatch.isMatch(path, pattern, { dot: true }), dotfile),
      },
    },
    'picomatch@4.0.7': {
      default: {
        native: () => native(),
        package: ({ default: picomatch }) => each((path, pattern) => picomatch(pattern)(path)),
      },
      'default: negation': {
        gap: 'matchesGlob runs with nonegate: a leading ! is a literal, so "!*.md" matches nothing; picomatch negates the pattern',
        native: () => native(negated),
        package: ({ default: picomatch }) => each((path, pattern) => picomatch(pattern)(path), negated),
      },
      'default: backslash escape': {
        gap: 'a backslash never escapes in matchesGlob (windowsPathsNoEscape); picomatch escapes "a\\{b" to match "a{b"',
        native: () => native(escaped),
        package: ({ default: picomatch }) => each((path, pattern) => picomatch(pattern)(path), escaped),
      },
      'default: ./ prefix and repeated slashes': {
        gap: 'picomatch strips a leading ./ from the pattern and lets * match an empty segment (a//b); matchesGlob does neither',
        native: () => native([...dotSlash, ...doubleSlash]),
        package: ({ default: picomatch }) => each((path, pattern) => picomatch(pattern)(path), [...dotSlash, ...doubleSlash]),
      },
      'default: globstar after the root slash': {
        gap: '"/**/index.ts" matches "/index.ts" in matchesGlob (the globstar matches zero segments); picomatch needs at least one segment there',
        native: () => native(rootGlobstar),
        package: ({ default: picomatch }) => each((path, pattern) => picomatch(pattern)(path), rootGlobstar),
      },
      'default: dot option': {
        gap: 'matchesGlob takes no options: * never matches a dotfile; picomatch matches one with { dot: true }',
        native: () => native(dotfile),
        package: ({ default: picomatch }) => each((path, pattern) => picomatch(pattern, { dot: true })(path), dotfile),
      },
    },
  },
};
