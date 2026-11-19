import { hash } from 'node:crypto';
import { basename, join } from 'node:path';

import { under } from './paths.ts';

/** The ~/.claude folder of the user the tool runs for. */
export class ClaudeHome {
  readonly root: string;

  constructor(home: string) {
    this.root = join(home, '.claude');
  }

  /** The folder of one transcript folder per working directory. */
  get projects(): string {
    return join(this.root, 'projects');
  }

  /** The folder of the tool's machine-wide config and each repo's state. */
  get state(): string {
    return join(this.root, 'plans', 'update-docs');
  }

  /**
   * The folder of one repository's ledger, claims, run reports and work.
   * The hash of the path keeps apart two repos whose paths differ only in
   * punctuation, such as a/b and a-b.
   */
  repoState(repoRoot: string): string {
    return join(
      this.state,
      `${basename(repoRoot)}-${hash('sha256', repoRoot).slice(0, 12)}`,
    );
  }

  /** A session that ran here was a tool or hook run, not the user's work. */
  holds(path: string): boolean {
    return under(path, this.root);
  }
}
