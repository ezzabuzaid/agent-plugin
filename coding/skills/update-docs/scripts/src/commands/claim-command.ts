import type { ClaimStore } from '../claims/claim-store.ts';
import { Claim } from '../claims/claim.ts';
import type { ClaimedPaths } from '../claims/claimed-paths.ts';
import { ClaimRefused } from '../errors.ts';
import type { Project } from '../workspace/project.ts';
import type { RepoConfig } from '../workspace/repo-config.ts';
import type { Workspace } from '../workspace/workspace.ts';
import type { Outcome } from './outcome.ts';

/**
 * Claims Markdown paths for one run of a project before any writer edits
 * them. A path must be clean, so its content at HEAD is the run's start and
 * `release --revert` can put it back without touching a peer's edit.
 */
export class ClaimCommand {
  readonly #workspace: Workspace;
  readonly #config: RepoConfig;
  readonly #paths: ClaimedPaths;
  readonly #store: ClaimStore;

  constructor(parts: {
    workspace: Workspace;
    config: RepoConfig;
    paths: ClaimedPaths;
    store: ClaimStore;
  }) {
    this.#workspace = parts.workspace;
    this.#config = parts.config;
    this.#paths = parts.paths;
    this.#store = parts.store;
  }

  /** `paths` are relative to the workspace, with forward slashes. */
  async run(
    name: string,
    paths: readonly string[],
    now: Temporal.Instant,
  ): Promise<Outcome> {
    const project = await this.#workspace.project(name);
    for (const path of paths) {
      this.#inScope(project, path);
    }
    const [uncommitted] = await this.#paths.uncommitted(paths);
    if (uncommitted !== undefined) {
      throw new ClaimRefused(
        uncommitted,
        'uncommitted',
        'it has uncommitted changes, maybe another session is editing it',
      );
    }
    const claim = new Claim({
      project: project.name,
      paths,
      head: await this.#paths.head(),
      at: now.toString(),
      stamp: { kind: 'none' },
    });
    await this.#store.create(claim);
    // Checked after the exclusive create, so two runs that race for the map
    // both see each other and both refuse, never both hold it.
    const others = (await this.#store.all()).filter(
      (other) => other.project !== project.name,
    );
    for (const other of others) {
      const shared = other.paths.find((path) => paths.includes(path));
      if (shared !== undefined) {
        await this.#store.remove(project.name);
        throw new ClaimRefused(
          shared,
          'claimed',
          `the open claim of ${other.project} holds it`,
        );
      }
    }
    return { exitCode: 0, stdout: '' };
  }

  #inScope(project: Project, path: string): void {
    if (!path.endsWith('.md')) {
      throw new ClaimRefused(path, 'not-markdown', 'it is not a .md file');
    }
    const refusal = this.#config.refusal(path);
    if (refusal !== undefined) {
      throw new ClaimRefused(path, 'repo-config', refusal.reason);
    }
    if (!path.startsWith(`${project.root}/`) && path !== this.#config.map) {
      throw new ClaimRefused(
        path,
        'outside-project',
        `it is neither under ${project.root}/ nor the map ${this.#config.map}`,
      );
    }
  }
}
