import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import { TemporaryFiles } from '@zukhruf/fs';

// GIT_GUARD_SCRIPT lets the suite run against a scratch copy before the real hook is replaced.
const SCRIPT =
  process.env.GIT_GUARD_SCRIPT ?? new URL('./block-git-mutation.ts', import.meta.url).pathname;

function decide(command: string, { tool = 'Bash', background = false, cwd = process.cwd() } = {}): string | null {
  const result = spawnSync('node', [SCRIPT], {
    input: JSON.stringify({
      tool_name: tool,
      cwd,
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

// Ezz asked four times that an agent never wait on a zukhruf release (memory no-waiting-on-releases),
// and agents kept arming these loops on npm.
test('denies a loop or watch that polls npm for a zukhruf release, in any tool', () => {
  const wait = /this polls npm for a zukhruf release/;
  assertDenied('until v=$(npm view @zukhruf/eslint version 2>/dev/null) && [ "$v" != "0.8.43" ]; do sleep 60; done', wait);
  assertDenied('deadline=$((SECONDS+1800)); until [ "$(npm view @zukhruf/shadcn version)" = 0.8.44 ] || [ $SECONDS -gt $deadline ]; do sleep 30; done', wait);
  assertDenied('while true; do npm view @zukhruf/nx version; sleep 60; done', wait);
  assertDenied('watch -n 60 npm view @zukhruf/eslint version', wait);
  assertDenied(`watch -n 60 'npm view @zukhruf/eslint version'`, wait);
  assertDenied('until npm info --json @zukhruf/fs@0.8.23 >/dev/null 2>&1; do sleep 60; done', wait);
  assertDenied('while ! npm v "@zukhruf/fs@>=0.8.23" version | grep -q .; do sleep 60; done', wait);
  assertDenied('for i in $(seq 30); do npm show @zukhruf/nx dist-tags.latest && break; sleep 60; done', wait);
  assertDenied('P=@zukhruf/eslint; until npm view $P version | grep -q 0.8.44; do sleep 60; done', wait);
  assertDenied('until npm view @zukhruf/eslint version | grep -q 0.8.44; do sleep 60; done', wait, { tool: 'Monitor' });
});

test('allows a single registry read, a loop over another package, and a loop that never calls npm', () => {
  assertAllowed('npm view @zukhruf/eslint version');
  assertAllowed('npm view @zukhruf/eslint versions --json');
  assertAllowed('until npm view react version; do sleep 60; done');
  assertAllowed('for f in packages/*/package.json; do jq -r .name $f; done');
  assertAllowed('for p in eslint shadcn nx; do npm view @zukhruf/$p version; done');
  assertAllowed('npm view @zukhruf/eslint versions --json | while read -r v; do echo $v; done');
  assertAllowed('until npm install @zukhruf/eslint; do sleep 5; done');
  assertAllowed(`cat <<'EOF'\nuntil npm view @zukhruf/eslint version; do sleep 60; done\nEOF`);
  assertAllowed(`echo 'until npm view @zukhruf/eslint version; do sleep 60; done'`);
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

// Ezz, 2026-11-02: "Always npm install". 2026-11-14: `ln -s ../../packages/pipes
// node_modules/@zukhruf/pipes` in a checkout, one of 23 such links in past commands.
test('denies a symbolic link that ln makes in the node_modules of a checkout, in each form ln takes', () => {
  const cwd = '/Users/me/code/mutex';
  const command = 'ln -s ../../packages/pipes node_modules/@zukhruf/pipes';
  assert.equal(
    decide(command, { cwd }),
    `Blocked: this ${BT}ln -s${BT} makes a link by hand in /Users/me/code/mutex/node_modules/@zukhruf; npm never records it and the next ${BT}npm install${BT} deletes it. Run ${BT}npm install${BT} at the repo root for this repo's own workspaces, and ${BT}npm rebuild <pkg>${BT} for a ${BT}.bin${BT} link. For another checkout's package, push the package (a push to its main releases it), then ${BT}npm install${BT} the published version (${BT}npm view <pkg> version${BT} shows when npm has it). Links in a scratch folder are allowed. Command: ${command}`,
  );
  const scoped = /makes a link by hand in \/Users\/me\/code\/mutex\/node_modules\/@z; /;
  const top = /makes a link by hand in \/Users\/me\/code\/mutex\/node_modules; /;
  assertDenied('ln --symbolic ../p node_modules/@z/p', scoped, { cwd });
  assertDenied('ln -sfn ../p node_modules/@z/p', scoped, { cwd });
  assertDenied('ln -f -s ../p node_modules/@z/p', scoped, { cwd });
  assertDenied('ln -s -t node_modules/@z ../../packages/p', scoped, { cwd });
  assertDenied('ln -st node_modules/@z ../../packages/p', scoped, { cwd });
  assertDenied('ln -s --target-directory=node_modules/@z ../p', scoped, { cwd });
  assertDenied('ln -s --target-directory node_modules/@z ../p', scoped, { cwd });
  assertDenied('ln -s ../a ../b node_modules/@z', scoped, { cwd });
  assertDenied('ln -s ../p node_modules/', top, { cwd });
  assertDenied('ln -s -S .bak ../p node_modules/p', top, { cwd });
  assertDenied('ln -s --suffix .bak ../p node_modules/p', top, { cwd });
  assertDenied('ln -sf ../p node_modules/p 2>/dev/null || true', top, { cwd });
  assertDenied('sudo ln -s ../p /Users/me/code/app/node_modules/p', /makes a link by hand in \/Users\/me\/code\/app\/node_modules; /, { cwd });
  assertDenied(`ln -s ../p '/Users/me/code/app/node_modules/p'`, /makes a link by hand in \/Users\/me\/code\/app\/node_modules; /, { cwd });
  assertDenied('ln -s ../p /Users/me/code/my\\ app/node_modules/p', /makes a link by hand in \/Users\/me\/code\/my app\/node_modules; /, { cwd });
  assertDenied('ln -s ../p node_modules/@z/p', scoped, { cwd, tool: 'Monitor' });
});

// A judge of 33 real refusals, 2026-11-16: about half linked the repo's own workspace
// package, which a plain `npm install` at the repo root links.
test('the refusal of a node_modules link names npm install at the repo root, the release route for another checkout and the scratch exemption', () => {
  const cwd = '/Users/me/code/mutex';
  const command = 'ln -s ../../packages/pipes node_modules/@zukhruf/pipes';
  assertDenied(command, new RegExp(`${BT}npm install${BT} at the repo root for this repo's own workspaces,`), { cwd });
  assertDenied(command, /For another checkout's package, push the package \(a push to its main releases it\)/, { cwd });
  const decision = decide(command, { cwd });
  assert.ok(decision);
  assert.doesNotMatch(decision, /npm link|file:|overrides/);
  assertDenied(command, /Links in a scratch folder are allowed\./, { cwd });
});

test('denies a link that an earlier cd, a variable, ~, $HOME or $PWD puts in the node_modules of a checkout', () => {
  const cwd = '/Users/me/code/mutex';
  const scratch = '/private/tmp/x';
  const app = /makes a link by hand in \/Users\/me\/code\/app\/node_modules; /;
  const home = new RegExp(`makes a link by hand in ${RegExp.escape(homedir())}/code/app/node_modules; `);
  assertDenied('cd packages/x && ln -s ../../../packages/pipes node_modules/@zukhruf/pipes', /makes a link by hand in \/Users\/me\/code\/mutex\/packages\/x\/node_modules\/@zukhruf; /, { cwd });
  assertDenied('cd /Users/me/code/app; ln -s ../p node_modules/p', app, { cwd });
  assertDenied('cd /Users/me/code/app && ln -s ../p node_modules/p', app, { cwd: scratch });
  assertDenied('cd /private/tmp/x && cd /Users/me/code/app && ln -s ../p node_modules/p', app, { cwd });
  assertDenied('cd /Users/me/code && cd app && ln -s ../p node_modules/p', app, { cwd: scratch });
  assertDenied('cd /Users/me/code && cd -P app && ln -s ../p node_modules/p', app, { cwd: scratch });
  assertDenied('cd node_modules && ln -s ../p p', /makes a link by hand in \/Users\/me\/code\/mutex\/node_modules; /, { cwd });
  assertDenied('cd && ln -s ../p code/app/node_modules/p', home, { cwd: scratch });
  assertDenied('D=/Users/me/code/app/node_modules; ln -s ../p $D/p', app, { cwd });
  assertDenied('cd /Users/me/code/app && D="$PWD/node_modules" && ln -s ../p "$D/p"', app, { cwd: scratch });
  assertDenied('cd /Users/me/code/app && ln -s ../p $PWD/node_modules/p', app, { cwd: scratch });
  assertDenied('ln -s ../p ~/code/app/node_modules/p', home, { cwd });
  assertDenied('ln -s ../p $HOME/code/app/node_modules/p', home, { cwd });
  assertDenied('ln -s ../p "${HOME}/code/app/node_modules/p"', home, { cwd });
  // A cd in a subshell or a $( ) does not move the commands after it.
  assertDenied('(cd /private/tmp/x && ls); ln -s ../p node_modules/p', /makes a link by hand in \/Users\/me\/code\/mutex\/node_modules; /, { cwd });
  assertDenied('X=$(cd /private/tmp/x && pwd); ln -s ../p node_modules/p', /makes a link by hand in \/Users\/me\/code\/mutex\/node_modules; /, { cwd });
});

test('allows a link in the node_modules of a scratch folder', () => {
  const cwd = '/Users/me/code/mutex';
  assertAllowed('ln -sfn /Users/me/code/mutex/node_modules /private/tmp/x/node_modules', { cwd });
  assertAllowed('ln -s ../p /private/tmp/x/node_modules/p', { cwd });
  assertAllowed('ln -s ../p /tmp/x/node_modules/p', { cwd });
  assertAllowed('ln -s ../p /var/folders/ab/T/x/node_modules/p', { cwd });
  assertAllowed('ln -s ../p ~/.claude/scratch/x/node_modules/p', { cwd });
  assertAllowed('ln -s ../p /Users/me/s/scratchpad/c/node_modules/p', { cwd });
  assertAllowed('ln -s ../p node_modules/p', { cwd: '/private/tmp/x' });
  assertAllowed('cd /private/tmp/x && ln -s ../p node_modules/p', { cwd });
  assertAllowed('(cd /private/tmp/x && ln -s ../p node_modules/p)', { cwd });
});

// Ezz, 2026-11-22: agents stop consuming an unreleased package through npm link or a
// path to another checkout; they push the package, and the push releases it.
const UNRELEASED = `Blocked: this consumes an unreleased package from another checkout (${BT}npm link <pkg>${BT}, or ${BT}npm install${BT} of a path outside this repo). Instead, push the package (a push to its main releases it), then ${BT}npm install${BT} the published version (${BT}npm view <pkg> version${BT} shows when npm has it).`;

test('denies npm link of a package or a path, in each form npm and the shell take', () => {
  const cwd = '/Users/me/code/mutex';
  assert.equal(decide('npm link @zukhruf/nx', { cwd }), `${UNRELEASED} Command: npm link @zukhruf/nx`);
  const unreleased = new RegExp(RegExp.escape(UNRELEASED));
  assertDenied('npm link ../mutex/packages/nx', unreleased, { cwd });
  assertDenied('npm ln @zukhruf/nx', unreleased, { cwd });
  assertDenied('npm link -w x @a/b', unreleased, { cwd });
  assertDenied('npm link --workspace x @a/b', unreleased, { cwd });
  assertDenied('npm link --workspace=x @a/b', unreleased, { cwd });
  assertDenied('cd ~/x && npm link @a/b', unreleased, { cwd });
  assertDenied('npm --prefix packages/x link @a/b', unreleased, { cwd });
  assertDenied('npm -C packages/x link @a/b', unreleased, { cwd });
  assertDenied('npm link --save @a/b @c/d', unreleased, { cwd });
  assertDenied('sudo npm link @a/b', unreleased, { cwd });
  assertDenied('npm link @a/b', unreleased, { cwd, tool: 'Monitor' });
});

test('allows a bare npm link, which registers the current package globally, and npm unlink', () => {
  const cwd = '/Users/me/code/mutex';
  assertAllowed('npm link', { cwd });
  assertAllowed('npm link -w x', { cwd });
  assertAllowed('npm link --workspace x', { cwd });
  assertAllowed('cd ~/code/agent-backlog && npm link', { cwd });
  assertAllowed('npm unlink @a/b', { cwd });
  assertAllowed('npm unlink', { cwd });
  assertAllowed('echo "npm link @a/b"', { cwd });
  assertAllowed(`cat <<'EOF'\nnpm link @a/b\nEOF`, { cwd });
});

test('denies npm install of a path outside the repo the command runs in', () => {
  using folder = new TemporaryFiles().directorySync('checkout-');
  const cwd = folder.path;
  mkdirSync(join(cwd, '.git'));
  const unreleased = new RegExp(RegExp.escape(UNRELEASED));
  assertDenied('npm i ../other/pkg', unreleased, { cwd });
  assertDenied('npm install ../other/pkg', unreleased, { cwd });
  assertDenied('npm add /Users/me/code/other', unreleased, { cwd });
  assertDenied('npm i ~/code/other', unreleased, { cwd });
  assertDenied('npm i file:../other', unreleased, { cwd });
  assertDenied('npm i -D ../other', unreleased, { cwd });
  assertDenied('npm i -w packages/a ../other', unreleased, { cwd });
  assertDenied('npm i @zukhruf/nx ../other', unreleased, { cwd });
  assertDenied('npm i ./packages/../../other', unreleased, { cwd });
  assertDenied('cd packages/a && npm i ../../../other', unreleased, { cwd });
  assertDenied('npm i ../../../../other', unreleased, { cwd: join(cwd, 'packages/a/src') });
  assertDenied('npm --prefix packages/a i ../other', unreleased, { cwd });
});

test('allows npm install of a published version, a path inside the repo, a global install, and any path outside a repo', () => {
  using folder = new TemporaryFiles().directorySync('checkout-');
  const cwd = folder.path;
  mkdirSync(join(cwd, '.git'));
  assertAllowed('npm i @zukhruf/nx@0.8.67', { cwd });
  assertAllowed('npm i ./packages/local-workspace', { cwd });
  assertAllowed('npm i file:./packages/local-workspace', { cwd });
  assertAllowed('npm i ../b', { cwd: join(cwd, 'packages/a') });
  assertAllowed('cd packages/a && npm i ../b', { cwd });
  assertAllowed('npm i -w ../other @zukhruf/nx', { cwd });
  assertAllowed('npm i -g ../other', { cwd });
  assertAllowed('npm i', { cwd });
  assertAllowed('npm ci', { cwd });
  using outside = new TemporaryFiles().directorySync('no-repo-');
  assertAllowed('npm i ../other', { cwd: outside.path });
});

test('allows links outside node_modules, and text that only names ln', () => {
  const cwd = '/Users/me/code/mutex';
  assertAllowed('ln -s ../a b', { cwd });
  assertAllowed('ln -s ../../node_modules/.bin/x bin/x', { cwd });
  assertAllowed('ln -s ../p node_modules/../p', { cwd });
  assertAllowed('ln ../p node_modules/p', { cwd });
  assertAllowed('echo "ln -s a node_modules/b"', { cwd });
  assertAllowed(`grep -rn 'ln -s' node_modules`, { cwd });
  assertAllowed(`cat <<'EOF'\nln -s a node_modules/b\nEOF`, { cwd });
  assertAllowed('# ln -s a node_modules/b\nls', { cwd });
});

test('allows a link whose destination the command text does not hold', () => {
  const cwd = '/Users/me/code/mutex';
  assertAllowed('ln -s ../p "$(pwd)/node_modules/p"', { cwd });
  assertAllowed(`ln -s ../p node_modules/${BT}echo x${BT}`, { cwd });
  assertAllowed(`D=${BT}pwd${BT}; ln -s ../p $D/node_modules/p`, { cwd });
  assertAllowed(`cd ${BT}echo /private/tmp/x${BT} && ln -s ../p node_modules/p`, { cwd });
  assertAllowed('ln -s ../p $DEST/node_modules/p', { cwd });
  assertAllowed('D=$(pwd); ln -s ../p $D/node_modules/p', { cwd });
  assertAllowed('for p in a b; do ln -s ../$p node_modules/$p; done', { cwd });
  assertAllowed('cd $X && ln -s ../p node_modules/p', { cwd });
  assertAllowed('cd - && ln -s ../p node_modules/p', { cwd });
  assertAllowed('ln -s ../p ~other/node_modules/p', { cwd });
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
  using folder = new TemporaryFiles().directorySync('broken-hook-');
  const dir = folder.path;
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
  using folder = new TemporaryFiles().directorySync('agent-shell-');
  const dir = folder.path;
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
});
