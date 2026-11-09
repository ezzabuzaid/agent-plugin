// The configs a lint row's `on` can name: the package a user installs for each,
// and the peers npm does not install for it. probe.mjs checks each lint row
// against them.
const ZUKHRUF_ESLINT = '@zukhruf/eslint@0.8.12';

export default {
  'modern-node/recommended': {
    from: `${ZUKHRUF_ESLINT}/modern-node`,
    config: 'recommended',
    peers: ['@e18e/eslint-plugin@0.8.1', 'eslint-plugin-unicorn@79.0.0'],
  },
  'zukhruf/base': {
    from: ZUKHRUF_ESLINT,
    config: 'base',
    peers: [
      '@eslint/js@10.0.1',
      'eslint-plugin-functional@10.0.1',
      'eslint-plugin-import-x@4.18.1',
      'jsonc-eslint-parser@3.3.0',
      'typescript-eslint@8.72.1',
      'typescript@5.9.3',
    ],
  },
};
