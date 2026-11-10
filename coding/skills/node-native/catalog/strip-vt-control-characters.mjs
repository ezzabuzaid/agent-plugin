// Removing ANSI escape sequences (colours, cursor moves, OSC 8 hyperlinks) from a string.
import { stripVTControlCharacters } from 'node:util';

const escaped = {
  sgr: '\u001B[1m\u001B[31mred\u001B[39m\u001B[22m',
  truecolor: '\u001B[38;2;255;87;51mx\u001B[39m',
  colonSgr: '\u001B[38:2::255:0:0mx\u001B[0m',
  hyperlinkBel: '\u001B]8;;https://nodejs.org\u0007link\u001B]8;;\u0007',
  hyperlinkSt: '\u001B]8;;https://nodejs.org\u001B\\link\u001B]8;;\u001B\\',
  cursor: '\u001B[2K\u001B[1Gdone',
  c1: '\u009B31mred\u009B0m',
  title: '\u001B]0;title\u0007text',
};
const all = Object.values(escaped);
const sgrOnly = [escaped.sgr, escaped.truecolor, escaped.cursor, escaped.c1, escaped.title];

export default {
  apis: ['util:util.stripVTControlCharacters'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'strip-ansi@7.2.0': {
      default: {
        native: () => all.map((text) => stripVTControlCharacters(text)),
        package: ({ default: stripAnsi }) => all.map((text) => stripAnsi(text)),
      },
    },
    'ansi-regex@6.5.0': {
      'default: replace': {
        native: () => all.map((text) => stripVTControlCharacters(text)),
        package: ({ default: ansiRegex }) => all.map((text) => text.replace(ansiRegex(), '')),
      },
      'default: test': {
        native: () => [...all, 'plain'].map((text) => stripVTControlCharacters(text) !== text),
        package: ({ default: ansiRegex }) => [...all, 'plain'].map((text) => ansiRegex().test(text)),
      },
    },
    'ansi-colors@4.1.3': {
      unstyle: {
        native: () => sgrOnly.map((text) => stripVTControlCharacters(text)),
        package: ({ default: colors }) => sgrOnly.map((text) => colors.unstyle(text)),
      },
      stripColor: {
        native: () => sgrOnly.map((text) => stripVTControlCharacters(text)),
        package: ({ default: colors }) => sgrOnly.map((text) => colors.stripColor(text)),
      },
    },
  },
  idioms: {
    sgrRegex: {
      seed: '\\.replace\\(\\s*/\\\\(x1[bB]|u001[bB]|033|e)\\\\\\[',
      native: () => stripVTControlCharacters(escaped.sgr),
      idiom: () => escaped.sgr.replace(/\x1b\[[0-9;]*m/g, ''),
    },
  },
  lint: {
    banStripAnsi: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'strip-ansi',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import stripAnsi from 'strip-ansi';",
    },
  },
};
