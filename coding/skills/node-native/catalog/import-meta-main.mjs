// Whether the current ES module is the program's entry point.
import { output } from './support/child.mjs';
import { inScratch } from './support/scratch.mjs';

// main.mjs imports lib.mjs; each prints `check(import.meta)` for itself.
const report = (check) => `const check = ${check};\nconsole.log(import.meta.url.split('/').at(-1), check(import.meta));\n`;
const run = (header, check) =>
  inScratch(
    { 'main.mjs': `${header}\nimport './lib.mjs';\n${report(check)}`, 'lib.mjs': `${header}\n${report(check)}` },
    (dir) => output(['main.mjs'], { cwd: dir }),
  );

export default {
  apis: ['js:import.meta.main'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'es-main@1.4.0': {
      default: {
        native: () => run('', '(meta) => meta.main'),
        package: (module, { url }) => run(`import esMain from ${JSON.stringify(url)};`, 'esMain'),
      },
    },
  },
};
