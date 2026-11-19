import type { RepoConfig } from '../workspace/repo-config.ts';
import type { Outcome } from './outcome.ts';

/**
 * What a run needs to know about the repository before its first step: the
 * folder of its state, where the run keeps its work, and the guide and map
 * the repository's config names.
 */
export class RepoCommand {
  readonly #state: string;
  readonly #config: RepoConfig;

  constructor(state: string, config: RepoConfig) {
    this.#state = state;
    this.#config = config;
  }

  run(): Outcome {
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(
        {
          state: this.#state,
          guide: this.#config.guide,
          map: this.#config.map,
        },
        null,
        2,
      )}\n`,
    };
  }
}
