import type { PathState } from './path-state.ts';

/**
 * What one claimed path held when its writer finished, or no stamp yet. Each
 * path is stamped on its own, so a run that dies after one writer leaves the
 * proof for the drafts already written.
 */
export type PathStamp =
  | { readonly kind: 'unstamped' }
  | {
      readonly kind: 'stamped';
      readonly at: string;
      readonly state: PathState;
    };

/**
 * The Markdown paths one run of a project may write and commit. Each path was
 * clean at `head` when it was claimed, so its content at `head` is what the
 * run started from.
 */
export class Claim {
  readonly project: string;
  /** Each claimed path, in the order claimed, with its stamp. */
  readonly stamps: ReadonlyMap<string, PathStamp>;
  readonly head: string;
  readonly at: string;

  constructor(fields: Pick<Claim, 'project' | 'stamps' | 'head' | 'at'>) {
    this.project = fields.project;
    this.stamps = fields.stamps;
    this.head = fields.head;
    this.at = fields.at;
  }

  get paths(): readonly string[] {
    return [...this.stamps.keys()];
  }

  /** The claim with the given paths stamped as they hold now. */
  stamped(at: string, states: ReadonlyMap<string, PathState>): Claim {
    const stamps = new Map(this.stamps);
    for (const [path, state] of states) {
      stamps.set(path, { kind: 'stamped', at, state });
    }
    return new Claim({ ...this, stamps });
  }

  /** The claim without the released paths, or 'empty' when none is left. */
  without(released: readonly string[]): Claim | 'empty' {
    const stamps = new Map(
      [...this.stamps].filter(([path]) => !released.includes(path)),
    );
    return stamps.size === 0 ? 'empty' : new Claim({ ...this, stamps });
  }
}
