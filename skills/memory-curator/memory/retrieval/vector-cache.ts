/**
 * vector-cache.ts — VectorCache (Repository for embeddings).
 *
 * Persists one vector per memory in an NDJSON file keyed by a content hash, so only
 * new/changed memories are re-embedded. Returns vectors aligned to the input order.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Memory } from '../domain.ts';
import type { Embedder } from './embedder.ts';

interface CacheEntry {
  hash: string;
  vector: number[];
}

export interface EmbedResult {
  vectors: number[][];
  embedded: number;
}

export interface VectorCacheOptions {
  path: string;
  embedder: Embedder;
}

export class VectorCache {
  readonly #path: string;
  readonly #embedder: Embedder;

  constructor(opts: VectorCacheOptions) {
    this.#path = opts.path;
    this.#embedder = opts.embedder;
  }

  static hash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  async embed(memories: Memory[], rebuild = false): Promise<EmbedResult> {
    const cache = rebuild ? new Map<string, CacheEntry>() : await this.#load();
    const texts = memories.map((m) => m.text());
    const hashes = texts.map(VectorCache.hash);
    const need = memories
      .map((m, i) => ({ m, i }))
      .filter(({ m, i }) => cache.get(m.path)?.hash !== hashes[i]);

    if (need.length) {
      const vectors = await this.#embedder.embedPassages(need.map(({ i }) => texts[i]));
      need.forEach(({ m, i }, j) => cache.set(m.path, { hash: hashes[i], vector: vectors[j] }));
      // Persist only when embeddings actually changed — a pure cache-hit run rewriting
      // the whole NDJSON every time is wasted I/O and widens the concurrent-write race.
      await this.#save(cache);
    }
    return { vectors: memories.map((m) => cache.get(m.path)!.vector), embedded: need.length };
  }

  async #load(): Promise<Map<string, CacheEntry>> {
    const map = new Map<string, CacheEntry>();
    try {
      const raw = await readFile(this.#path, 'utf8');
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        const o = JSON.parse(line) as { path: string } & CacheEntry;
        map.set(o.path, { hash: o.hash, vector: o.vector });
      }
    } catch {
      /* no cache yet */
    }
    return map;
  }

  async #save(cache: Map<string, CacheEntry>): Promise<void> {
    await mkdir(dirname(this.#path), { recursive: true });
    // Persist the WHOLE cache, not just this call's memories — a filtered recall
    // (--type/--project) must not prune the vectors of memories it didn't touch.
    // Stale entries for deleted memories linger harmlessly; --rebuild clears them.
    const lines = [...cache].map(([path, e]) =>
      JSON.stringify({ path, hash: e.hash, vector: e.vector }),
    );
    await writeFile(this.#path, lines.join('\n') + '\n');
  }
}
