// Parsing the text of a .env file into key-value pairs.
import { parseEnv } from 'node:util';

const content = [
  'A=1',
  "S='single'",
  'D="double"',
  'B=`back`',
  'C=1 # trailing comment',
  '# full-line comment',
  'export X=exported',
  'M="line1\nline2"',
  'E="a\\nb"',
  "R='a\\nb'",
  '  SPACED = spaced value  ',
  'EMPTY=',
  'QUOTED_EMPTY=""',
  'DUP=1',
  'DUP=2',
  'H="a#b"',
  'JUSTKEY',
  'REF=${A}',
].join('\n');

export default {
  apis: ['util:util.parseEnv'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'dotenv@18.0.9': {
      parse: {
        native: () => ({ ...parseEnv(content) }),
        package: ({ default: dotenv }) => dotenv.parse(content),
      },
      'parse: CRLF line endings': {
        native: () => ({ ...parseEnv('A=1\r\nB=2\r\n') }),
        package: ({ default: dotenv }) => dotenv.parse('A=1\r\nB=2\r\n'),
      },
      'parse: colon separator': {
        gap: 'no "KEY: value" lines; only KEY=value',
        native: () => ({ ...parseEnv('A: 1\n') }),
        package: ({ default: dotenv }) => dotenv.parse('A: 1\n'),
      },
      'parse: Buffer input': {
        gap: 'takes a string only; dotenv.parse also takes a Buffer',
        native: () => ({ ...parseEnv(Buffer.from('A=1')) }),
        package: ({ default: dotenv }) => dotenv.parse(Buffer.from('A=1')),
      },
    },
  },
  lint: {
    banDotenv: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import dotenv from 'dotenv';",
    },
  },
};
