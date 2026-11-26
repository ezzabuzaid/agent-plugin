// Session ledger: git's own record of each commit and each tracking-ref update
// of a Claude Code session, appended to ~/.claude/ledger/<session>.jsonl.
// hook.sh starts it, only with a session id, outside the system temp folder,
// and for reference-transaction only in state "committed" with a line under
// refs/remotes/:
//   node ledger.ts post-commit
//   node ledger.ts reference-transaction   (stdin: "<old> <new> <ref>" lines)
// git ignores the exit of both hooks (githooks(5)); the ledger still exits 0 on
// any error, so it never blocks git.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, sep } from 'node:path';

type Fact =
	| { session: string; kind: 'commit'; repo: string; sha: string; ref: string | null; at: string }
	| { session: string; kind: 'ref'; repo: string; ref: string; new: string; by: RefUpdate; at: string };

// git writes the reflog entry in the same transaction, before the "committed"
// hook runs. A push updates its tracking ref with the message "update by push"
// (git transport.c, update_tracking_ref). A fetch writes "<GIT_REFLOG_ACTION or
// 'fetch <args>'>: <fast-forward|storing head|forced-update|...>" (builtin/fetch.c),
// so pull, clone and remote update read as fetches too. Without a reflog entry
// (core.logAllRefUpdates=false) git gives no way to tell them apart.
type RefUpdate = 'push' | 'fetch' | 'unknown';

const OBJECT_ID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const ZERO_ID = /^0+$/;

function git(...args: string[]): string {
	return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function refUpdate(ref: string): RefUpdate {
	let subject: string;
	try {
		subject = git('log', '--walk-reflogs', '-1', '--format=%gs', ref, '--');
	} catch (error) {
		// git exits 128 for a ref with no reflog.
		if ((error as { status?: unknown }).status === 128) return 'unknown';
		throw error;
	}
	if (subject === 'update by push') return 'push';
	return subject === '' ? 'unknown' : 'fetch';
}

function facts(session: string, event: string | undefined): Fact[] {
	// A local bare remote's receive-pack runs the same user-level hook.
	if (git('rev-parse', '--is-bare-repository') === 'true') return [];
	const repo = git('rev-parse', '--show-toplevel');
	if (repo.startsWith(join(homedir(), 'Desktop', 'mo') + sep)) return [];
	const at = new Date().toISOString();
	if (event === 'post-commit') {
		let ref: string | null = null;
		try {
			ref = git('symbolic-ref', '-q', 'HEAD');
		} catch {
			// detached HEAD: symbolic-ref -q exits 1
		}
		return [{ session, kind: 'commit', repo, sha: git('rev-parse', 'HEAD'), ref, at }];
	}
	return readFileSync(0, 'utf8')
		.split('\n')
		.map((line) => line.split(' '))
		.filter(([, value, ref]) => ref?.startsWith('refs/remotes/') && OBJECT_ID.test(value) && !ZERO_ID.test(value))
		.map(([, value, ref]) => ({ session, kind: 'ref', repo, ref, new: value, by: refUpdate(ref), at }));
}

try {
	// hook.sh starts node only when the session id is set.
	const session = process.env.CLAUDE_CODE_SESSION_ID as string;
	const lines = facts(session, process.argv[2]);
	if (lines.length > 0) {
		const dir = join(homedir(), '.claude', 'ledger');
		mkdirSync(dir, { recursive: true });
		appendFileSync(join(dir, `${session}.jsonl`), lines.map((fact) => JSON.stringify(fact) + '\n').join(''));
	}
} catch (error) {
	process.stderr.write(`ledger: ${error instanceof Error ? error.message : String(error)}\n`);
}
process.exitCode = 0;
