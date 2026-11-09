import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// GIT_GUARD_SCRIPT lets the suite run against a scratch copy before the real hook is replaced.
const SCRIPT =
  process.env.GIT_GUARD_SCRIPT ?? new URL('./block-git-mutation.ts', import.meta.url).pathname;

// Claude Code sends the session's working directory as `cwd` with every call.
function runHook(command: string, cwd = process.cwd()) {
  const result = spawnSync('node', [SCRIPT], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd }),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout ? JSON.parse(result.stdout) : null;
}

function assertBlocked(command: string, subcommand: string, reason?: RegExp) {
  const output = runHook(command);
  assert.equal(
    output?.hookSpecificOutput?.permissionDecision,
    'deny',
    `expected deny for: ${command}`,
  );
  assert.equal(output.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.match(
    output.hookSpecificOutput.permissionDecisionReason,
    new RegExp(`Blocked git ${subcommand}\\b`),
  );
  if (reason) assert.match(output.hookSpecificOutput.permissionDecisionReason, reason, command);
}

const WHOLE_INDEX = /A commit without paths, or with -a or -i/;
const SHARED_INDEX = /Every session in a checkout shares \.git\/index/;
const LOCAL_CLONE = /AGENTS\.md forbids a clone/;
const GUARD = /User guardrail: agents may inspect git state/;

function assertAllowed(command: string) {
  assert.equal(runHook(command), null, `expected allow for: ${command}`);
}

test('checks a Monitor command as it checks a Bash command, and leaves other tools alone', () => {
  const decide = (tool_name: string, tool_input: object) => {
    const result = spawnSync('node', [SCRIPT], {
      input: JSON.stringify({ tool_name, tool_input, cwd: process.cwd() }),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput : undefined;
  };
  const monitor = (command: string) => decide('Monitor', { description: 'deploy', timeout_ms: 300000, command });
  assert.match(monitor('git reset --hard')?.permissionDecisionReason ?? '', /Blocked git reset/);
  assert.match(monitor('while true; do status=$(curl -s x); sleep 30; done')?.permissionDecisionReason ?? '', /zsh keeps `status`/);
  assert.equal(monitor('while kill -0 123 2>/dev/null; do sleep 5; done; echo done'), undefined);
  assert.equal(decide('Read', { file_path: '/tmp/git reset --hard' }), undefined);
});

test('blocks git commit --amend, which rewrites the last commit', () => {
  assertBlocked('git commit --amend --no-edit', 'commit');
});

test('blocks git commit --amend inside a compound command', () => {
  assertBlocked('cd x && git commit --amend', 'commit');
});

test('allows a commit that names its paths', () => {
  assertAllowed('git commit -m x -- a.ts');
  assertAllowed('git commit -m x a.ts b.ts');
  assertAllowed('git commit --only -- a.txt');
  assertAllowed('git commit -m x --pathspec-from-file=paths.txt');
  assertAllowed('git -C ~/repo commit -q -F msg.txt -- src');
});

test('blocks a commit that takes the whole shared index', () => {
  assertBlocked('git commit -m x', 'commit', WHOLE_INDEX);
  assertBlocked('git commit -q -F msg.txt', 'commit', WHOLE_INDEX);
  assertBlocked('git commit -am x', 'commit', WHOLE_INDEX);
  assertBlocked('git commit --all -m x', 'commit', WHOLE_INDEX);
  assertBlocked('git commit -a -m x -- a.ts', 'commit', WHOLE_INDEX);
  assertBlocked('git commit -qam x -- a.ts', 'commit', WHOLE_INDEX);
  assertBlocked('git commit --all -m x -- a.ts', 'commit', WHOLE_INDEX);
  assertBlocked('git commit -i -m x -- a.ts', 'commit', WHOLE_INDEX);
  assertBlocked('git commit --include -m x -- a.ts', 'commit', WHOLE_INDEX);
  assertBlocked('GIT_INDEX_FILE=.git/index git commit -m x', 'commit', WHOLE_INDEX);
  assertBlocked('git commit --amend -m x -- a.ts', 'commit', GUARD);
});

// The hook cannot read a shell variable, so `GIT_INDEX_FILE=$I` counts as the
// private index that AGENTS.md has a session make; an unset $I is not caught.
test('allows a commit from a private index and a commit dry run', () => {
  assertAllowed('GIT_INDEX_FILE=$I git commit -m x');
  assertAllowed('export GIT_INDEX_FILE=/tmp/scratch/index; git commit -m x');
  assertAllowed('git commit --dry-run');
});

test('blocks staging in the shared index that the same command does not commit', () => {
  assertBlocked('git add a.ts', 'add', SHARED_INDEX);
  assertBlocked('git add -A && git commit -m x', 'add', SHARED_INDEX);
  assertBlocked('git add -A && git commit --only -m x -- a.ts', 'add', SHARED_INDEX);
  assertBlocked('git add a.ts b.ts && git commit --only -m x -- a.ts', 'add', SHARED_INDEX);
  assertBlocked('git commit --only -m x -- a.ts && git add a.ts', 'add', SHARED_INDEX);
  assertBlocked('git add a.ts && git commit -m x -- a.ts.bak', 'add', SHARED_INDEX);
  assertBlocked('git add a.ts && GIT_INDEX_FILE=/tmp/i git commit -m x -- a.ts', 'add', SHARED_INDEX);
  assertBlocked('git add a.ts && git commit --dry-run -- a.ts', 'add', SHARED_INDEX);
  assertBlocked('git add a.ts && git commit -a -m x', 'add', SHARED_INDEX);
  assertBlocked('GIT_INDEX_FILE=.git/index git add a.ts', 'add', SHARED_INDEX);
  assertBlocked('export GIT_INDEX_FILE=/tmp/i; unset GIT_INDEX_FILE; git add a.ts', 'add', SHARED_INDEX);
  assertBlocked('git rm old.ts', 'rm', SHARED_INDEX);
  assertBlocked('git mv a.ts b.ts', 'mv', SHARED_INDEX);
  assertBlocked('git apply --cached mine.patch', 'apply', SHARED_INDEX);
  assertBlocked('git diff --cached -- a.ts | git apply --cached', 'apply', SHARED_INDEX);
  assertBlocked('git diff -R -- a.ts | git apply --cached', 'apply', SHARED_INDEX);
  assertBlocked('git diff --cached -R -- a.ts | git apply --cached other.patch', 'apply', SHARED_INDEX);
  assertBlocked('git update-index --cacheinfo 100644,abc,a.ts', 'update-index', SHARED_INDEX);
  assertBlocked(`python3 -c "import subprocess; subprocess.run(['git', 'update-index', '--cacheinfo', f'100644,{b},a.ts'])"`, 'update-index', SHARED_INDEX);
});

test('allows staging that the same command commits, staging in a private index, and the resync of the shared index', () => {
  assertAllowed('git add -- new.ts && git commit --only -m x -- new.ts');
  assertAllowed('git add -- a.ts > /dev/null && git commit --only -m x -- a.ts 2>&1 | tail -1');
  assertAllowed('git add src/a.ts && git commit -m x -- src');
  assertAllowed('git add src/a.ts && git commit -m x -- src/');
  assertAllowed('git add -A -- . && git commit -m base -- .');
  assertAllowed('git add src/a.ts && git commit -m x -- .');
  assertAllowed('mv a.ts b.ts && git add -- a.ts b.ts && git commit --only -m x -- a.ts b.ts');
  assertAllowed('git mv a.ts b.ts && git commit -m x -- a.ts b.ts');
  assertAllowed('GIT_INDEX_FILE=$I git add a.ts && GIT_INDEX_FILE=$I git apply --cached mine.patch');
  assertAllowed('export GIT_INDEX_FILE=/tmp/scratch/index; git add a.ts');
  assertAllowed('git diff --cached -R --binary -- a.ts b.ts | git apply --cached');
  assertAllowed('git apply --cached --check mine.patch');
  assertAllowed('git update-index -q --refresh');
});

test('allows a staging dry run, and reads a heredoc body as commands only when a shell runs it', () => {
  assertAllowed('git add -n src && git rm -q --cached --dry-run a.ts && git mv -n a.ts b.ts');
  assertBlocked('git add -N a.ts', 'add', SHARED_INDEX);
  assertAllowed(["cat > .husky/pre-commit <<'EOF'", 'nx run backend:build', 'git add openapi.json', 'EOF'].join('\n'));
  assertAllowed(["git commit -F - -- a.ts <<'EOF'", 'fix: x', '', 'git reset was the cause', 'EOF'].join('\n'));
  assertBlocked(["bash <<'EOF'", 'git reset --hard', 'EOF'].join('\n'), 'reset', GUARD);
  assertBlocked(["/bin/sh -s <<'EOF'", 'git checkout .', 'EOF'].join('\n'), 'checkout', GUARD);
  assertBlocked(["env FOO=1 zsh <<'EOF'", 'git rebase main', 'EOF'].join('\n'), 'rebase', GUARD);
  assertBlocked(["ssh host <<'EOF'", 'git stash', 'EOF'].join('\n'), 'stash', GUARD);
});

test('blocks a clone of a local checkout and allows a remote or bare repository', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'git-guard-clone-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q', join(dir, 'work')]).status, 0);
    assert.equal(spawnSync('git', ['init', '-q', '--bare', join(dir, 'remote.git')]).status, 0);
    const clone = (command: string, cwd = dir) => runHook(command, cwd)?.hookSpecificOutput;
    for (const command of [`git clone ${join(dir, 'work')} /tmp/copy`, 'git clone --no-local -b main ./work copy', `git clone file://${join(dir, 'work')} copy`]) {
      assert.match(clone(command)?.permissionDecisionReason ?? '', LOCAL_CLONE, command);
    }
    assert.match(clone('git clone . /tmp/copy', join(dir, 'work'))?.permissionDecisionReason ?? '', LOCAL_CLONE);
    for (const command of [`git clone ${join(dir, 'remote.git')} work2`, 'git clone $SRC copy', 'git clone https://github.com/x/y.git', 'git clone ssh://host/x.git', 'git clone --depth 1 git@github.com:x/y.git /tmp/y']) {
      assert.equal(clone(command), undefined, command);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('allows git remote -v', () => {
  assertAllowed('git remote -v');
});

test('allows git remote get-url origin', () => {
  assertAllowed('git remote get-url origin');
});

test('allows git remote add', () => {
  assertAllowed('git remote add origin https://github.com/x/y.git');
});

test('allows git remote set-url', () => {
  assertAllowed('git remote set-url origin https://github.com/x/z.git');
});

test('allows git remote remove', () => {
  assertAllowed('git remote remove upstream');
});

test('allows wiring a new checkout to its remote and upstream in one command', () => {
  assertAllowed(
    'cd ~/repo && git remote add origin https://github.com/x/y.git && git fetch origin main && git branch --set-upstream-to=origin/main main',
  );
});

test('allows git branch -u to set the upstream', () => {
  assertAllowed('git branch -u origin/main');
});

test('allows git branch --unset-upstream', () => {
  assertAllowed('git branch --unset-upstream');
});

test('still blocks git branch -D', () => {
  assertBlocked('git branch -D main', 'branch');
});

test('blocks an upstream change that also deletes a branch', () => {
  assertBlocked('git branch -u origin/main -D other', 'branch');
});

test('allows git config core.hooksPath, which points the repo at its hook folder', () => {
  assertAllowed('git config core.hooksPath .husky');
});

test('allows unsetting core.hooksPath in another repo', () => {
  assertAllowed('git -C ~/repo config --unset core.hooksPath');
});

test('still blocks core.hooksPath for every repo of the user', () => {
  assertBlocked('git config --global core.hooksPath .husky', 'config');
});

test('still blocks a config write to another key', () => {
  assertBlocked('git config user.email x@y.z', 'config');
});

test('allows git count-objects', () => {
  assertAllowed('git count-objects -vH');
});

test('allows a command help page', () => {
  assertAllowed('git filter-repo --help');
});

test('allows git help', () => {
  assertAllowed('git help reset');
});

test('still blocks git filter-repo', () => {
  assertBlocked('git filter-repo --path apps', 'filter-repo');
});

test('still blocks git reset after a help flag elsewhere', () => {
  assertBlocked('git reset --hard --help', 'reset');
});

test('still blocks git reset --hard', () => {
  assertBlocked('git reset --hard', 'reset');
});

test('still allows git status', () => {
  assertAllowed('git status');
});

test('allows git fetch of a remote branch', () => {
  assertAllowed('git fetch origin main --quiet');
});

test('allows git fetch with -C inside a compound command', () => {
  assertAllowed('cd x && git -C /tmp/repo fetch --prune');
});

test('allows git ls-remote', () => {
  assertAllowed('git ls-remote origin refs/heads/main');
});

test('allows git rm that the same command commits', () => {
  assertAllowed('git rm -r -q -- old && git commit --only -m x -- old');
});

test('allows git hash-object and git update-index in a private index, which stage one file without its other hunks', () => {
  assertAllowed(
    'blob=$(git show HEAD:docs/a.md | sed s/x/y/ | git hash-object -w --stdin) && GIT_INDEX_FILE=$I git update-index --cacheinfo "100644,$blob,docs/a.md"',
  );
});

test('blocks git stash, which moves working-tree changes away', () => {
  assertBlocked('git stash', 'stash');
});

test('blocks git stash push with a message', () => {
  assertBlocked('git stash push -m x', 'stash');
});

test('blocks git stash pop in another repo', () => {
  assertBlocked('git -C /tmp stash pop', 'stash');
});

test('blocks git stash inside a compound command', () => {
  assertBlocked('cd x && git stash', 'stash');
});

test('blocks git stash inside bash -c', () => {
  assertBlocked('bash -c "git stash"', 'stash');
});

test('allows git stash list', () => {
  assertAllowed('git stash list');
});

test('allows git stash show -p', () => {
  assertAllowed('git stash show -p');
});

test('blocks the call when its input is not JSON', () => {
  const result = spawnSync('node', [SCRIPT], { input: 'not json', encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /could not read its input/);
});

test('blocks git read-tree that would write the shared index or the working tree', () => {
  assertBlocked('git read-tree HEAD', 'read-tree');
  assertBlocked('GIT_INDEX_FILE=.git/index git read-tree HEAD', 'read-tree');
  assertBlocked('GIT_INDEX_FILE="$PWD/.git/index" git read-tree HEAD', 'read-tree');
  assertBlocked('GIT_INDEX_FILE=/Users/me/repo/.git/index git read-tree HEAD', 'read-tree');
  assertBlocked('GIT_INDEX_FILE=/tmp/x/index git read-tree -u HEAD', 'read-tree');
  assertBlocked('GIT_INDEX_FILE=/tmp/x/index git read-tree -m -u HEAD', 'read-tree');
  assertBlocked('GIT_INDEX_FILE=/tmp/x/index git read-tree -mu HEAD', 'read-tree');
});

test('allows git read-tree into a private index named on the same command', () => {
  assertAllowed('GIT_INDEX_FILE=/tmp/scratch/index git read-tree HEAD');
  assertAllowed('cd repo && GIT_INDEX_FILE="$I" git read-tree HEAD && GIT_INDEX_FILE="$I" git apply --cached my.patch');
});

test('blocks a commit or push that skips the repo hooks', () => {
  assertBlocked('git commit --no-verify -m x -- a.ts', 'commit');
  assertBlocked('git commit -n -m x -- a.ts', 'commit');
  assertBlocked('git commit -nm x -- a.ts', 'commit');
  assertBlocked('git commit --no-v -m x -- a.ts', 'commit');
  assertBlocked('git add a.ts && git commit -m "fix" --no-verify -- a.ts', 'commit');
  assertBlocked('git push --no-verify origin main', 'push');
});

test('allows a push dry run and a message that only mentions the flag', () => {
  assertAllowed('git push -n origin main');
  assertAllowed('git commit -mn -- a.ts');
  assertAllowed('git commit -m "explain why -n and --no-verify are blocked" -- a.ts');
});

test('allows --no-verify on a commit dry run, which runs no hook', () => {
  assertAllowed('git commit --dry-run --no-verify -- a.ts');
  assertAllowed('git commit --dry --no-verify');
  assertAllowed('git commit --dry-run --porcelain --no-verify --pathspec-from-file=paths.txt');
  assertBlocked('git commit --no-verify -m x -- --dry-run', 'commit');
});

test('blocks git that a script runs where the Bash command does not show it', () => {
  assertBlocked(`node -e "require('node:child_process').execSync('git reset --hard')"`, 'reset');
  assertBlocked(`node --input-type=module --eval "import { execFileSync } from 'node:child_process'; execFileSync('git', ['rebase', 'main'])"`, 'rebase');
  assertBlocked(`python3 -c "import subprocess; subprocess.run(['git', 'checkout', '.'])"`, 'checkout');
  assertBlocked(`python -c "import os; os.system('git stash')"`, 'stash');
  assertBlocked(
    ["node <<'EOF'", "const { execSync } = require('node:child_process');", "execSync('git restore src/a.ts');", 'EOF'].join('\n'),
    'restore',
  );
  assertBlocked(`bun -p "require('node:child_process').execSync('git switch main')"`, 'switch');
  assertBlocked(`deno eval "import { execSync } from 'node:child_process'; execSync('git merge x')"`, 'merge');
  assertBlocked(["tsx <<'EOF'", "import { execSync } from 'node:child_process';", "execSync('git stash');", 'EOF'].join('\n'), 'stash');
});

test('reads a git argument list past an item that is not a string literal', () => {
  assertAllowed(
    ["python3 - <<'EOF'", 'import subprocess', "root = '/repo'", "subprocess.run(['git', '-C', root, 'show', 'HEAD:README.md'], check=True)", "subprocess.run(['git', '-C', root, 'log', '--format', f'%H,{fmt},%s'])", 'EOF'].join('\n'),
  );
  assertAllowed(`python3 -c "import subprocess; subprocess.run(['git', *args])"`);
  assertBlocked(`python3 -c "import subprocess; subprocess.run(['git', '-C', root, 'reset', '--hard'])"`, 'reset');
  assertBlocked(`python3 -c "import subprocess; subprocess.run(['git', '-C', os.path.join(a, b), 'checkout', '.'])"`, 'checkout');
});

test('allows a script that writes source code holding a git call, and still reads the code after a stray quote', () => {
  assertAllowed(
    ["python3 - <<'EOF'", "p = 'src/push.test.ts'", 's = open(p).read()', 's = s.replace("""old""", """', "execFileSync('git', ['config', 'user.email', 'x@y.z'], { cwd: folder });", '""")', 'open(p, "w").write(s)', 'EOF'].join('\n'),
  );
  assertBlocked(
    ["python3 - <<'EOF'", 'import subprocess', "# don't keep the edit", "subprocess.run(['git', 'checkout', '--', 'a.ts'])", 'EOF'].join('\n'),
    'checkout',
  );
});

test('allows a script that runs read-only git, or only mentions git', () => {
  assertAllowed(`node -e "console.log(require('node:child_process').execSync('git status --short').toString())"`);
  assertAllowed(`python3 -c "import subprocess; print(subprocess.run(['git', 'log', '-1']).returncode)"`);
  assertAllowed(`node -e "console.log('git reset is blocked by the hook')"`);
  assertAllowed(`grep -n "execSync('git reset" src/*.ts`);
});

function assertDenied(command: string, reason: RegExp) {
  const output = runHook(command);
  assert.equal(output?.hookSpecificOutput?.permissionDecision, 'deny', `expected deny for: ${command}`);
  assert.match(output.hookSpecificOutput.permissionDecisionReason, reason);
}

test('blocks a variable that zsh would read with a modifier because a colon and a letter follow it', () => {
  assertDenied('npx nx run $p:lint', /zsh/);
  assertDenied('for p in a b; do npx nx run $p:typecheck; done', /\$\{p\}:typecheck/);
  assertDenied('git show $P:libs/x.ts', /zsh/);
  assertDenied('echo "$dir:src"', /zsh/);
});

test('allows braced, single-quoted, escaped and non-modifier uses of a variable before a colon', () => {
  assertAllowed('npx nx run "${p}:lint"');
  assertAllowed(`echo '$p:lint'`);
  assertAllowed('echo \\$p:lint');
  assertAllowed('curl http://$HOST:8080/health');
  assertAllowed('PATH=$PATH:/usr/local/bin node x.js');
  assertAllowed(["cat > notes.md <<'EOF'", 'run nx run $p:lint', 'EOF'].join('\n'));
});

test('allows a variable before a colon and a letter that zsh does not read as a modifier', () => {
  assertAllowed('for p in a b; do npx nx run $p:build; done');
  assertAllowed('jq ".[$c:packages]" x.json');
  assertAllowed('echo "$PICKED:ok $S1:deny $img:bootstrap $p:prisma"');
});

test('blocks a modifier that zsh reads through a g, f or w prefix or a substitution', () => {
  assertDenied('npx nx run $p:generate', /`:ge` modifier/);
  assertDenied('npx nx run $p:watch', /`:wa` modifier/);
  assertDenied('npx nx run $p:serve', /`:s` modifier/);
});

test('reads quotes inside $( ) apart from the quotes around it, and skips comments', () => {
  assertAllowed(`K="$(grep '^K=' .env | cut -d= -f2- | tr -d '"')" node -e 'const done = (why) => why'`);
  assertAllowed('echo "$s: $(grep -vE "function $s|const $s =" f | wc -l)"');
  assertAllowed("echo ok # $p:lint don't");
  assertDenied('echo "$(echo $p:lint)"', /`:l` modifier/);
  assertDenied('x=$(echo $p:lint)', /`:l` modifier/);
  assertDenied('echo "$(date)" $p:lint', /`:l` modifier/);
  assertDenied('echo "$(npx nx run $p:test)"', /`:t` modifier/);
});

test('blocks an assignment to the zsh names status and path', () => {
  assertDenied('status=$(curl -s -o /dev/null -w "%{http_code}" x)', /zsh keeps `status`/);
  assertDenied('f() { local status=1; }', /zsh keeps `status`/);
  assertDenied('read -r id status <<< "1 ok"', /zsh keeps `status`/);
  assertDenied('for path in a b; do echo $path; done', /zsh ties `path`/);
  assertDenied('x=1; path=/tmp/x; ls', /zsh ties `path`/);
  assertDenied('if true; then status=1; fi', /zsh keeps `status`/);
  for (const word of ['typeset', 'declare', 'export', 'readonly', 'integer', 'float']) {
    assertDenied(`${word} status=1`, /zsh keeps `status`/);
  }
  assertDenied('select path in a b; do break; done', /zsh ties `path`/);
  assertDenied('path+=(/opt/bin)', /zsh ties `path`/);
  assertDenied('read -d , status <<< "a,b"', /zsh keeps `status`/);
  assertDenied('while read -r status; do :; done < f', /zsh keeps `status`/);
});

test('allows status and path as arguments, in quotes, in another shell or language, and in a heredoc', () => {
  assertAllowed('echo status=done && jq ".status=1" f.json');
  assertAllowed(`curl -w "status=%{http_code}" x && node -e "const path = 1"`);
  assertAllowed('STATUS=1 my_status=2 PATH_X=3 env');
  assertAllowed(`bash -c 'status=1; echo $status'`);
  assertAllowed(['cat > run.sh <<EOF', 'status=1', 'path=/tmp', 'EOF'].join('\n'));
  assertAllowed('read -r run_state <<< ok');
  assertAllowed('read -r -d path line <<< x');
  assertAllowed('"status=1" env');
});

test('blocks a commit whose message carries an attribution trailer', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'git-guard-'));
  try {
    const message = join(dir, 'msg.txt');
    writeFileSync(message, 'feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n');
    assertBlocked('git commit -m "feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>" -- a.ts', 'commit');
    assertBlocked(["git commit -F - -- a.ts <<'EOF'", 'feat: x', '', 'Claude-Session: 1234', 'EOF'].join('\n'), 'commit');
    assertBlocked(`git commit -F ${message} -- a.ts`, 'commit');
    assertBlocked(`git commit --file ${message} -- a.ts`, 'commit');
    assertBlocked(`git commit --file=${message} -- a.ts`, 'commit');
    assertBlocked(`git commit -F${message} -- a.ts`, 'commit');
    const relative = runHook('git commit -F msg.txt -- a.ts', dir)?.hookSpecificOutput;
    assert.equal(relative?.permissionDecision, 'deny', 'expected deny for a message file relative to the session cwd');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('allows a commit that only mentions Claude, and a log search for a trailer', () => {
  assertAllowed('git commit -m "fix: drop the Claude attribution from the brief" -- a.ts');
  assertAllowed('git log --grep="Co-Authored-By:" --oneline');
});

test('a blocked git command names the routes that stay open', () => {
  for (const command of ['git reset --hard HEAD~1', 'git checkout -b fix/x']) {
    const reason = runHook(command)?.hookSpecificOutput?.permissionDecisionReason ?? '';
    assert.match(reason, /git show HEAD:<path> > <path>/, command);
    assert.match(reason, /git for-each-ref/, command);
    assert.match(reason, /current branch/, command);
    assert.match(reason, /fix forward/, command);
    assert.match(reason, /`!`/, command);
  }
});

const PIPED_COMMIT = /A pipe after git commit hides its exit status/;

// 2026-11-07: `git commit … | tail -1 && agent-backlog done 3915` closed a ticket although the
// pre-commit hook refused the commit, because the pipeline's status was tail's.
test('blocks a piped git commit that a later && depends on, unless pipefail is set', () => {
  assertBlocked(
    'git add -- a.ts && git commit --only -m x -- a.ts 2>&1 | tail -1 && agent-backlog done 3915',
    'commit',
    PIPED_COMMIT,
  );
  assertBlocked('git commit --only -m x -- a.ts | grep -v notice && echo done', 'commit', PIPED_COMMIT);
  assertBlocked('git commit --only -m x -- a.ts | head -3 | tail -1 && echo done', 'commit', PIPED_COMMIT);
  assertAllowed('git commit --only -m x -- a.ts 2>&1 | tail -1');
  assertAllowed('git commit --only -m x -- a.ts | tail -1; echo next');
  assertAllowed('git commit --only -m x -- a.ts && echo done');
  assertAllowed('set -o pipefail; git commit --only -m x -- a.ts | tail -1 && echo done');
  assertAllowed('setopt pipefail; git commit --only -m x -- a.ts | tail -1 && echo done');
  assertAllowed('git log --oneline | head -3 && echo done');
});

// 2026-11-09: a real commit in a shared tree used -c core.hooksPath=/nonexistent. It skips the same
// hooks as --no-verify, which is already refused.
test('blocks a commit or push that points core.hooksPath outside the repo', () => {
  assertBlocked('git -c core.hooksPath=/dev/null commit -m x -- a.ts', 'commit', GUARD);
  assertBlocked('git -c core.hooksPath=/nonexistent commit -q -m dbg --only -- a.ts', 'commit', GUARD);
  assertBlocked('git -C ~/repo -c core.hooksPath=/var/empty commit -m x -- a.ts', 'commit', GUARD);
  assertBlocked('git -c core.hooksPath=~/none push origin main', 'push', GUARD);
  assertBlocked('git -c core.hooksPath= commit -m x -- a.ts', 'commit', GUARD);
  assertBlocked('git -ccore.hooksPath=/dev/null commit -m x -- a.ts', 'commit', GUARD);
  assertBlocked('git -c CORE.HOOKSPATH=/dev/null commit -m x -- a.ts', 'commit', GUARD);
});

test('allows core.hooksPath pointed at the repo hook folder, and other -c values, on a commit or push', () => {
  assertAllowed('git -c core.hooksPath=.husky commit -m x -- a.ts');
  assertAllowed('git -c core.hooksPath=.husky push origin main');
  assertAllowed('git -c user.name=t commit -m x -- a.ts');
  assertAllowed('git -c core.hooksPath=/dev/null status');
});
