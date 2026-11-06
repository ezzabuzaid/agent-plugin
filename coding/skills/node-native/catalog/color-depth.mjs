// How many colours a terminal supports, read from the environment.
import { WriteStream } from 'node:tty';

// The probes run with stdout piped, so no tty.WriteStream exists: they call the
// methods off the prototype with an explicit env, the argument both take.
const depth = (env) => WriteStream.prototype.getColorDepth.call(undefined, env);
const hasColors = (count, env) => WriteStream.prototype.hasColors.call(undefined, count, env);

// getColorDepth answers in bits (1, 4, 8, 24); supports-color in levels (0-3).
const levelOf = { 1: 0, 4: 1, 8: 2, 24: 3 };

// supports-color reads process.env itself: the probe swaps its contents for
// `env` while the package runs, then restores them.
function withEnv(env, read) {
  const saved = { ...process.env };
  const replace = (values) => {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, values);
  };
  replace(env);
  try {
    return read();
  } finally {
    replace(saved);
  }
}

const tty = { isTTY: true };
const level = (module, env, options = { sniffFlags: false }) =>
  withEnv(env, () => module.createSupportsColor(tty, options) || { level: 0 }).level;

const cases = {
  createSupportsColor: { TERM: 'xterm-256color' },
  'createSupportsColor: no TERM': {},
  'createSupportsColor: TERM=xterm': { TERM: 'xterm' },
  'createSupportsColor: TERM=dumb': { TERM: 'dumb' },
  'createSupportsColor: COLORTERM=truecolor': { COLORTERM: 'truecolor' },
  'createSupportsColor: FORCE_COLOR=0': { FORCE_COLOR: '0', TERM: 'xterm-256color' },
  'createSupportsColor: FORCE_COLOR=1': { FORCE_COLOR: '1' },
  'createSupportsColor: FORCE_COLOR=2': { FORCE_COLOR: '2' },
  'createSupportsColor: FORCE_COLOR=3': { FORCE_COLOR: '3' },
  'createSupportsColor: FORCE_COLOR=true': { FORCE_COLOR: 'true' },
  'createSupportsColor: GitHub Actions': { CI: 'true', GITHUB_ACTIONS: 'true' },
  'createSupportsColor: CI': { CI: 'true' },
  'createSupportsColor: iTerm': { TERM_PROGRAM: 'iTerm.app', TERM_PROGRAM_VERSION: '3.4.0' },
  'createSupportsColor: Apple Terminal': { TERM_PROGRAM: 'Apple_Terminal' },
  'createSupportsColor: kitty': { TERM: 'xterm-kitty' },
};

const gaps = {
  'createSupportsColor: NO_COLOR': {
    gap: 'supports-color ignores NO_COLOR; getColorDepth answers 1 bit (no colour)',
    env: { NO_COLOR: '1', TERM: 'xterm-256color' },
  },
  'createSupportsColor: NODE_DISABLE_COLORS': {
    gap: 'supports-color ignores NODE_DISABLE_COLORS; getColorDepth answers 1 bit (no colour)',
    env: { NODE_DISABLE_COLORS: '1', TERM: 'xterm-256color' },
  },
  'createSupportsColor: ghostty': {
    gap: 'no truecolor for TERM=xterm-ghostty: getColorDepth answers 4 bits',
    env: { TERM: 'xterm-ghostty' },
  },
  'createSupportsColor: wezterm': {
    gap: 'TERM=wezterm is unknown: getColorDepth answers 1 bit',
    env: { TERM: 'wezterm' },
  },
  'createSupportsColor: GitLab CI': {
    gap: 'GitLab CI gets 8 bits; supports-color gives it the basic 16 colours',
    env: { CI: 'true', GITLAB_CI: 'true' },
  },
};

// Runs `read` with `flag` appended to process.argv, then removes it.
function withArgv(flag, read) {
  process.argv.push(flag);
  try {
    return read();
  } finally {
    process.argv.pop();
  }
}

export default {
  apis: ['tty:writeStream.getColorDepth', 'tty:writeStream.hasColors', 'cli:FORCE_COLOR', 'cli:NO_COLOR'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'supports-color@11.0.0': {
      ...Object.fromEntries(
        Object.entries(cases).map(([key, env]) => [
          key,
          { native: () => levelOf[depth(env)], package: (module) => level(module, env) },
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(gaps).map(([key, { gap, env }]) => [
          key,
          { gap, native: () => levelOf[depth(env)], package: (module) => level(module, env) },
        ]),
      ),
      'createSupportsColor: has256': {
        native: () => hasColors(256, { TERM: 'xterm-256color' }),
        package: ({ createSupportsColor }) =>
          withEnv({ TERM: 'xterm-256color' }, () => createSupportsColor(tty, { sniffFlags: false }).has256),
      },
      'createSupportsColor: has16m': {
        native: () => hasColors(2 ** 24, { COLORTERM: 'truecolor' }),
        package: ({ createSupportsColor }) =>
          withEnv({ COLORTERM: 'truecolor' }, () => createSupportsColor(tty, { sniffFlags: false }).has16m),
      },
      'createSupportsColor: --color flag': {
        gap: 'reads no --color=16m (or --no-color) flag from process.argv; only the environment',
        native: () => levelOf[depth({ TERM: 'dumb' })],
        package: (module) => withArgv('--color=16m', () => level(module, { TERM: 'dumb' }, {})),
      },
    },
  },
};
