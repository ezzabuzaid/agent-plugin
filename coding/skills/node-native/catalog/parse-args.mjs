// Command-line argument parsing: flags, string options, negation, positionals and `--`.
import { parseArgs } from 'node:util';
import { outcome } from './support/outcome.mjs';

const code = (error) => error.code;
const argv = ['-f', '--bar', 'b', 'pos', '--no-color', '-n', '5', '--', '--x'];
const options = {
  f: { type: 'boolean', short: 'f' },
  bar: { type: 'string' },
  n: { type: 'string', short: 'n' },
  color: { type: 'boolean' },
};
// minimist's shape: positionals under `_`, every option beside them.
const flat = ({ values, positionals }) => ({ _: positionals, ...values });
const typed = () => flat(parseArgs({ args: argv, options, allowPositionals: true, allowNegative: true }));
const declared = { boolean: ['f', 'color'], string: ['bar', 'n'] };

const withDefault = ['--name=a', '-o', 'x'];
const defaults = () =>
  flat(
    parseArgs({
      args: withDefault,
      options: { name: { type: 'string' }, out: { type: 'string', short: 'o' }, mode: { type: 'string', default: 'dev' } },
    }),
  );

const untypedNumber = () => flat(parseArgs({ args: ['-n', '5'], options: { n: { type: 'string', short: 'n' } } }));
const dotted = () => flat(parseArgs({ args: ['--a.b', '1'], options: { 'a.b': { type: 'string' } } }));

// commander: a command that throws instead of exiting and writes nowhere; its
// output is kept so a probe can return it. Values come back in minimist's shape.
const silentCommand = (Command, name) => {
  const command = new Command(name).exitOverride();
  command.output = '';
  const write = (text) => {
    command.output += text;
  };
  return command.configureOutput({ writeOut: write, writeErr: write, outputError: write });
};
const commanded = (command, args) => {
  command.parse(args, { from: 'user' });
  return { _: command.args, ...command.opts() };
};
// An error both sides are expected to raise, reduced to the fact of rejecting.
const rejects = (run) => {
  try {
    run();
    return 'accepted';
  } catch {
    return 'rejected';
  }
};

export default {
  apis: ['util:util.parseArgs'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'minimist@1.2.8': {
      default: {
        native: typed,
        package: ({ default: minimist }) => minimist(argv, declared),
      },
      'default: default values': {
        native: defaults,
        package: ({ default: minimist }) => {
          const { o, ...rest } = minimist(withDefault, { string: ['name', 'o'], alias: { o: 'out' }, default: { mode: 'dev' } });
          return rest;
        },
      },
      'default: number coercion': {
        gap: 'no number type: a numeric value stays a string',
        native: untypedNumber,
        package: ({ default: minimist }) => minimist(['-n', '5']),
      },
      'default: dotted keys': {
        gap: 'no dot notation: --a.b stays a flat key',
        native: dotted,
        package: ({ default: minimist }) => minimist(['--a.b', '1'], { string: ['a.b'] }),
      },
    },
    'mri@1.2.0': {
      default: {
        native: typed,
        package: ({ default: mri }) => mri(argv, declared),
      },
      'default: number coercion': {
        gap: 'no number type: a numeric value stays a string',
        native: untypedNumber,
        package: ({ default: mri }) => mri(['-n', '5']),
      },
    },
    'yargs-parser@22.0.0': {
      default: {
        native: typed,
        package: ({ default: parse }) => parse(argv, declared),
      },
      'default: number coercion': {
        gap: 'no number type: a numeric value stays a string',
        native: untypedNumber,
        package: ({ default: parse }) => parse(['-n', '5']),
      },
      'default: camel-case expansion': {
        gap: 'no camel-case alias: --foo-bar is only values["foo-bar"]',
        native: () => flat(parseArgs({ args: ['--foo-bar', 'x'], options: { 'foo-bar': { type: 'string' } } })),
        package: ({ default: parse }) => parse(['--foo-bar', 'x'], { string: ['foo-bar'] }),
      },
      'default: dotted keys': {
        gap: 'no dot notation: --a.b stays a flat key',
        native: dotted,
        package: ({ default: parse }) => parse(['--a.b', '1'], { string: ['a.b'] }),
      },
    },
    'arg@5.0.2': {
      default: {
        native: () => {
          const { values, positionals } = parseArgs({
            args: ['-f', '--bar', 'b', 'pos', '--', '--x'],
            options: { f: { type: 'boolean', short: 'f' }, bar: { type: 'string' } },
            allowPositionals: true,
          });
          return { _: positionals, '-f': values.f, '--bar': values.bar };
        },
        package: ({ default: arg }) => arg({ '-f': Boolean, '--bar': String }, { argv: ['-f', '--bar', 'b', 'pos', '--', '--x'] }),
      },
      COUNT: {
        native: () => parseArgs({ args: ['-vv', '--verbose'], options: { verbose: { type: 'boolean', short: 'v', multiple: true } } }).values.verbose.length,
        package: ({ default: arg }) => arg({ '--verbose': arg.COUNT, '-v': '--verbose' }, { argv: ['-vv', '--verbose'] })['--verbose'],
      },
      'default: Number handler': {
        gap: 'no type handlers: --port 80 stays the string "80"',
        native: () => parseArgs({ args: ['--port', '80'], options: { port: { type: 'string' } } }).values.port,
        package: ({ default: arg }) => arg({ '--port': Number }, { argv: ['--port', '80'] })['--port'],
      },
    },
    'commander@15.0.0': {
      Command: {
        native: typed,
        package: ({ Command }) =>
          commanded(
            silentCommand(Command).option('-f').option('--bar <bar>').option('-n <n>').option('--color').option('--no-color').argument('[rest...]'),
            argv,
          ),
      },
      program: {
        native: () => flat(parseArgs({ args: ['-v', '--name', 'x'], options: { verbose: { type: 'boolean', short: 'v' }, name: { type: 'string' } } })),
        package: ({ program }) =>
          commanded(program.exitOverride().configureOutput({ writeOut() {}, writeErr() {}, outputError() {} }).option('-v, --verbose').option('--name <name>'), ['-v', '--name', 'x']),
      },
      Option: {
        native: () => flat(parseArgs({ args: ['-s', 'api.json'], options: { spec: { type: 'string', short: 's' } } })),
        package: ({ Command, Option }) => commanded(silentCommand(Command).addOption(new Option('-s, --spec <spec>')), ['-s', 'api.json']),
      },
      'Command: combined short flags': {
        native: () => flat(parseArgs({ args: ['-ab'], options: { a: { type: 'boolean', short: 'a' }, b: { type: 'boolean', short: 'b' } } })),
        package: ({ Command }) => commanded(silentCommand(Command).option('-a').option('-b'), ['-ab']),
      },
      'Command: default value': {
        native: () =>
          flat(
            parseArgs({
              args: [],
              options: { name: { type: 'string', default: 'Client' }, verbose: { type: 'boolean', short: 'v', default: false } },
            }),
          ),
        package: ({ Command }) => commanded(silentCommand(Command).option('-n, --name <name>', 'name', 'Client').option('-v, --verbose', 'verbose', false), []),
      },
      'Command: repeated option keeps the last value': {
        native: () => flat(parseArgs({ args: ['--tag', 'a', '--tag', 'b'], options: { tag: { type: 'string' } } })),
        package: ({ Command }) => commanded(silentCommand(Command).option('--tag <tag>'), ['--tag', 'a', '--tag', 'b']),
      },
      'Command: variadic argument': {
        native: () => flat(parseArgs({ args: ['a.json', 'b.json'], allowPositionals: true })),
        package: ({ Command }) => commanded(silentCommand(Command).argument('[files...]'), ['a.json', 'b.json']),
      },
      'Command: unknown option is rejected': {
        native: () => rejects(() => parseArgs({ args: ['--verbos'], options: { verbose: { type: 'boolean' } } })),
        package: ({ Command }) => rejects(() => commanded(silentCommand(Command).option('--verbose'), ['--verbos'])),
      },
      'Command: excess argument is rejected': {
        native: () => rejects(() => parseArgs({ args: ['extra'], options: { verbose: { type: 'boolean' } } })),
        package: ({ Command }) => rejects(() => commanded(silentCommand(Command).option('--verbose'), ['extra'])),
      },
      'Option: argParser accumulating a repeated option': {
        native: () => flat(parseArgs({ args: ['--tag', 'a', '--tag', 'b'], options: { tag: { type: 'string', multiple: true } } })),
        package: ({ Command, Option }) =>
          commanded(
            silentCommand(Command).addOption(new Option('--tag <value>').argParser((value, previous = []) => [...previous, value])),
            ['--tag', 'a', '--tag', 'b'],
          ),
      },
      'Command: subcommands': {
        gap: 'no subcommands: one flat option table, so an option only `gen` declares is an unknown option',
        native: () => outcome(() => flat(parseArgs({ args: ['gen', '--dry'], options: {}, allowPositionals: true })), code),
        package: ({ Command }) => {
          let dispatched;
          const root = silentCommand(Command, 'root').addCommand(
            silentCommand(Command, 'gen')
              .option('--dry')
              .action((opts) => {
                dispatched = { gen: { ...opts } };
              }),
          );
          root.parse(['gen', '--dry'], { from: 'user' });
          return dispatched;
        },
      },
      'Command: help': {
        gap: 'no generated help: --help is an unknown option, not usage text',
        native: () => outcome(() => parseArgs({ args: ['--help'], options: { dry: { type: 'boolean' } } }), code),
        package: ({ Command }) => {
          const command = silentCommand(Command, 'gen').option('--dry', 'do not write files');
          outcome(() => command.parse(['--help'], { from: 'user' }), code);
          return command.output;
        },
      },
      'Command: version': {
        gap: 'no --version handling: it is a boolean the caller must answer',
        native: () => flat(parseArgs({ args: ['--version'], options: { version: { type: 'boolean' } } })),
        package: ({ Command }) => {
          const command = silentCommand(Command).version('1.2.3');
          outcome(() => command.parse(['--version'], { from: 'user' }), code);
          return command.output;
        },
      },
      'Command: requiredOption': {
        gap: 'no required options: a missing option is simply absent',
        native: () => outcome(() => flat(parseArgs({ args: [], options: { project: { type: 'string' } } })), code),
        package: ({ Command }) => outcome(() => commanded(silentCommand(Command).requiredOption('--project <tsconfig>'), []), code),
      },
      'Option: makeOptionMandatory': {
        gap: 'no mandatory options: a missing option is simply absent',
        native: () => outcome(() => flat(parseArgs({ args: [], options: { spec: { type: 'string', short: 's' } } })), code),
        package: ({ Command, Option }) => outcome(() => commanded(silentCommand(Command).addOption(new Option('-s, --spec <spec>').makeOptionMandatory(true)), []), code),
      },
      'Option: choices': {
        gap: 'no choices: any value is accepted',
        native: () => outcome(() => flat(parseArgs({ args: ['--output', 'xml'], options: { output: { type: 'string' } } })), code),
        package: ({ Command, Option }) => outcome(() => commanded(silentCommand(Command).addOption(new Option('--output <mode>').choices(['json', 'raw'])), ['--output', 'xml']), code),
      },
      'Option: argParser': {
        gap: 'no value parser: --limit 7 stays the string "7"',
        native: () => flat(parseArgs({ args: ['--limit', '7'], options: { limit: { type: 'string' } } })),
        package: ({ Command, Option }) => commanded(silentCommand(Command).addOption(new Option('--limit <value>').argParser(Number)), ['--limit', '7']),
      },
      InvalidArgumentError: {
        gap: 'no value validation: a value a parser would refuse is accepted',
        native: () => outcome(() => flat(parseArgs({ args: ['--limit', 'x'], options: { limit: { type: 'string' } } })), code),
        package: ({ Command, Option, InvalidArgumentError }) =>
          outcome(
            () =>
              commanded(
                silentCommand(Command).addOption(
                  new Option('--limit <value>').argParser((value) => {
                    if (Number.isNaN(Number(value))) throw new InvalidArgumentError(`"${value}" is not a valid number`);
                    return Number(value);
                  }),
                ),
                ['--limit', 'x'],
              ),
            code,
          ),
      },
      'Command: optional option-argument': {
        gap: 'no optional value: a string option given without a value throws',
        native: () => outcome(() => flat(parseArgs({ args: ['--useTsExtension'], options: { useTsExtension: { type: 'string' } } })), code),
        package: ({ Command }) => outcome(() => commanded(silentCommand(Command).option('--useTsExtension [value]'), ['--useTsExtension']), code),
      },
      'Command: required argument': {
        gap: 'no required positionals: none given is an empty list',
        native: () => outcome(() => flat(parseArgs({ args: [], allowPositionals: true })), code),
        package: ({ Command }) => outcome(() => commanded(silentCommand(Command).argument('<files...>'), []), code),
      },
      'Command: lone --no-x defaults to true': {
        gap: 'a negatable option has no implied default: absent --no-install leaves install undefined',
        native: () => flat(parseArgs({ args: [], options: { install: { type: 'boolean' } }, allowNegative: true })),
        package: ({ Command }) => commanded(silentCommand(Command).option('--no-install'), []),
      },
      'Command: camel-case keys': {
        gap: 'no camel-case keys: --default-formatter is values["default-formatter"]',
        native: () => flat(parseArgs({ args: ['--default-formatter'], options: { 'default-formatter': { type: 'boolean' } } })),
        package: ({ Command }) => commanded(silentCommand(Command).option('--default-formatter'), ['--default-formatter']),
      },
      'Command: unknown option suggestion': {
        gap: 'no did-you-mean: the error names only the unknown option',
        native: () => {
          try {
            parseArgs({ args: ['--verbos'], options: { verbose: { type: 'boolean' } } });
          } catch (error) {
            return error.message.includes('--verbose');
          }
        },
        package: ({ Command }) => {
          try {
            commanded(silentCommand(Command).option('--verbose'), ['--verbos']);
          } catch (error) {
            return error.message.includes('--verbose');
          }
        },
      },
      'Option: env': {
        gap: 'no environment binding: an option reads only argv',
        native: () => {
          process.env.SDK_PROBE_TOKEN = 'secret';
          try {
            return flat(parseArgs({ args: [], options: { token: { type: 'string' } } }));
          } finally {
            delete process.env.SDK_PROBE_TOKEN;
          }
        },
        package: ({ Command, Option }) => {
          process.env.SDK_PROBE_TOKEN = 'secret';
          try {
            return commanded(silentCommand(Command).addOption(new Option('--token <token>').env('SDK_PROBE_TOKEN')), []);
          } finally {
            delete process.env.SDK_PROBE_TOKEN;
          }
        },
      },
    },
  },
};
