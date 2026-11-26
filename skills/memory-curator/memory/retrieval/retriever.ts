/**
 * retriever.ts — HybridRetriever (Facade).
 *
 * Orchestrates the full pipeline behind one `retrieve()` call: embed (cached) → dense
 * cosine + lexical BM25 → RRF fusion → rerank. Collaborators are injected, so the embedder,
 * reranker, and fusion strategy are all swappable.
 */

import type { Memory } from '../domain.ts';
import { Bm25Index } from './lexical-index.ts';
import { RrfFusion, type ScoreFusion } from './fusion.ts';
import type { Embedder } from './embedder.ts';
import type { Candidate, Reranker, Scored } from './reranker.ts';
import type { VectorCache } from './vector-cache.ts';
import { dot } from './vector-math.ts';

export interface RetrievalRequest {
  query: string;
  k: number;
  candidates: number;
  rebuild: boolean;
}

export interface RetrievalResult {
  ranked: Scored<Memory>[];
  embedded: number;
  total: number;
}

export interface HybridRetrieverOptions {
  memories: Memory[];
  cache: VectorCache;
  embedder: Embedder;
  reranker: Reranker;
  fusion?: ScoreFusion;
}

const RERANK_TEXT_LIMIT = 1500;

export class HybridRetriever {
  readonly #memories: Memory[];
  readonly #cache: VectorCache;
  readonly #embedder: Embedder;
  readonly #reranker: Reranker;
  readonly #fusion: ScoreFusion;

  constructor(opts: HybridRetrieverOptions) {
    this.#memories = opts.memories;
    this.#cache = opts.cache;
    this.#embedder = opts.embedder;
    this.#reranker = opts.reranker;
    this.#fusion = opts.fusion ?? new RrfFusion();
  }

  async retrieve(req: RetrievalRequest): Promise<RetrievalResult> {
    const { vectors, embedded } = await this.#cache.embed(this.#memories, req.rebuild);
    const qvec = await this.#embedder.embedQuery(req.query);

    const cosOrder = this.#memories
      .map((_, i) => i)
      .sort((a, b) => dot(qvec, vectors[b]) - dot(qvec, vectors[a]));
    const bmOrder = new Bm25Index(this.#memories.map((m) => m.text())).rank(req.query);

    const fused = this.#fusion.fuse([cosOrder, bmOrder], req.candidates);
    const candidates: Candidate<Memory>[] = fused.map((f) => ({
      item: this.#memories[f.index],
      text: this.#memories[f.index].text().slice(0, RERANK_TEXT_LIMIT),
      score: f.score,
    }));

    const ranked = await this.#reranker.rerank(req.query, candidates, req.k);
    return { ranked, embedded, total: this.#memories.length };
  }
}
