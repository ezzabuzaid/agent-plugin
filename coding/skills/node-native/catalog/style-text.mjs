// Terminal colours and text modifiers: ANSI SGR escapes around a string.
import { styleText } from 'node:util';

// The probes compare escape codes, so the native side skips its TTY check.
const plain = { validateStream: false };
const style = (format, text = 'x') => styleText(format, text, plain);

const modifiers = ['reset', 'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough'];
const base = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
const backgrounds = ['bgBlack', 'bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan', 'bgWhite'];
const bright = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].flatMap((color) => {
  const name = `${color}Bright`;
  return [name, `bg${name[0].toUpperCase()}${name.slice(1)}`];
});
const blackBright = ['blackBright', 'bgBlackBright'];

// One row per style name the package exposes as a function of the text.
const rows = (names, paint) =>
  Object.fromEntries(
    names.map((name) => [
      name,
      {
        native: () => style(name),
        package: (module) => paint(module)[name]('x'),
      },
    ]),
  );

const chalk = ({ Chalk }) => new Chalk({ level: 3 });
const picocolors = ({ default: pc }) => pc.createColors(true);
const kleur = ({ default: kleur }) => {
  kleur.enabled = true;
  return kleur;
};
const colorette = ({ createColors }) => createColors({ useColor: true });
const ansiColors = ({ default: colors }) => {
  const instance = colors.create();
  instance.enabled = true;
  return instance;
};

export default {
  apis: ['util:util.styleText'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'chalk@6.0.1': {
      ...rows([...modifiers, ...base, ...backgrounds, ...bright, ...blackBright, 'grey', 'bgGray', 'bgGrey'], chalk),
      'bold: chained with red': {
        native: () => style(['bold', 'red']),
        package: (module) => chalk(module).bold.red('x'),
      },
      hex: {
        native: () => style('#ff5733'),
        package: (module) => chalk(module).hex('#ff5733')('x'),
      },
      rgb: {
        native: () => style('#ff5733'),
        package: (module) => chalk(module).rgb(255, 87, 51)('x'),
      },
      bgHex: {
        gap: 'no truecolor background: a hex format colours only the foreground',
        native: () => style('bg#ff5733'),
        package: (module) => chalk(module).bgHex('#ff5733')('x'),
      },
      bgRgb: {
        gap: 'no truecolor background: a hex format colours only the foreground',
        native: () => style('bg#ff5733'),
        package: (module) => chalk(module).bgRgb(255, 87, 51)('x'),
      },
      ansi256: {
        gap: 'no 256-colour palette',
        native: () => style('ansi256(208)'),
        package: (module) => chalk(module).ansi256(208)('x'),
      },
      bgAnsi256: {
        gap: 'no 256-colour palette',
        native: () => style('bgAnsi256(208)'),
        package: (module) => chalk(module).bgAnsi256(208)('x'),
      },
      'red: multi-line text': {
        gap: 'chalk closes and reopens the style around each line break; styleText wraps the whole string once',
        native: () => style('red', 'a\nb'),
        package: (module) => chalk(module).red('a\nb'),
      },
    },
    'picocolors@1.1.1': {
      ...rows([...modifiers, ...base, ...backgrounds, ...bright, ...blackBright], picocolors),
      'red: nested blue': {
        native: () => style('red', `a${style('blue', 'b')}c`),
        package: (module) => {
          const pc = picocolors(module);
          return pc.red(`a${pc.blue('b')}c`);
        },
      },
    },
    'kleur@4.1.5': rows([...modifiers, ...base, ...backgrounds, 'grey'], kleur),
    'colorette@2.0.20': rows([...modifiers, ...base, ...backgrounds, ...bright, ...blackBright], colorette),
    'ansi-colors@4.1.3': {
      ...rows([...modifiers, ...base, ...backgrounds, ...bright, ...blackBright, 'grey'], ansiColors),
      'bold: chained with red': {
        native: () => style(['bold', 'red']),
        package: (module) => ansiColors(module).bold.red('x'),
      },
    },
  },
  idioms: {
    ansiEscapes: {
      seed: '\\\\(x1[bB]|u001[bB]|033|e)\\[\\d+(;\\d+)*m',
      native: () => style(['bold', 'red'], 'failed'),
      idiom: () => `\x1b[1m\x1b[31mfailed\x1b[39m\x1b[22m`,
    },
  },
  lint: {
    banChalk: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import chalk from 'chalk';",
    },
  },
};
