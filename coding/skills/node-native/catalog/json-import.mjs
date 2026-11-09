// Loading a JSON file as a module from ES module code.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export default {
  apis: ['js:syntax:import-attributes'],
  reviewedAt: 'v26.13.0',
  idioms: {
    requireJson: {
      seed: "createRequire\\(\\s*import\\.meta\\.url\\s*\\)\\(\\s*[`'\"][^`'\"]+\\.json[`'\"]",
      native: async () => (await import('../surface.json', { with: { type: 'json' } })).default.node,
      idiom: () => createRequire(import.meta.url)('../surface.json').node,
    },
    parseJsonFile: {
      seed: "JSON\\.parse\\(\\s*(?:await\\s+)?(?:\\w+\\.)?readFile(?:Sync)?\\(\\s*(?:new URL\\(\\s*['\"`][^'\"`$]+\\.json['\"`]\\s*,\\s*import\\.meta\\.url|(?:\\w+\\.)?(?:join|resolve)\\(\\s*(?:import\\.meta\\.dirname|__dirname)\\s*,[^()]*\\.json['\"`]\\s*\\))",
      native: async () => (await import('../surface.json', { with: { type: 'json' } })).default.node,
      idiom: () => JSON.parse(readFileSync(new URL('../surface.json', import.meta.url), 'utf8')).node,
    },
  },
  lint: {
    preferJsonImport: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-json-import',
      failed: '3 of 4 hits on good code: the file is outside rootDir, or the code rewrites it',
      code: "import { readFileSync } from 'node:fs';\nconst data = JSON.parse(readFileSync(new URL('./data.json', import.meta.url), 'utf8'));",
    },
  },
};
