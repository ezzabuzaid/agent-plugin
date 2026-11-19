import { ClaimOvertaken, NotStamped, StampMismatch } from '../errors.ts';
import type { Claim } from './claim.ts';
import type { ClaimedPaths } from './claimed-paths.ts';
import { type PathState, readPathState, samePathState } from './path-state.ts';

/**
 * Proves that claimed paths hold what the run left in them: the stamped
 * content on disk, no commit since the claim that changed them, and nothing
 * staged for them in the shared index. Anything else is another session's
 * work, which commit and release must not take or undo.
 */
export class ClaimGuard {
  readonly #repoRoot: string;
  readonly #paths: ClaimedPaths;

  constructor(repoRoot: string, paths: ClaimedPaths) {
    this.#repoRoot = repoRoot;
    this.#paths = paths;
  }

  async asLeft(
    claim: Claim,
    paths: readonly string[],
    command: string,
  ): Promise<void> {
    const stamped: [string, PathState][] = [];
    const unstamped: string[] = [];
    for (const path of paths) {
      const stamp = claim.stamps.get(path);
      if (stamp?.kind === 'stamped') {
        stamped.push([path, stamp.state]);
      } else {
        unstamped.push(path);
      }
    }
    if (unstamped.length > 0) {
      throw new NotStamped(claim.project, command, unstamped);
    }
    const changed: string[] = [];
    for (const [path, state] of stamped) {
      if (!samePathState(state, await readPathState(this.#repoRoot, path))) {
        changed.push(path);
      }
    }
    if (changed.length > 0) {
      throw new StampMismatch(changed);
    }
    const committed = await this.#paths.changedBetween(
      claim.head,
      'HEAD',
      paths,
    );
    if (committed.length > 0) {
      throw new ClaimOvertaken(committed, 'A commit changed them');
    }
    const staged = await this.#paths.staged(paths);
    if (staged.length > 0) {
      throw new ClaimOvertaken(staged, 'Another session staged them');
    }
  }
}
