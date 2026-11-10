// Escape text so a RegExp matches it literally.
const texts = ['a.b*c?(d)[e]{f}|g^h$i\\j/k-l 1', '1+1=2', 'C:\\temp\\file.txt', '-]^', 'price: $5.00 (approx.)'];
// What a pattern built from the escaped text matches: on its own, anchored,
// inside a larger pattern, with the v flag, and against a shorter text.
const behaviour = (escape) =>
  texts.map((text) => [
    new RegExp(escape(text)).test(text),
    new RegExp(`^${escape(text)}$`).test(text),
    new RegExp(`x(${escape(text)})y`).exec(`x${text}y`)?.[1],
    new RegExp(`^${escape(text)}$`, 'v').test(text),
    new RegExp(escape(text)).test(text.slice(1)),
  ]);
// Whether a u-flag character class built from the escaped text matches each
// character of the text and refuses one the text does not have.
const inClass = (escape) =>
  texts.map((text) => {
    try {
      const pattern = new RegExp(`^[${escape(text)}]$`, 'u');
      return [[...text].every((character) => pattern.test(character)), pattern.test('_')];
    } catch (error) {
      return error.name;
    }
  });

// [member, how a probe gets the function, whether it escapes "-"]
const escapers = {
  'escape-string-regexp@5.0.0': ['default', ({ default: escape }) => escape, true],
  'lodash@4.18.1': ['escapeRegExp', ({ default: _ }) => _.escapeRegExp, false],
  'lodash-es@4.18.1': ['escapeRegExp', ({ escapeRegExp }) => escapeRegExp, false],
  'lodash.escaperegexp@4.1.2': ['default', ({ default: escape }) => escape, false],
  'es-toolkit@1.53.1': ['escapeRegExp', ({ escapeRegExp }) => escapeRegExp, false],
};

export default {
  apis: ['js:RegExp.escape'],
  reviewedAt: 'v26.13.0',
  replaces: Object.fromEntries(
    Object.entries(escapers).map(([spec, [member, get, escapesHyphen]]) => [
      spec,
      {
        [member]: {
          native: () => behaviour(RegExp.escape),
          package: (module) => behaviour(get(module)),
        },
        [`${member}: character class`]: {
          ...(!escapesHyphen && {
            improves: `RegExp.escape escapes "-", so the text stays literal inside a character class; ${spec} leaves "-" bare, so the text turns into a range there`,
          }),
          native: () => inClass(RegExp.escape),
          package: (module) => inClass(get(module)),
        },
        [`${member}: escaped text`]: {
          gap: 'RegExp.escape writes a leading letter or digit, whitespace and ,-=<>#&!%:;@~\'`" as \\x or \\u escapes, so the escaped string differs where code stores or compares it',
          native: () => texts.map((text) => RegExp.escape(text)),
          package: (module) => texts.map((text) => get(module)(text)),
        },
      },
    ]),
  ),
  idioms: {
    replaceSpecials: {
      seed: '\\.replace(?:All)?\\(\\s*/\\[(?:[^\\]\\\\\\n]|\\\\.)*\\]/g\\w*,\\s*([\'"`])\\\\\\\\\\$&\\1\\s*\\)',
      native: () => behaviour(RegExp.escape),
      idiom: () => behaviour((text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    },
    'replaceSpecials: character class': {
      improves: 'RegExp.escape escapes "-", so the text stays literal inside a character class; the replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") idiom leaves "-" bare, so the text turns into a range there',
      native: () => inClass(RegExp.escape),
      idiom: () => inClass((text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    },
  },
  lint: {
    preferRegexpEscape: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-regexp-escape',
      idiom: 'replaceSpecials',
      failed: '1 of 8 hits on good code, 3 of 12 in all repos: the fix can change what the pattern matches, and no error occurs',
      code: "const escaped = text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
    },
  },
};
