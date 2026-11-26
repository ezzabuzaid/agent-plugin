/** lexical-index.ts — in-process BM25 over the corpus (the lexical retrieval arm). */

export class Bm25Index {
  readonly #docs: string[][];
  readonly #tf: Map<string, number>[];
  readonly #df = new Map<string, number>();
  readonly #len: number[];
  readonly #avgdl: number;
  readonly #k1 = 1.5;
  readonly #b = 0.75;

  constructor(documents: string[]) {
    this.#docs = documents.map(Bm25Index.tokenize);
    this.#len = this.#docs.map((d) => d.length);
    this.#avgdl = this.#len.reduce((a, b) => a + b, 0) / (this.#docs.length || 1);
    this.#tf = this.#docs.map((d) => {
      const m = new Map<string, number>();
      for (const t of d) m.set(t, (m.get(t) ?? 0) + 1);
      return m;
    });
    for (const d of this.#docs) for (const t of new Set(d)) this.#df.set(t, (this.#df.get(t) ?? 0) + 1);
  }

  static tokenize(s: string): string[] {
    return s.toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) ?? [];
  }

  /** Indices sorted by descending BM25 relevance to the query. */
  rank(query: string): number[] {
    const q = Bm25Index.tokenize(query);
    return this.#docs.map((_, i) => i).sort((a, b) => this.#score(q, b) - this.#score(q, a));
  }

  #idf(t: string): number {
    const n = this.#df.get(t) ?? 0;
    return Math.log(1 + (this.#docs.length - n + 0.5) / (n + 0.5));
  }

  #score(qTokens: string[], i: number): number {
    let score = 0;
    for (const t of qTokens) {
      const f = this.#tf[i].get(t);
      if (!f) continue;
      score += this.#idf(t) * ((f * (this.#k1 + 1)) / (f + this.#k1 * (1 - this.#b + (this.#b * this.#len[i]) / this.#avgdl)));
    }
    return score;
  }
}
