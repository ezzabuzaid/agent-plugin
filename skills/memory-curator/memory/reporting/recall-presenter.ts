/** recall-presenter.ts — formats recall results as text or JSON. */

import type { Memory } from '../domain.ts';
import type { RetrievalResult } from '../retrieval/retriever.ts';

const snippet = (m: Memory, n = 220) => m.body.replace(/\s+/g, ' ').slice(0, n).trim();

export class RecallPresenter {
  json(result: RetrievalResult): string {
    return JSON.stringify(
      result.ranked.map(({ item, score }, i) => ({
        rank: i + 1,
        score,
        type: item.type,
        project: item.projectLabel,
        file: item.file,
        path: item.path,
        name: item.name,
        description: item.description,
        snippet: snippet(item),
      })),
      null,
      2,
    );
  }

  text(result: RetrievalResult, query: string): string {
    let out = `\nTop ${result.ranked.length} for: "${query}"\n\n`;
    for (const [i, { item, score }] of result.ranked.entries()) {
      out +=
        `#${String(i + 1).padStart(2)}  ${score.toFixed(3)}  [${item.type ?? '??'}]  ${item.projectLabel}/${item.file}\n` +
        `      ${item.name ?? ''}\n` +
        (item.description ? `      ${item.description}\n` : '') +
        '\n';
    }
    return out;
  }
}
