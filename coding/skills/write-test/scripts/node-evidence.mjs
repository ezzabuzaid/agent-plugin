// Add alongside the command's human reporter. Node's root summary can count
// an empty file as a passing test; its per-file summaries count real tests.
// Requires Node's default process isolation, which emits per-file summaries.
export default async function* nodeEvidence(events) {
  const files = [];
  for await (const { type, data } of events) {
    if (type !== 'test:summary') continue;
    if (data.file !== undefined) {
      files.push(data.counts);
      continue;
    }
    const counts = { run: 0, pass: 0, fail: 0, cancelled: 0 };
    for (const summary of files) {
      counts.run += summary.tests;
      counts.pass += summary.passed;
      counts.fail += summary.failed;
      counts.cancelled += summary.cancelled;
    }
    yield `write-test:${process.env.WRITE_TEST_REPORT_ID}:${JSON.stringify(counts)}\n`;
  }
}
