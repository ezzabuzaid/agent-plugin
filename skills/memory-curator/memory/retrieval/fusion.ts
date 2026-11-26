/**
 * fusion.ts — ScoreFusion strategy + Reciprocal Rank Fusion.
 *
 * Combines several ranked index lists (best-first) into one. Ties resolve by natural
 * index order to keep fusion deterministic and order-independent of input list order.
 */

export interface FusionResult {
  index: number;
  score: number;
}

export interface ScoreFusion {
  fuse(rankings: number[][], size: number): FusionResult[];
}

export class RrfFusion implements ScoreFusion {
  readonly #k: number;

  constructor(k = 60) {
    this.#k = k;
  }

  fuse(rankings: number[][], size: number): FusionResult[] {
    const score = new Map<number, number>();
    for (const order of rankings) {
      order.forEach((idx, rank) => score.set(idx, (score.get(idx) ?? 0) + 1 / (this.#k + rank + 1)));
    }
    // Enumerate only indices that actually appeared in some ranking — never 0..maxLen —
    // so a ranking shorter than the corpus can't emit phantom zero-score candidates.
    // Ties break by natural index order (a - b), matching the prior stable-sort behavior.
    return [...score.keys()]
      .sort((a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0) || a - b)
      .slice(0, size)
      .map((index) => ({ index, score: score.get(index) ?? 0 }));
  }
}
