import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtempDisposable, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

const run = promisify(execFile);
const cli = join(import.meta.dirname, '..', 'cli.ts');

test('export lists no MEMORY*.md index file as a memory when the index is split', async () => {
  await using home = await mkdtempDisposable(join(tmpdir(), 'memory-export-'));
  const memoryDir = join(home.path, '.claude', 'projects', '-Users-someone-Desktop-app', 'memory');
  await mkdir(memoryDir, { recursive: true });
  await writeFile(join(memoryDir, 'MEMORY.md'), '- [Feedback](MEMORY-feedback.md)\n');
  await writeFile(join(memoryDir, 'MEMORY-feedback.md'), '- [Keep working](feedback_keep_working.md)\n');
  await writeFile(
    join(memoryDir, 'feedback_keep_working.md'),
    '---\nname: keep-working\ndescription: keep working\ntype: feedback\n---\nStart every independent item.\n',
  );

  const { stdout } = await run(process.execPath, [cli, 'export'], { env: { ...process.env, HOME: home.path } });

  const [project] = JSON.parse(stdout);
  assert.deepEqual(
    project.memories.map((m: { file: string }) => m.file),
    ['feedback_keep_working.md'],
  );
  assert.equal(project.hasIndex, true);
});

test('export reports no index for a folder whose only index files are split ones', async () => {
  await using home = await mkdtempDisposable(join(tmpdir(), 'memory-export-'));
  const memoryDir = join(home.path, '.claude', 'projects', '-Users-someone-Desktop-app', 'memory');
  await mkdir(memoryDir, { recursive: true });
  await writeFile(join(memoryDir, 'MEMORY-feedback.md'), '- [Keep working](feedback_keep_working.md)\n');
  await writeFile(
    join(memoryDir, 'feedback_keep_working.md'),
    '---\nname: keep-working\ndescription: keep working\ntype: feedback\n---\nStart every independent item.\n',
  );

  const { stdout } = await run(process.execPath, [cli, 'export'], { env: { ...process.env, HOME: home.path } });

  const [project] = JSON.parse(stdout);
  assert.deepEqual(
    project.memories.map((m: { file: string }) => m.file),
    ['feedback_keep_working.md'],
  );
  assert.equal(project.hasIndex, false);
});
