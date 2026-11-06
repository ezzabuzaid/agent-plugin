// The operating system's directory for temporary files.
import { tmpdir } from 'node:os';

// Runs `read` with TMPDIR set to `value`, then puts the old value back.
function withTmpdir(value, read) {
  const saved = process.env.TMPDIR;
  process.env.TMPDIR = value;
  try {
    return read();
  } finally {
    if (saved === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = saved;
  }
}

export default {
  apis: ['os:os.tmpdir'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'os-tmpdir@2.0.0': {
      default: {
        native: () => tmpdir(),
        package: ({ default: osTmpdir }) => osTmpdir(),
      },
      'default: trailing slash': {
        native: () => withTmpdir('/probe/tmp/', tmpdir),
        package: ({ default: osTmpdir }) => withTmpdir('/probe/tmp/', osTmpdir),
      },
    },
  },
};
