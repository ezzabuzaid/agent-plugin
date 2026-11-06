// The width and height of the terminal, in columns and rows.

// Runs `read` with COLUMNS and LINES set, so terminal-size answers from them
// instead of spawning tput, then puts the old values back.
function withSize(read) {
  const saved = { COLUMNS: process.env.COLUMNS, LINES: process.env.LINES };
  Object.assign(process.env, { COLUMNS: '100', LINES: '30' });
  try {
    return read();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

export default {
  apis: ['tty:writeStream.columns', 'tty:writeStream.rows'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'terminal-size@4.0.1': {
      'default: piped stdout': {
        gap: 'a piped stdout has no columns or rows; terminal-size falls back to stderr, $COLUMNS/$LINES, /dev/tty, tput or 80x24',
        native: () => ({ columns: process.stdout.columns, rows: process.stdout.rows }),
        package: ({ default: terminalSize }) => withSize(terminalSize),
      },
    },
  },
};
