import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtempDisposable, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

const run = promisify(execFile);
const cli = join(import.meta.dirname, '..', 'cli.ts');

test('show finds a memory by the frontmatter name that export prints', async () => {
  await using home = await mkdtempDisposable(join(tmpdir(), 'memory-show-'));
  const memoryDir = join(home.path, '.claude', 'projects', '-Users-someone-Desktop-app', 'memory');
  await mkdir(memoryDir, { recursive: true });
  await writeFile(
    join(memoryDir, 'feedback_work_while_subagents_run.md'),
    '---\nname: work-while-subagents-run\ndescription: keep working\ntype: feedback\n---\nStart every independent item.\n',
  );

  const { stdout } = await run(process.execPath, [cli, 'show', 'work-while-subagents-run'], {
    env: { ...process.env, HOME: home.path },
  });

  assert.match(stdout, /^Desktop-app\/feedback_work_while_subagents_run\.md\n/);
  assert.match(stdout, /Start every independent item\./);
});

test('show still finds a memory by its file basename', async () => {
  await using home = await mkdtempDisposable(join(tmpdir(), 'memory-show-'));
  const memoryDir = join(home.path, '.claude', 'projects', '-Users-someone-Desktop-app', 'memory');
  await mkdir(memoryDir, { recursive: true });
  await writeFile(
    join(memoryDir, 'feedback_work_while_subagents_run.md'),
    '---\nname: work-while-subagents-run\ndescription: keep working\ntype: feedback\n---\nStart every independent item.\n',
  );

  const { stdout } = await run(process.execPath, [cli, 'show', 'feedback_work_while_subagents_run'], {
    env: { ...process.env, HOME: home.path },
  });

  assert.match(stdout, /Start every independent item\./);
});

test('show lists every memory that carries a name when two projects share it', async () => {
  await using home = await mkdtempDisposable(join(tmpdir(), 'memory-show-'));
  const first = join(home.path, '.claude', 'projects', '-Users-someone-Desktop-app', 'memory');
  const second = join(home.path, '.claude', 'projects', '-Users-someone-Desktop-api', 'memory');
  await mkdir(first, { recursive: true });
  await mkdir(second, { recursive: true });
  await writeFile(
    join(first, 'feedback_ci_before_safe_to_close.md'),
    '---\nname: ci-before-safe-to-close\ndescription: green CI\ntype: feedback\n---\nApp body.\n',
  );
  await writeFile(
    join(second, 'feedback_safe_to_close_needs_ci.md'),
    '---\nname: ci-before-safe-to-close\ndescription: green CI\ntype: feedback\n---\nApi body.\n',
  );

  const { stdout } = await run(process.execPath, [cli, 'show', 'ci-before-safe-to-close'], {
    env: { ...process.env, HOME: home.path },
  });

  assert.match(stdout, /^2 memories match "ci-before-safe-to-close"/);
  assert.match(stdout, /Desktop-app\/feedback_ci_before_safe_to_close\.md/);
  assert.match(stdout, /Desktop-api\/feedback_safe_to_close_needs_ci\.md/);
});
