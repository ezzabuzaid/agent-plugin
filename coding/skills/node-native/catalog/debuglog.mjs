// Debug logging to stderr that a namespace list in the environment turns on.
import { debuglog } from 'node:util';

// NODE_DEBUG is read once, when Node starts: the entry's env sets it.
const enabled = 'probe,app:*';

// Collects what `log` writes to stderr instead of printing it.
function stderrOf(log) {
  const lines = [];
  const write = process.stderr.write;
  process.stderr.write = (chunk) => lines.push(String(chunk)) > 0;
  try {
    log();
  } finally {
    process.stderr.write = write;
  }
  return lines;
}

// debuglog prefixes `PROBE <pid>: `, debug without its date `probe `: the
// mapping compares the message after the prefix.
const message = (lines) => lines.map((line) => line.replace(/^(?:PROBE \d+|probe):? /, ''));

// debug keeps its own enabled namespaces and options: every row sets them
// before it reads.
function logger(createDebug, namespaces, name = 'probe', { colors = false, date = false } = {}) {
  createDebug.enable(namespaces);
  createDebug.inspectOpts.hideDate = !date;
  const log = createDebug(name);
  log.useColors = colors;
  return log;
}

export default {
  apis: ['util:util.debuglog', 'cli:NODE_DEBUG'],
  reviewedAt: 'v26.13.0',
  env: { NODE_DEBUG: enabled },
  replaces: {
    'debug@4.4.3': {
      default: {
        native: () => message(stderrOf(() => debuglog('probe')('hello %s %d', 'world', 1))),
        package: ({ default: createDebug }) =>
          message(stderrOf(() => logger(createDebug, enabled)('hello %s %d', 'world', 1))),
      },
      'default: line prefix': {
        gap: 'each line starts with the upper-case namespace and the pid, not a timestamp and the namespace',
        native: () => stderrOf(() => debuglog('probe')('hello')),
        package: ({ default: createDebug }) => stderrOf(() => logger(createDebug, enabled, 'probe', { date: true })('hello')),
      },
      'default: colours and elapsed time': {
        gap: 'no colour per namespace and no +Nms time since the previous line',
        native: () => stderrOf(() => debuglog('probe')('hello')),
        package: ({ default: createDebug }) => stderrOf(() => logger(createDebug, enabled, 'probe', { colors: true })('hello')),
      },
      'default: %o': {
        gap: "%o shows hidden properties (an array's [length]); debug prints the value on one line without them",
        native: () => message(stderrOf(() => debuglog('probe')('%o', [1]))),
        package: ({ default: createDebug }) => message(stderrOf(() => logger(createDebug, enabled)('%o', [1]))),
      },
      enabled: {
        native: () => debuglog('probe').enabled,
        package: ({ default: createDebug }) => logger(createDebug, enabled).enabled,
      },
      'enabled: wildcard': {
        native: () => debuglog('app:one').enabled,
        package: ({ default: createDebug }) => logger(createDebug, enabled, 'app:one').enabled,
      },
      'enabled: excluded namespace': {
        gap: 'no -namespace exclusions: NODE_DEBUG=app:* turns on app:skip too',
        native: () => debuglog('app:skip').enabled,
        package: ({ default: createDebug }) => logger(createDebug, 'app:*,-app:skip', 'app:skip').enabled,
      },
      enable: {
        gap: 'no runtime enable: only the NODE_DEBUG that Node started with turns a section on',
        native: () => debuglog('other').enabled,
        package: ({ default: createDebug }) => logger(createDebug, 'other', 'other').enabled,
      },
      disable: {
        gap: 'no runtime disable: a section NODE_DEBUG turned on stays on',
        native: () => debuglog('probe').enabled,
        package: ({ default: createDebug }) => {
          const log = logger(createDebug, enabled);
          createDebug.disable();
          return log.enabled;
        },
      },
    },
  },
};
