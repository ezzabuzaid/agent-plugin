import { ClaimOvertaken, NotStamped, StampMismatch } from '../errors.ts';
import { type Claim, type Draft, draftState } from './claim.ts';
import type { ClaimedPaths } from './claimed-paths.ts';
import { readPathState, samePathState } from './path-state.ts';

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
    const stamped: [string, Draft][] = [];
    const unstamped: string[] = [];
    for (const path of paths) {
      const stamp = claim.stamps.get(path);
      if (stamp?.kind === 'stamped') {
        stamped.push([path, stamp.draft]);
      } else {
        unstamped.push(path);
      }
    }
    if (unstamped.length > 0) {
      throw new NotStamped(claim.project, command, unstamped);
    }
    const changed: string[] = [];
    for (const [path, draft] of stamped) {
      const now = await readPathState(this.#repoRoot, path);
      if (!samePathState(draftState(draft), now)) {
        changed.push(path);
      }
    }
    if (changed.length > 0) {
      throw new StampMismatch(changed, await this.#drafts(claim, changed));
    }
    const committed = await this.#paths.changedBetween(
      claim.head,
      'HEAD',
      paths,
    );
    if (committed.length > 0) {
      throw new ClaimOvertaken(
        committed,
        'A commit changed them',
        await this.#drafts(claim, committed),
      );
    }
    const staged = await this.#paths.staged(paths);
    if (staged.length > 0) {
      throw new ClaimOvertaken(
        staged,
        'Another session staged them',
        await this.#drafts(claim, staged),
      );
    }
  }

  /**
   * What the run's drafts of these paths changed since the claim, with what a
   * person does next: the tool can neither commit nor revert a draft that
   * another session's edit now shares the file with.
   */
  async #drafts(claim: Claim, paths: readonly string[]): Promise<string> {
    const diffs: string[] = [];
    for (const path of paths) {
      const stamp = claim.stamps.get(path);
      if (stamp?.kind === 'stamped' && stamp.draft.kind === 'file') {
        diffs.push(
          await this.#paths.draftDiff(claim.head, path, stamp.draft.blob),
        );
      }
    }
    return diffs.length === 0
      ? ''
      : `\nThe draft's own changes, which a person takes out of the file by hand before running release ${claim.project} ${paths.join(' ')}:\n${diffs.join('')}`;
  }
}
