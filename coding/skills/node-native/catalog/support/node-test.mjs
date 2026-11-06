// Runs one test file with node:test's run() and reports what happened, so an
// entry compares a test runner's outcome without parsing a reporter's output.
// The file usually lives in an inScratch directory (./scratch.mjs).
//
//   runTestFile(file, options) -> { outcomes, coverage, exports }
//     `options` go to run() as they are (isolation, only, execArgv, coverage, …).
//     outcomes  { <test name>: 'pass' | 'fail' | 'skip' | 'todo' } for every
//               test (not suite), at any depth; a later test of one name wins.
//     coverage  the summary of the run's test:coverage event, or undefined.
//     exports   the file's module namespace when `isolation: 'none'` loaded it
//               into this process, else undefined; a test file can export what
//               its tests recorded (`export const order = []`).
// A run whose tests fail still resolves, and it leaves process.exitCode alone.
import { run } from 'node:test';
import { pathToFileURL } from 'node:url';

export async function runTestFile(file, options = {}) {
  const outcomes = {};
  let coverage;
  for await (const event of run({ files: [file], ...options })) {
    if (event.type === 'test:coverage') coverage = event.data.summary;
    if ((event.type === 'test:pass' || event.type === 'test:fail') && event.data.details.type === 'test') {
      const { name, skip, todo } = event.data;
      if (skip) outcomes[name] = 'skip';
      else if (todo) outcomes[name] = 'todo';
      else outcomes[name] = event.type === 'test:pass' ? 'pass' : 'fail';
    }
  }
  const exports = options.isolation === 'none' ? await import(pathToFileURL(file).href) : undefined;
  return { outcomes, coverage, exports };
}
