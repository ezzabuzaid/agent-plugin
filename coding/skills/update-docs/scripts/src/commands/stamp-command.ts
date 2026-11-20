import type { ClaimStore } from '../claims/claim-store.ts';
import type { Draft } from '../claims/claim.ts';
import type { ClaimedPaths } from '../claims/claimed-paths.ts';
import { formatPathState, readPathState } from '../claims/path-state.ts';
import { NotClaimed } from '../errors.ts';
import type { Outcome } from './outcome.ts';

/**
 * Records what claimed paths hold once their writers finish, so commit and
 * release can tell the run's drafts from a later edit by another session. A
 * run stamps each path as its writer hands back; a stamp of a path that was
 * stamped before replaces the old one, as after a rewrite.
 */
export class StampCommand {
  readonly #repoRoot: string;
  readonly #store: ClaimStore;
  readonly #paths: ClaimedPaths;

  constructor(repoRoot: string, store: ClaimStore, paths: ClaimedPaths) {
    this.#repoRoot = repoRoot;
    this.#store = store;
    this.#paths = paths;
  }

  /** No paths given stamps every claimed path. */
  async run(
    project: string,
    given: readonly string[],
    now: Temporal.Instant,
  ): Promise<Outcome> {
    const claim = await this.#store.read(project);
    const paths = given.length === 0 ? claim.paths : given;
    const unknown = paths.filter((path) => !claim.paths.includes(path));
    if (unknown.length > 0) {
      throw new NotClaimed(project, unknown);
    }
    const drafts = new Map<string, Draft>();
    for (const path of paths) {
      const state = await readPathState(this.#repoRoot, path);
      drafts.set(
        path,
        state.kind === 'absent'
          ? state
          : { ...state, blob: await this.#paths.keep(path) },
      );
    }
    await this.#store.replace(claim.stamped(now.toString(), drafts));
    return {
      exitCode: 0,
      stdout: [...drafts]
        .map(([path, draft]) => `${path} ${formatPathState(draft)}\n`)
        .join(''),
    };
  }
}
