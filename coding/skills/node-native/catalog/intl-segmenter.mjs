// Split text into user-perceived characters (grapheme clusters).
const texts = ['café', 'é', '👨‍👩‍👧‍👦 family', '🇯🇵🇺🇸', 'நி', 'ก่', '🏳️‍🌈', '\r\n', 'a‍b'];
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const split = (text) => Array.from(segmenter.segment(text), ({ segment }) => segment);
// Unicode 15.1 joins an Indic conjunct (consonant + virama + consonant) into one cluster.
const conjuncts = ['क्षि', 'ক্ষ'];
// An emoji ZWJ sequence that grapheme-splitter's Unicode tables predate.
const newerEmoji = ['🧑🏽‍🦰'];

export default {
  apis: ['js:Intl.Segmenter', 'js:Intl.Segmenter.prototype.segment'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'graphemer@1.4.0': {
      splitGraphemes: {
        native: () => texts.map(split),
        package: ({ default: { default: Graphemer } }) => texts.map((text) => new Graphemer().splitGraphemes(text)),
      },
      iterateGraphemes: {
        native: () => texts.map(split),
        package: ({ default: { default: Graphemer } }) => texts.map((text) => [...new Graphemer().iterateGraphemes(text)]),
      },
      countGraphemes: {
        native: () => texts.map((text) => split(text).length),
        package: ({ default: { default: Graphemer } }) => texts.map((text) => new Graphemer().countGraphemes(text)),
      },
      'splitGraphemes: Indic conjuncts': {
        improves: 'Intl.Segmenter follows Unicode 15.1+ and keeps an Indic conjunct (क्षि) in one cluster; graphemer splits it in two',
        native: () => conjuncts.map(split),
        package: ({ default: { default: Graphemer } }) => conjuncts.map((text) => new Graphemer().splitGraphemes(text)),
      },
    },
    'grapheme-splitter@1.0.4': {
      splitGraphemes: {
        native: () => texts.map(split),
        package: ({ default: GraphemeSplitter }) => texts.map((text) => new GraphemeSplitter().splitGraphemes(text)),
      },
      countGraphemes: {
        native: () => texts.map((text) => split(text).length),
        package: ({ default: GraphemeSplitter }) => texts.map((text) => new GraphemeSplitter().countGraphemes(text)),
      },
      'splitGraphemes: newer emoji': {
        improves: 'Intl.Segmenter keeps 🧑🏽‍🦰 whole; grapheme-splitter (last published 2017) splits it in two',
        native: () => newerEmoji.map(split),
        package: ({ default: GraphemeSplitter }) => newerEmoji.map((text) => new GraphemeSplitter().splitGraphemes(text)),
      },
      'splitGraphemes: Indic conjuncts': {
        improves: 'Intl.Segmenter follows Unicode 15.1+ and keeps an Indic conjunct (क्षि) in one cluster; grapheme-splitter splits it in two',
        native: () => conjuncts.map(split),
        package: ({ default: GraphemeSplitter }) => conjuncts.map((text) => new GraphemeSplitter().splitGraphemes(text)),
      },
    },
  },
};
