// Whether a path is absolute, by the current platform's rules or by POSIX or Windows rules.
import path from 'node:path';

const inputs = ['/a', 'a', './a', 'C:\\a', 'C:/a', 'C:a', '\\\\server\\share', '\\a', ''];
const all = (check) => inputs.map((input) => check(input));
// The platform check, then the POSIX and the Windows check of every input.
const native = () => [all(path.isAbsolute), all(path.posix.isAbsolute), all(path.win32.isAbsolute)];
const checks = (check) => [all(check), all(check.posix), all(check.win32)];

export default {
  apis: ['path:path.isAbsolute'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-absolute@1.0.0': {
      default: {
        native,
        package: ({ default: isAbsolute }) => checks(isAbsolute),
      },
    },
    'path-is-absolute@2.0.0': {
      default: {
        native,
        package: ({ default: pathIsAbsolute }) => checks(pathIsAbsolute),
      },
    },
  },
};
