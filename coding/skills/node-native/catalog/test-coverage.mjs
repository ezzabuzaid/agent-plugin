// Code coverage of a test run: covered lines, branches and functions per file,
// files no test loaded, and a minimum that fails the run.
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTestFile } from './support/node-test.mjs';
import { output, run } from './support/child.mjs';
import { inScratch } from './support/scratch.mjs';

const files = {
  'lib.mjs': `export function sign(n) {
  if (n > 0) {
    return 'positive';
  }
  if (n < 0) {
    return 'negative';
  }
  return 'zero';
}

export function unused() {
  return 'never';
}
`,
  'untested.mjs': "export const idle = () => 'idle';\n",
  'lib.test.mjs': "import { test } from 'node:test';\nimport { sign } from './lib.mjs';\ntest('sign', () => {\n  sign(1);\n  sign(0);\n});\n",
};
const sources = ['lib.mjs', 'untested.mjs'];
const sorted = (rows) => rows.sort((a, b) => a.file.localeCompare(b.file));
const linesOnly = (rows) => rows.map(({ file, lines, uncoveredLines }) => ({ file, lines, uncoveredLines }));

// node:test's coverage summary for the run, per source file.
const nativeCoverage = (options = {}) =>
  inScratch(files, async (dir) => {
    const { coverage } = await runTestFile(join(dir, 'lib.test.mjs'), {
      cwd: dir,
      coverage: true,
      coverageIncludeGlobs: sources,
      ...options,
    });
    return sorted(
      coverage.files.map((file) => ({
        file: file.path.slice(dir.length + 1),
        lines: [file.coveredLineCount, file.totalLineCount],
        branches: [file.coveredBranchCount, file.totalBranchCount],
        functions: [file.coveredFunctionCount, file.totalFunctionCount],
        uncoveredLines: file.lines.filter((line) => line.count === 0).map((line) => line.line),
      })),
    );
  });
// c8's way: run the tests with NODE_V8_COVERAGE, then read the V8 coverage
// files with its Report. Report matches relative globs against process.cwd(),
// so the probe gives it absolute ones.
const c8Coverage = ({ Report }, options = {}) =>
  inScratch(files, async (dir) => {
    const tempDirectory = join(dir, '.v8');
    await output(['--test', join(dir, 'lib.test.mjs')], { cwd: dir, env: { NODE_V8_COVERAGE: tempDirectory } });
    const report = new Report({
      tempDirectory,
      reporter: [],
      include: sources.map((source) => join(dir, source)),
      exclude: [],
      allowExternal: true,
      src: [dir],
      ...options,
    });
    const map = await report.getCoverageMapFromAllCoverageFiles();
    return sorted(
      map.files().map((path) => {
        const coverage = map.fileCoverageFor(path);
        const { lines, branches, functions } = coverage.toSummary();
        return {
          file: path.slice(dir.length + 1),
          lines: [lines.covered, lines.total],
          branches: [branches.covered, branches.total],
          functions: [functions.covered, functions.total],
          uncoveredLines: coverage.getUncoveredLines().map(Number),
        };
      }),
    );
  });
// The exit code of a run that needs 80% of lines covered (lib.mjs has 69%).
const exitCode = async (cwd, command) => (await run(command, { cwd })).code;

export default {
  apis: [
    'cli:--experimental-test-coverage',
    'cli:--test-coverage-include',
    'cli:--test-coverage-include-all',
    'cli:--test-coverage-lines',
    'test:run',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'c8@12.0.0': {
      Report: {
        native: () => nativeCoverage(),
        package: (module) => c8Coverage(module),
      },
      'Report: all': {
        native: async () => linesOnly(await nativeCoverage({ coverageIncludeAll: true })),
        package: async (module) => linesOnly(await c8Coverage(module, { all: true })),
      },
      'Report: all, an unloaded file': {
        gap: 'a file no test loaded counts no branch and no function natively; c8 counts its module wrapper as one of each',
        native: async () => (await nativeCoverage({ coverageIncludeAll: true })).find(({ file }) => file === 'untested.mjs'),
        package: async (module) => (await c8Coverage(module, { all: true })).find(({ file }) => file === 'untested.mjs'),
      },
      'Report: check coverage': {
        native: () =>
          inScratch(files, (dir) =>
            exitCode(dir, [
              '--test',
              '--experimental-test-coverage',
              '--test-coverage-include=lib.mjs',
              '--test-coverage-lines=80',
              '--test-reporter=dot',
              join(dir, 'lib.test.mjs'),
            ]),
          ),
        package: (_, { url }) =>
          inScratch(files, (dir) =>
            exitCode(dir, [
              join(fileURLToPath(new URL('.', url)), 'bin', 'c8.js'),
              '--check-coverage',
              '--lines=80',
              '--include=lib.mjs',
              '--reporter=text-summary',
              `--temp-directory=${join(dir, '.v8')}`,
              `--report-dir=${join(dir, 'coverage')}`,
              process.execPath,
              '--test',
              '--test-reporter=dot',
              join(dir, 'lib.test.mjs'),
            ]),
          ),
      },
    },
  },
};
