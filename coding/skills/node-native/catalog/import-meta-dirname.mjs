// The directory and file of the current ES module.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default {
  apis: ['js:import.meta.dirname', 'js:import.meta.filename'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'dirname-filename-esm@1.1.2': {
      dirname: {
        native: () => import.meta.dirname,
        package: ({ dirname }) => dirname(import.meta),
      },
      filename: {
        native: () => import.meta.filename,
        package: ({ filename }) => filename(import.meta),
      },
    },
  },
  idioms: {
    dirnameFromUrl: {
      seed: 'dirname\\(\\s*(?:\\w+\\.)?fileURLToPath\\(\\s*import\\.meta\\.url\\s*\\)\\s*\\)',
      native: () => import.meta.dirname,
      idiom: () => path.dirname(fileURLToPath(import.meta.url)),
    },
    filenameFromUrl: {
      seed: '(?<!dirname\\(\\s*(?:\\w+\\.)?)fileURLToPath\\(\\s*import\\.meta\\.url\\s*\\)',
      native: () => import.meta.filename,
      idiom: () => fileURLToPath(import.meta.url),
    },
  },
  lint: {
    preferImportMetaProperties: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-import-meta-properties',
      idiom: 'dirnameFromUrl',
      on: 'modern-node/recommended',
      code: "import path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst here = path.dirname(fileURLToPath(import.meta.url));",
    },
    filenameFromUrl: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-import-meta-properties',
      idiom: 'filenameFromUrl',
      on: 'modern-node/recommended',
      code: "import { fileURLToPath } from 'node:url';\nconst file = fileURLToPath(import.meta.url);",
    },
  },
};
