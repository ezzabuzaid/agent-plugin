// Loaded by mutate.mjs into every Node process of one in-memory mutant run,
// through NODE_OPTIONS=--import. As Node loads a mutated file, its source gets
// each edit's `find` replaced with `replace`; the file on disk never changes,
// so other processes and sessions working in the same tree never see the
// mutant. A TypeScript source is edited before Node strips its types, and
// `require()` goes through the same hook as `import`.
//
// WRITE_TEST_MUTANT holds the mutant: { log, edits: [{ file, find, replace }] }
// with absolute file paths. Each process that loads a mutated file appends one
// JSON line to `log`, so mutate.mjs can tell a mutant the tests never ran from
// one they ran and missed. Nothing here throws: a throw inside a test process
// would fail the test and read as CAUGHT.
import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const mutant = (() => {
  try {
    return JSON.parse(process.env.WRITE_TEST_MUTANT ?? 'null');
  } catch {
    return null;
  }
})();

// Node resolves a module to its real path, so the edits are keyed the same way.
const editsByUrl = new Map();
for (const edit of mutant?.edits ?? []) {
  try {
    const url = pathToFileURL(realpathSync(edit.file)).href;
    editsByUrl.set(url, [...(editsByUrl.get(url) ?? []), edit]);
  } catch {
    // A file deleted after mutate.mjs checked it: never loaded, so INVALID.
  }
}

function record(entry) {
  try {
    appendFileSync(mutant.log, `${JSON.stringify({ pid: process.pid, ...entry })}\n`);
  } catch {
    // An unwritable log reads as "never loaded", which is INVALID, not a verdict.
  }
}

if (editsByUrl.size) {
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      const edits = editsByUrl.get(url);
      if (!edits) return result;
      try {
        let source = result.source == null ? readFileSync(fileURLToPath(url), 'utf8') : Buffer.from(result.source).toString('utf8');
        for (const { find, replace } of edits) {
          const count = source.split(find).length - 1;
          if (count !== 1) {
            record({ url, applied: false, count });
            return result;
          }
          source = source.replace(find, () => replace);
        }
        record({ url, applied: true });
        return { ...result, source };
      } catch {
        // An unreadable source runs unmutated and is logged as never loaded: INVALID.
        return result;
      }
    },
  });
}
