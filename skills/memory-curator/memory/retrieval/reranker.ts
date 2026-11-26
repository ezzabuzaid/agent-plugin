/**
 * reranker.ts — Reranker strategy with two implementations.
 *
 *   - CrossEncoderReranker: local ONNX cross-encoder (transformers.js) — the quality stage.
 *   - NoOpReranker: Null Object — returns candidates untouched (their fusion score/order).
 *
 * The Null Object lets the retriever ALWAYS call `reranker.rerank()` with no `if (rerank)`
 * branch; the CLI decides which implementation to inject for `--no-rerank`.
 */

import { mkdir } from 'node:fs/promises';

export interface Scored<T> {
  item: T;
  score: number;
}

export interface Candidate<T> {
  item: T;
  text: string;
  score: number; // upstream fusion score, carried through for the no-op path
}

export interface Reranker {
  rerank<T>(query: string, candidates: Candidate<T>[], k: number): Promise<Scored<T>[]>;
}

export class NoOpReranker implements Reranker {
  async rerank<T>(_query: string, candidates: Candidate<T>[], k: number): Promise<Scored<T>[]> {
    return candidates.slice(0, k).map((c) => ({ item: c.item, score: c.score }));
  }
}

export interface CrossEncoderOptions {
  cacheDir: string;
  model?: string;
  batchSize?: number;
}

// Type-only module reference — erased at runtime, so it does NOT defeat the lazy import.
type TransformersModule = typeof import('@huggingface/transformers');
interface CrossEncoderPipeline {
  tokenizer: Awaited<ReturnType<TransformersModule['AutoTokenizer']['from_pretrained']>>;
  model: Awaited<ReturnType<TransformersModule['AutoModelForSequenceClassification']['from_pretrained']>>;
}

export class CrossEncoderReranker implements Reranker {
  readonly #model: string;
  readonly #cacheDir: string;
  readonly #batchSize: number;
  #pipeline: CrossEncoderPipeline | undefined;

  constructor(opts: CrossEncoderOptions) {
    this.#model = opts.model ?? 'Xenova/ms-marco-MiniLM-L-6-v2';
    this.#cacheDir = opts.cacheDir;
    this.#batchSize = opts.batchSize ?? 16;
  }

  async rerank<T>(query: string, candidates: Candidate<T>[], k: number): Promise<Scored<T>[]> {
    if (!candidates.length) return [];
    const { tokenizer, model } = await this.#init();

    const scores = new Array<number>(candidates.length);
    for (let s = 0; s < candidates.length; s += this.#batchSize) {
      const batch = candidates.slice(s, s + this.#batchSize);
      const inputs = await tokenizer(
        batch.map(() => query),
        { text_pair: batch.map((c) => c.text), padding: true, truncation: true },
      );
      const { logits } = await model(inputs);
      const data = logits.data as Float32Array;
      // ms-marco is [batch, 1]; guard so an unexpected shape throws loudly instead of
      // producing NaN scores (Number(undefined)) and silently garbage-ordered results.
      const nLabels = Number(logits.dims.at(-1) ?? 1);
      if (!Number.isFinite(nLabels) || nLabels < 1) {
        throw new Error(`Reranker got unexpected logits dims: ${JSON.stringify(logits.dims)}`);
      }
      batch.forEach((_, j) => {
        scores[s + j] = nLabels === 1 ? data[j] : data[j * nLabels + (nLabels - 1)];
      });
    }

    return candidates
      .map((c, i) => ({ item: c.item, score: scores[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  /** Lazy-load the heavy library + model once, only when reranking is requested. */
  async #init(): Promise<CrossEncoderPipeline> {
    if (!this.#pipeline) {
      const { AutoModelForSequenceClassification, AutoTokenizer, env } = await import(
        '@huggingface/transformers'
      );
      await mkdir(this.#cacheDir, { recursive: true });
      env.cacheDir = this.#cacheDir;
      env.allowLocalModels = true;
      this.#pipeline = {
        tokenizer: await AutoTokenizer.from_pretrained(this.#model),
        model: await AutoModelForSequenceClassification.from_pretrained(this.#model),
      };
    }
    return this.#pipeline;
  }
}
