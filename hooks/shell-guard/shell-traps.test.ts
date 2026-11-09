import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// GIT_GUARD_SCRIPT lets the suite run against a scratch copy before the real hook is replaced.
const SCRIPT =
  process.env.GIT_GUARD_SCRIPT ?? new URL('./block-git-mutation.ts', import.meta.url).pathname;

function decide(command: string, { tool = 'Bash', background = false } = {}): string | null {
  const result = spawnSync('node', [SCRIPT], {
    input: JSON.stringify({
      tool_name: tool,
      cwd: process.cwd(),
      tool_input: background ? { command, run_in_background: true } : { command },
    }),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput.permissionDecisionReason : null;
}

function assertDenied(command: string, reason: RegExp, options = {}) {
  const decision = decide(command, options);
  assert.ok(decision, `expected deny for: ${command}`);
  assert.match(decision, reason, command);
}

function assertAllowed(command: string, options = {}) {
  assert.equal(decide(command, options), null, `expected allow for: ${command}`);
}

const BT = '`';

// 2026-10-26: a backlog description in double quotes ran a production `docker logs` that had just
// been denied. 2026-11-06: an unquoted heredoc ran `nx run-many -t build`.
test('denies a backtick that zsh would run: inside double quotes and in an unquoted heredoc', () => {
  const quotes = /inside double quotes zsh runs each/;
  const heredoc = /in an unquoted heredoc/;
  assertDenied(`agent-backlog add -d "run ${BT}npx nx lint x${BT} first"`, quotes);
  assertDenied(`x="a $(echo "${BT}b${BT}")"`, quotes);
  assertDenied(`cat > f <<EOF\nrun ${BT}ls${BT}\nEOF`, heredoc);
  assertDenied(`cat <<-EOF\n\t${BT}x${BT}\n\tEOF`, heredoc);
  assertDenied(`agent-backlog add -d "run ${BT}ls${BT}"`, quotes, { tool: 'Monitor' });
  assertDenied(`cat <<-'EOF'\n\tx\n\tEOF\necho "${BT}ls${BT}"`, quotes);
});

test('allows a backtick that stays text: single quotes, escapes and a quoted heredoc', () => {
  assertAllowed(`agent-backlog add -d "$(cat <<'EOF'\nrun ${BT}npx nx lint x${BT} first, don't\nEOF\n)"`);
  assertAllowed(`echo "a \\${BT}b\\${BT} c"`);
  assertAllowed(`echo 'a ${BT}b${BT}'`);
  assertAllowed(`cat > f <<'EOF'\n${BT}ls${BT}\nEOF`);
  assertAllowed(`cat > f <<\\EOF\n${BT}ls${BT}\nEOF`);
  assertAllowed(`cat > f <<"EOF"\n${BT}ls${BT}\nEOF`);
  assertAllowed(`cat <<EOF\nrun \\${BT}ls\\${BT}\nEOF`);
});

// 2026-11-07/08: two foreground watchers that the harness moved to the background held each other
// for 28 hours. The tool and the background flag do not matter, so neither limits the check.
test('denies a loop that waits on a pgrep -f pattern matching its own text, in any tool', () => {
  const watcher = /waits on a `pgrep -f` pattern that matches its own text/;
  assertDenied('until ! pgrep -f "nx run a:test" >/dev/null; do sleep 5; done', watcher);
  assertDenied('while pgrep -f "nx run a:test"; do sleep 5; done', watcher, { background: true });
  assertDenied('until ! pgrep -f "nx run a:test"; do sleep 5; done', watcher, { tool: 'Monitor' });
  assertDenied('P="nx run a"; until ! pgrep -f "$P"; do sleep 5; done', watcher);
  assertDenied('until ! pgrep -u me -f "nx run a"; do sleep 5; done', watcher);
});

test('allows the watchers that cannot hold each other: a bracket, a PID, an exact name, one check', () => {
  assertAllowed(`until ! pgrep -f '[n]x run a:test'; do sleep 5; done`);
  assertAllowed('while kill -0 123 2>/dev/null; do sleep 5; done');
  assertAllowed('while pgrep -x node; do sleep 5; done');
  assertAllowed('pgrep -fl "nx run a:test"');
  assertAllowed(`cat <<'EOF'\nuntil ! pgrep -f "nx run a"; do sleep 5; done\nEOF`);
  assertAllowed('until ! pgrep -f "$UNSET"; do sleep 5; done');
  assertAllowed('for p in $(pgrep -f x); do echo $p; done');
  assertAllowed('for i in 1 2 3; do pgrep -f "nx run a" > /dev/null; sleep 1; done');
  assertAllowed('until ! pgrep -f "a(b"; do sleep 5; done');
});

test('denies a later && step that depends on a piped test or build', () => {
  const gated = /a pipe after a test or build hides its exit status/;
  assertDenied('nx run a:test 2>&1 | tail -3 && git push', gated);
  assertDenied('nx sync:check | tail -1 && git commit -m x -- a', gated);
  assertDenied('caffeinate -dimsu NX_DAEMON=false npx nx run a:test | tail -1 && next', gated);
  assertDenied('nx run a:build | grep -E "error|fail" | head -3 && node --test x', gated);
  assertDenied('node --test x.mjs | tail && next', gated);
  assertDenied('timeout 60 nx run a:t | tail && next', gated);
  assertDenied('gtimeout -s KILL 120 nx run a:t | tail && next', gated);
  assertDenied('nx run a:t |\n tail -1 && git push', gated);
  assertDenied("# don't\nnx run a:t | tail -1 && git push", gated);
  assertDenied('nx run a:t \\\n | tail -1 && git push', gated);
});

// A foreground pipe in last position is about 334 uses a day, and the failure text reaches the agent.
test('allows a pipe nothing depends on, and a filter that is itself the gate', () => {
  assertAllowed('nx run a:test 2>&1 | tail -40');
  assertAllowed('nx run a:test | tail -40; echo finished');
  assertAllowed('set -o pipefail; nx run a:test | tail -1 && next');
  assertAllowed(`nx sync:check 2>&1 | grep -q 'up to date' && git commit -m x -- a`);
  assertAllowed('nx run a:test | grep Successfully && next');
  assertAllowed('nx run a:test > log 2>&1 && next');
  assertAllowed('ls | wc -l && echo done');
  assertAllowed('nx run a:t | tail -1; test ${pipestatus[1]} = 0 && git push');
  assertAllowed('nx run a:t | tail -1 && test ${pipestatus[1]} = 0 && git push');
  assertAllowed('nx run a:test --help | head && next');
  assertAllowed('nx run a:t | grep -q error && next');
  assertAllowed('# nx run a:t | tail && x\nls');
});

test('denies a piped gh run watch --exit-status, whose only output is its exit code', () => {
  assertDenied('gh run watch 1 --exit-status | tail', /`--exit-status` exists only for its exit code/);
  assertAllowed('gh run watch 1 --exit-status');
  assertAllowed('gh run watch 1 | tail');
  assertAllowed('gh run watch 1 --exit-status | tail; gh run view 1 --json conclusion');
});

// 2026-10-26: the push failed, `| tail` hid it and `echo pushed` printed anyway.
test('denies a later change or success claim that depends on a piped git change', () => {
  const gated = /the pipe hides the exit status of `git /;
  assertDenied('git push origin main | tail -1 && echo pushed', gated);
  assertDenied('git pull | tail -3 && git push origin main', gated);
  assertDenied('git merge x | tail -1 && git push', gated);
  assertDenied('git rebase main | tail -1 && git push', gated);
  assertDenied('git push | tail && git log | head && echo pushed', gated);
  assertDenied('git push | tail && npm publish', gated);
  assertDenied('git push | tail && agent-backlog done 1', gated);
  assertDenied('git push | tail && echo landed', gated);
  assertDenied('npm publish | tail && echo done', /the pipe hides the exit status of `npm publish`/);
  assertDenied('gcloud run deploy x | tail && echo deployed', /the pipe hides the exit status of `gcloud`/);
  assertAllowed('git push origin main | tail -1 && git log -1');
  assertAllowed('set -o pipefail; git push | tail -1 && echo pushed');
  assertAllowed('git push && echo pushed');
  assertAllowed('git push --dry-run | tail && echo ok');
  assertAllowed('git push -n | tail && echo ok');
  assertAllowed('git push | tail && test ${pipestatus[1]} = 0 && echo pushed');
});

test('leaves a piped git commit before && to the reason of the git guard', () => {
  assertDenied('git commit -m x -- a.ts | tail -1 && echo done', /A pipe after git commit hides its exit status/);
});

// 2026-11-03: dependents landed before their base, and history cannot be reordered.
test('denies a commit chained with ; into another change', () => {
  const chained = /a commit can be refused, and `;` runs the next step anyway/;
  assertDenied('git commit -m a -- a | tail -1; git commit -m b -- b', chained);
  assertDenied('git commit -m a -- a; git push', chained);
  assertDenied('git commit -m a -- a; npm publish', chained);
  assertDenied('git commit -m a -- a; agent-backlog done 1', chained);
  assertDenied('echo m | git push; git commit -m a -- a', chained);
  assertAllowed('git commit -m a -- a | tail -1; git log -1');
  assertAllowed('git commit -m a -- a && git commit -m b -- b');
  assertAllowed('git push --dry-run; git commit -m x -- a');
});

// 2026-11-08: a commit ran after a forced typecheck exited 1.
test('denies a commit that a verification only precedes with ;', () => {
  const unguarded = /a verification followed by `;` does not stop the commit/;
  assertDenied('nx run-many -t typecheck --args=--force; git commit -m x -- a', unguarded);
  assertDenied('nx run a:test > f 2>&1; echo $?; git commit -m x -- a', unguarded);
  assertDenied('tsc --noEmit; git commit -m x -- a', unguarded);
  assertDenied('eslint .; git commit -m x -- a', unguarded);
  assertDenied('prettier --check .; git commit -m x -- a', unguarded);
  assertDenied('npm test; git commit -m x -- a', unguarded);
  assertDenied('npm run lint; git commit -m x -- a', unguarded);
  assertDenied('(sleep 1) &\ntsc --noEmit; git commit -m x -- a', unguarded);
  assertAllowed('nx run a:t && git commit -m x -- a');
  assertAllowed('prettier --write a; git commit -m x -- a');
  assertAllowed('(nx run a:t > l 2>&1) &\ngit commit -m x -- a');
  assertAllowed('nx run a:t > l 2>&1 &\necho started\ngit commit -m x -- a');
  assertAllowed('(nx run a:t > l 2>&1; echo "exit $?" >> l) >/dev/null 2>&1 &\ngit commit -m x -- a');
});

// Whether a background failure stays visible depends on what the output prints, so no text check
// can tell: a blind judge called 29 of 30 hits of such a check good, and it was removed.
test('leaves a background run to the agent, whatever it does with the exit code', () => {
  const background = { background: true };
  assertAllowed('nx run a:e2e > log 2>&1; echo "e2e exit: $?"', background);
  assertAllowed('cargo check | tail -40', background);
  assertAllowed('nx run a:t > l 2>&1; grep -E "fail|pass" l | head', background);
});

test('denies $? read straight after a pipe, and allows the forms that read the run', () => {
  const filter = /`\$\?` here is the status of the last filter/;
  assertDenied('npx nx run a:t 2>&1 | tail -3; echo $?', filter);
  assertDenied('git push | tail -1; echo "push exit $?"', filter);
  assertAllowed('npx nx run a:t > f 2>&1; echo $?');
  assertAllowed('npx nx run a:t | tail -3; echo ${pipestatus[1]}');
  assertAllowed('nx run a:t | tail -1; echo $(echo $?)');
  assertAllowed('set -o pipefail; nx run a:t | tail; echo $?');
});

test('denies PIPESTATUS where zsh expands it, and allows it where bash does', () => {
  const bashOnly = /PIPESTATUS is bash; in zsh it is always empty/;
  assertDenied('a | b; echo "exit=${PIPESTATUS[0]}"', bashOnly);
  assertDenied('echo $PIPESTATUS', bashOnly);
  assertDenied('bash -c "echo ${PIPESTATUS[0]}"', bashOnly);
  assertDenied('cat > f.sh <<EOF\necho ${PIPESTATUS[0]}\nEOF', bashOnly);
  assertAllowed(`bash -c 'a | b; echo \${PIPESTATUS[0]}'`);
  assertAllowed(`cat > f.sh <<'EOF'\necho \${PIPESTATUS[0]}\nEOF`);
  assertAllowed('echo $pipestatus[1]');
  assertAllowed('grep PIPESTATUS file');
});

test('denies BSD sed -i with no suffix argument, and allows it with one or on another host', () => {
  const suffix = /sed here is BSD, and -i takes the next word as the backup suffix/;
  assertDenied(`sed -i 's/a/b/' f`, suffix);
  assertDenied(`sed -Ei 's/a/b/' f`, suffix);
  assertDenied(`sed -i -e 's/a/b/' f`, suffix);
  assertDenied(`sed -i'' 's/a/b/' f`, suffix);
  assertDenied(`find . -name x -exec sed -i 's/a/b/' {} +`, suffix);
  assertDenied(`x=$(sed -i 's|a)|b|' f)`, suffix);
  assertDenied(`sed --in-place 's/a/b/' f`, suffix);
  assertDenied(`sed -e p -i 's/a/b/' f`, suffix);
  assertAllowed(`sed -i '' 's/a/b/' f`);
  assertAllowed(`sed -i.bak 's/a/b/' f`);
  assertAllowed(`sed -i .bak 's/a/b/' f`);
  assertAllowed(`ssh host "sed -i 's/a/b/' f"`);
  assertAllowed(`ssh host sed -i 's/a/b/' f`);
  assertAllowed(`sed -n 's/-i/x/p' f`);
  assertAllowed(`sed -e 's/-i/x/' f`);
  assertAllowed(`sed -i "$SFX" 's/a/b/' dir/f`);
  assertAllowed(`find . -name sed -i 's/a/b/'`);
});

test('denies a kill that picks targets by a pattern, and allows one that names them', () => {
  const pattern = /this kill picks targets by a pattern/;
  assertDenied('kill $(pgrep -f "node --test")', pattern);
  assertDenied('P=$(pgrep -f "node --test"); kill $P', pattern);
  assertDenied('for p in $(pgrep -f x); do kill $p; done', pattern);
  assertDenied('pgrep -f x | while read p; do kill $p; done', pattern);
  assertDenied('pgrep -f x | xargs kill', pattern);
  assertDenied('kill $(ps aux | grep node | cut -c1-5)', pattern);
  assertAllowed('kill 123 456');
  assertAllowed('kill -0 $(pgrep -f x)');
  assertAllowed('kill $(pgrep -P 123)');
  assertAllowed('kill $(lsof -tiTCP:3000 -sTCP:LISTEN)');
  assertAllowed('echo 123 456 | xargs kill');
  assertAllowed('kill -9 123; sleep 1; ps -p 123');
  assertAllowed('kill -s 0 $(pgrep -f x)');
  assertAllowed('pgrep -f x | xargs kill -0');
  assertAllowed(`kill $(pgrep -f 'node$')`);
  assertAllowed('kill $(ps -p 123 | grep node | cut -c1-5)');
});

test('denies a bare glob qualifier, and allows it once the option is on', () => {
  const bare = /is not a glob qualifier/;
  assertDenied('ls dir/*(N)', bare);
  assertDenied('for f in dir/*.ts(N); do echo $f; done', bare);
  assertDenied('ls -t *(om[1])', bare);
  assertDenied('ls d/*(#qN)', /needs extendedglob/);
  assertAllowed('setopt bareglobqual; ls dir/*(N)');
  assertAllowed('setopt extendedglob; ls d/*(#qN)');
  assertAllowed(`ls 'dir/*(N)'`);
  assertAllowed('a=(b c)');
  assertAllowed('f() { ls; }');
  assertAllowed('emulate zsh; ls dir/*(N)');
  assertAllowed('unsetopt nobareglobqual; ls dir/*(N)');
  assertAllowed('ls dir/*(N)x');
  assertAllowed('a=dir/*(N)');
  assertAllowed('echo a*(b)');
  assertAllowed(`ls *'x'(N)`);
});

test('leaves Monitor pipelines alone, because a Monitor streams through a filter by design', () => {
  const monitor = { tool: 'Monitor' };
  assertDenied(`echo "${BT}ls${BT}"`, /inside double quotes zsh runs each/, monitor);
  assertAllowed('nx run a:test 2>&1 | tail -3 && next', monitor);
  assertAllowed('git push | tail -1 && echo pushed', monitor);
  assertAllowed('nx run a:t | tail; echo $?', monitor);
  assertAllowed('nx run a:e2e > log; echo $?', { tool: 'Monitor', background: true });
});

test('leaves other tools alone', () => {
  assertAllowed('until ! pgrep -f "nx run a"; do sleep 5; done', { tool: 'Read' });
});

// A copy of the real entry beside a file that is broken on purpose. HOME is the child's input, so
// the error goes to a log this test can read and the real log stays clean.
function withBrokenFile(file: string, source: string | null, run: (decide: (command: string) => { status: number | null; denied: boolean }, log: () => string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'broken-hook-'));
  try {
    const home = join(dir, 'home');
    mkdirSync(join(home, '.claude/hooks'), { recursive: true });
    for (const name of ['block-git-mutation.ts', 'shell-lex.ts', 'shell-traps.ts']) {
      if (name !== file) copyFileSync(join(dirname(SCRIPT), name), join(dir, name));
    }
    if (source !== null) writeFileSync(join(dir, file), source);
    const decide = (command: string) => {
      const result = spawnSync('node', [join(dir, 'block-git-mutation.ts')], {
        input: JSON.stringify({ tool_name: 'Bash', cwd: dir, tool_input: { command } }),
        encoding: 'utf8',
        env: { ...process.env, HOME: home },
      });
      return { status: result.status, denied: result.stdout.includes('"deny"') };
    };
    run(decide, () => readFileSync(join(home, '.claude/hooks/block-git-mutation.log'), 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const BROKEN_CHECKS: [string, string | null][] = [
  ['throws when called', "export function shellTrap() { throw new Error('boom'); }\n"],
  ['has a syntax error', 'export function shellTrap( {\n'],
  ['throws while loading', "throw new Error('boom');\nexport function shellTrap() { return null; }\n"],
  ['is missing', null],
];

for (const [name, source] of BROKEN_CHECKS) {
  test(`keeps the git guard, runs a good command and logs it when shell-traps.ts ${name}`, () => {
    withBrokenFile('shell-traps.ts', source, (decide, log) => {
      assert.deepEqual(decide('git reset --hard'), { status: 0, denied: true });
      assert.deepEqual(decide('ls'), { status: 0, denied: false });
      assert.match(log(), /stage=shell-traps/);
    });
  });
}

for (const [name, source] of [['has a syntax error', 'export function tokenizeSegment( {\n'], ['is missing', null]] as [string, string | null][]) {
  test(`blocks every command and logs it when shell-lex.ts ${name}, because the guard cannot read them`, () => {
    withBrokenFile('shell-lex.ts', source, (decide, log) => {
      assert.deepEqual(decide('git reset --hard'), { status: 2, denied: false });
      assert.deepEqual(decide('ls'), { status: 2, denied: false });
      assert.match(log(), /stage=shell-lex/);
    });
  });
}

test('leaves = words to the shell, which reads them as text', () => {
  assertAllowed('echo ====');
  assertAllowed('echo "--- a" && echo ======== && ls');
  assertAllowed('[ "$a" == "b" ] && echo same');
  assertAllowed('echo =ls');
});

// The checks above assume this file. It runs before each Bash and Monitor command, so a broken edit
// would bring back the traps that have no check, in every new session.
test('the real agent shell splits a list and keeps unmatched globs and = words as text', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agent-shell-'));
  try {
    const script = [
      `source ${new URL('./agent-shell.zsh', import.meta.url).pathname}`,
      'setopt NO_EXTENDED_GLOB NO_BARE_GLOB_QUAL',
      'F="a b"; print -rl -- $F | wc -l | tr -d " "',
      'print -r -- zz*.none',
      'echo =====',
      'echo =ls',
      '[ a == a ] && echo equal',
      'echo reached-the-end',
    ].join('\n');
    const result = spawnSync('zsh', ['-c', script], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.stderr, '');
    assert.equal(result.stdout, ['2', 'zz*.none', '=====', '=ls', 'equal', 'reached-the-end', ''].join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
