// Runs one side of a probe that may throw or reject, and turns the throw into a
// value a row compares, so the row reports a difference instead of probe-error.
//
//   outcome(run, record) -> run()'s value, or `threw ${record(error)}`
//   settled(run, record) -> ['resolved', run()'s value], or ['rejected', record(error)]
//   failure(run, record, success) -> success (default 'resolved'), or record(error)
//     with no prefix; run()'s value is never kept, so a row that compares only
//     how two calls fail cannot differ on what they returned.
//     run     called with no arguments. When it returns a promise (or another
//             thenable), the result is a promise of the same: its value, or
//             what it rejects with; a synchronous throw is caught either way.
//     record  the part of the error the row compares (default: error.name, or
//             error.message for failure), such as (error) => error.code.
// Any other value the error carries is left out, so two errors that differ only
// there compare equal.
const byName = (error) => error.name;
const byMessage = (error) => error.message;

function attempt(run, resolved, rejected) {
  let value;
  try {
    value = run();
  } catch (error) {
    return rejected(error);
  }
  return typeof value?.then === 'function' ? Promise.resolve(value).then(resolved, rejected) : resolved(value);
}

export const outcome = (run, record = byName) =>
  attempt(
    run,
    (value) => value,
    (error) => `threw ${record(error)}`,
  );

export const settled = (run, record = byName) =>
  attempt(
    run,
    (value) => ['resolved', value],
    (error) => ['rejected', record(error)],
  );

export const failure = (run, record = byMessage, success = 'resolved') => attempt(run, () => success, record);
