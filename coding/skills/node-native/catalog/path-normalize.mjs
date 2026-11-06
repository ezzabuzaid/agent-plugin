// Normalise a path to forward slashes: path.posix after turning \ into /.
import path from 'node:path';

const inputs = ['a\\b\\c', 'C:\\a\\b', 'a/b\\c', 'a\\\\b', 'a/b/', 'a//b', './a/../b'];
// The native form: backslashes become slashes, then POSIX normalisation.
const posix = (input) => path.posix.normalize(input.replaceAll('\\', '/'));
const all = (convert, list = inputs) => list.map((input) => convert(input));

export default {
  apis: ['path:path.normalize', 'path:path.join'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'upath@3.0.8': {
      normalize: {
        native: () => all(posix),
        package: ({ default: upath }) => all(upath.normalize),
      },
      join: {
        native: () => path.posix.join('a\\b'.replaceAll('\\', '/'), '../c', 'd\\e'.replaceAll('\\', '/')),
        package: ({ default: upath }) => upath.join('a\\b', '../c', 'd\\e'),
      },
      toUnix: {
        gap: 'node:path has no separator conversion: path.posix.normalize keeps a backslash as part of a name, so replace \\ with / first',
        native: () => all(path.posix.normalize),
        package: ({ default: upath }) => all(upath.toUnix),
      },
    },
    'slash@5.1.0': {
      'default: separators': {
        native: () => all(posix, ['a\\b\\c', 'C:\\a\\b', 'a/b\\c']),
        package: ({ default: slash }) => all(slash, ['a\\b\\c', 'C:\\a\\b', 'a/b\\c']),
      },
      'default: repeated slashes and dot segments': {
        gap: 'slash only swaps separators: it keeps // and ./a/../b; path.posix.normalize collapses them',
        native: () => all(posix),
        package: ({ default: slash }) => all(slash),
      },
      'default: extended-length path': {
        gap: 'slash leaves a Windows extended-length path (\\\\?\\C:\\a) untouched; replacing every backslash rewrites it',
        native: () => posix('\\\\?\\C:\\a'),
        package: ({ default: slash }) => slash('\\\\?\\C:\\a'),
      },
    },
    'normalize-path@3.0.0': {
      'default: separators': {
        native: () => all(posix, ['a\\b\\c', 'C:\\a\\b', 'a/b\\c', 'a//b']),
        package: ({ default: normalizePath }) => all(normalizePath, ['a\\b\\c', 'C:\\a\\b', 'a/b\\c', 'a//b']),
      },
      'default: trailing slash': {
        gap: 'normalize-path removes a trailing slash; path.posix.normalize keeps it',
        native: () => posix('a/b/'),
        package: ({ default: normalizePath }) => normalizePath('a/b/'),
      },
      'default: dot segments': {
        gap: 'normalize-path keeps ./ and ../; path.posix.normalize resolves them',
        native: () => posix('./a/../b'),
        package: ({ default: normalizePath }) => normalizePath('./a/../b'),
      },
    },
  },
  lint: {
    banSlash: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import slash from 'slash';",
    },
  },
};
