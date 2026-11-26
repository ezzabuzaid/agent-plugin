/**
 * embedder.ts — Embedder strategy + FastEmbedEmbedder adapter.
 *
 * Wraps the `fastembed` library (local ONNX bge-small) behind our own interface so the
 * embedding backend is swappable. Model loads lazily on first use and is reused.
 */

import { EmbeddingModel, FlagEmbedding } from 'fastembed';
import { normalize } from './vector-math.ts';

export interface Embedder {
  embedPassages(texts: string[]): Promise<number[][]>;
  embedQuery(query: string): Promise<number[]>;
}

/** fastembed's standard `init` accepts every model except CUSTOM (which needs a local dir). */
type StandardModel = Exclude<EmbeddingModel, EmbeddingModel.CUSTOM>;

export interface FastEmbedOptions {
  cacheDir: string;
  model?: StandardModel;
  maxLength?: number;
  batchSize?: number;
  showProgress?: boolean;
}

export class FastEmbedEmbedder implements Embedder {
  readonly #cacheDir: string;
  readonly #model: StandardModel;
  readonly #maxLength: number;
  readonly #batchSize: number;
  readonly #showProgress: boolean;
  #engine: FlagEmbedding | undefined;

  constructor(opts: FastEmbedOptions) {
    this.#cacheDir = opts.cacheDir;
    this.#model = opts.model ?? EmbeddingModel.BGESmallENV15;
    this.#maxLength = opts.maxLength ?? 512;
    this.#batchSize = opts.batchSize ?? 32;
    this.#showProgress = opts.showProgress ?? false;
  }

  async embedPassages(texts: string[]): Promise<number[][]> {
    const engine = await this.#init();
    const out: number[][] = [];
    for await (const batch of engine.passageEmbed(texts, this.#batchSize)) out.push(...batch);
    return out.map(normalize);
  }

  async embedQuery(query: string): Promise<number[]> {
    const engine = await this.#init();
    return normalize(await engine.queryEmbed(query));
  }

  async #init(): Promise<FlagEmbedding> {
    if (!this.#engine) {
      this.#engine = await FlagEmbedding.init({
        model: this.#model,
        maxLength: this.#maxLength,
        cacheDir: this.#cacheDir,
        showDownloadProgress: this.#showProgress,
      });
    }
    return this.#engine;
  }
}
