// Black-box tests of prune-memory.ts: each test runs the script as a child process on a memory folder it writes into
// its own temp dir, in the index shapes the real corpus holds (one link per line, a list of links with notes, a second
// MEMORY-*.md index), and reads back the folder and the script's output.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtempDisposable, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

const run = promisify(execFile);
const script = join(import.meta.dirname, 'prune-memory.ts');

const memory = (name: string, body: string) => `---\nname: ${name}\ndescription: d\ntype: feedback\n---\n${body}\n`;

test('a line that links only the pruned memory is removed, and the memory file with it', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'prune-memory-'));
  await writeFile(join(dir.path, 'gone.md'), memory('gone', 'x'));
  await writeFile(join(dir.path, 'kept.md'), memory('kept', 'y'));
  await writeFile(
    join(dir.path, 'MEMORY.md'),
    '- [Gone](gone.md) — the hook\n- [Kept](kept.md) — another hook\n',
  );

  await run(process.execPath, [script, join(dir.path, 'gone.md')]);

  assert.equal(await readFile(join(dir.path, 'MEMORY.md'), 'utf8'), '- [Kept](kept.md) — another hook\n');
  await assert.rejects(access(join(dir.path, 'gone.md')), { code: 'ENOENT' });
});

test('a line that links several memories loses only the pruned link, its note and its separator', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'prune-memory-'));
  await writeFile(join(dir.path, 'gone.md'), memory('gone', 'x'));
  await writeFile(
    join(dir.path, 'MEMORY.md'),
    '- Remove first: [Redesign first](redesign.md) (extend the port), [Gone](gone.md) (cases: #1, #2), [Display needs](display.md)\n',
  );

  await run(process.execPath, [script, join(dir.path, 'gone.md')]);

  assert.equal(
    await readFile(join(dir.path, 'MEMORY.md'), 'utf8'),
    '- Remove first: [Redesign first](redesign.md) (extend the port), [Display needs](display.md)\n',
  );
});

test('the last link of a list loses the separator before it', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'prune-memory-'));
  await writeFile(join(dir.path, 'gone.md'), memory('gone', 'x'));
  await writeFile(
    join(dir.path, 'MEMORY.md'),
    '- [fs funnel](funnel.md) — all IO via fs ([throw → exit 1](throw.md); [Gone](gone.md))\n',
  );

  await run(process.execPath, [script, join(dir.path, 'gone.md')]);

  assert.equal(
    await readFile(join(dir.path, 'MEMORY.md'), 'utf8'),
    '- [fs funnel](funnel.md) — all IO via fs ([throw → exit 1](throw.md))\n',
  );
});

test('every MEMORY*.md index in the folder loses the pruned link', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'prune-memory-'));
  await writeFile(join(dir.path, 'gone.md'), memory('gone', 'x'));
  await writeFile(join(dir.path, 'MEMORY.md'), '## User (hot set)\n- [Gone](gone.md) — hook\n');
  await writeFile(join(dir.path, 'MEMORY-feedback.md'), '## Feedback\n- [Gone](gone.md) — hook\n- [Kept](kept.md)\n');
  await writeFile(join(dir.path, 'MEMORY-project.md'), '## Project\n- [Kept](kept.md)');

  await run(process.execPath, [script, join(dir.path, 'gone.md')]);

  assert.equal(await readFile(join(dir.path, 'MEMORY.md'), 'utf8'), '## User (hot set)\n');
  assert.equal(await readFile(join(dir.path, 'MEMORY-feedback.md'), 'utf8'), '## Feedback\n- [Kept](kept.md)\n');
  assert.equal(await readFile(join(dir.path, 'MEMORY-project.md'), 'utf8'), '## Project\n- [Kept](kept.md)');
});

test('a [[link]] to the pruned memory in another memory of the folder is reported as dangling', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'prune-memory-'));
  await writeFile(join(dir.path, 'feedback_gone.md'), memory('gone-rule', 'x'));
  await writeFile(join(dir.path, 'by-slug.md'), memory('by-slug', 'See [[feedback_gone]].'));
  await writeFile(join(dir.path, 'by-name.md'), memory('by-name', 'See [[gone-rule]].'));
  await writeFile(join(dir.path, 'by-alias.md'), memory('by-alias', 'See [[feedback_gone|the old rule]].'));
  await writeFile(join(dir.path, 'unrelated.md'), memory('unrelated', 'See [[something-else]].'));
  await writeFile(join(dir.path, 'MEMORY.md'), '- [Gone](feedback_gone.md)\n');

  const { stdout } = await run(process.execPath, [script, join(dir.path, 'feedback_gone.md')]);

  assert.match(stdout, /by-slug\.md.*\[\[feedback_gone\]\]/);
  assert.match(stdout, /by-name\.md.*\[\[gone-rule\]\]/);
  assert.match(stdout, /by-alias\.md.*\[\[feedback_gone\|the old rule\]\]/);
  assert.doesNotMatch(stdout, /unrelated\.md/);
});

test('an index file is refused as a target and left in place', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'prune-memory-'));
  await writeFile(join(dir.path, 'MEMORY-feedback.md'), '- [Kept](kept.md)\n');

  await assert.rejects(run(process.execPath, [script, join(dir.path, 'MEMORY-feedback.md')]), {
    code: 1,
    stderr: /refusing to prune the index MEMORY-feedback\.md/,
  });

  assert.equal(await readFile(join(dir.path, 'MEMORY-feedback.md'), 'utf8'), '- [Kept](kept.md)\n');
});
