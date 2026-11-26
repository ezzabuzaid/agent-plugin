/** recall-command.ts — `recall <query>`: hybrid RAG recall (the heavy command). */

import type { CAC } from 'cac';
import { type CommandContext, type GlobalCliOptions, type MemoryCommand, parseType } from './command.ts';
import { RecallPresenter } from '../reporting/recall-presenter.ts';
import { FastEmbedEmbedder } from '../retrieval/embedder.ts';
import { CrossEncoderReranker, NoOpReranker, type Reranker } from '../retrieval/reranker.ts';
import { HybridRetriever } from '../retrieval/retriever.ts';
import { VectorCache } from '../retrieval/vector-cache.ts';

interface RecallCliOptions extends GlobalCliOptions {
  k: number;
  candidates: number;
  rerank: boolean;
  rebuild?: boolean;
  json?: boolean;
}

export class RecallCommand implements MemoryCommand {
  register(cli: CAC, ctx: CommandContext): void {
    cli
      .command('recall <...query>', 'Hybrid RAG recall over all memories (local, no API keys)')
      .option('--k <n>', 'Number of results to return', { default: 8 })
      .option('--candidates <n>', 'Fused candidates to rerank', { default: 40 })
      .option('--rerank', 'Cross-encoder rerank (default on; use --no-rerank to disable)', { default: true })
      .option('--rebuild', 'Force re-embed every memory (ignore the vector cache)')
      .option('--json', 'Machine-readable output')
      .action((query: string[], opts: RecallCliOptions) => this.#run(ctx, query, opts));
  }

  async #run(ctx: CommandContext, query: string[], opts: RecallCliOptions): Promise<void> {
    const q = query.join(' ').trim();
    if (!q) throw new Error('a query is required: memory recall "<query>"');
    const typeFilter = parseType(opts.type);
    const log = (s: string) => {
      if (!opts.json) process.stderr.write(s + '\n');
    };

    const projects = await ctx.repository.load(opts.project);
    let memories = projects.flatMap((p) => p.memories);
    if (typeFilter) memories = memories.filter((m) => m.type === typeFilter);
    if (!memories.length) {
      process.stderr.write('No memories matched the project/type filters.\n');
      process.exit(1);
    }
    log(`Loaded ${memories.length} memories from ${projects.length} projects.`);

    const embedder = new FastEmbedEmbedder({ cacheDir: ctx.cache.fastembed, showProgress: !opts.json });
    const reranker: Reranker = opts.rerank
      ? new CrossEncoderReranker({ cacheDir: ctx.cache.transformers })
      : new NoOpReranker();
    const retriever = new HybridRetriever({
      memories,
      cache: new VectorCache({ path: ctx.cache.vectors, embedder }),
      embedder,
      reranker,
    });

    if (opts.rerank) log('Reranking candidates with the cross-encoder…');
    const result = await retriever.retrieve({
      query: q,
      k: Number(opts.k),
      candidates: Number(opts.candidates),
      rebuild: Boolean(opts.rebuild),
    });
    log(`Embedded ${result.embedded} new/changed (reused ${result.total - result.embedded} cached).`);

    process.stdout.write(
      (opts.json ? new RecallPresenter().json(result) : new RecallPresenter().text(result, q)) + '\n',
    );
  }
}
