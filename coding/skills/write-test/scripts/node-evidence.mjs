// Add alongside the command's human reporter. Node's root summary can count
// an empty file as a passing test; its per-file summaries count real tests.
// Requires Node's default process isolation, which emits per-file summaries.
//
// A synchronous Transform, not an async generator: with --test-force-exit, Node
// exits as soon as the first reporter sharing a destination (stdout) ends, and
// an async generator still lags behind the events at that point.
import { Transform } from 'node:stream';

const files = [];

export default new Transform({
  writableObjectMode: true,
  transform({ type, data }, _encoding, callback) {
    if (type !== 'test:summary') return callback();
    if (data.file !== undefined) {
      files.push(data.counts);
      return callback();
    }
    const counts = { run: 0, pass: 0, fail: 0, cancelled: 0 };
    for (const summary of files) {
      counts.run += summary.tests;
      counts.pass += summary.passed;
      counts.fail += summary.failed;
      counts.cancelled += summary.cancelled;
    }
    callback(null, `write-test:${process.env.WRITE_TEST_REPORT_ID}:${JSON.stringify(counts)}\n`);
  },
});
