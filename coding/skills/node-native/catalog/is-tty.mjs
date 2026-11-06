// Whether a stream is an interactive terminal.
import { isatty } from 'node:tty';

// The probe's stdout is a pipe, never a terminal: a TTY cannot be opened
// deterministically, so the rows cover the piped case only.
export default {
  apis: ['tty:tty.isatty', 'tty:writeStream.isTTY'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-interactive@2.0.0': {
      default: {
        native: () => isatty(process.stdout.fd),
        package: ({ default: isInteractive }) => isInteractive(),
      },
      'default: stream option': {
        native: () => Boolean(process.stdout.isTTY),
        package: ({ default: isInteractive }) => isInteractive({ stream: process.stdout }),
      },
    },
  },
};
