/** show-presenter.ts — render a single memory in full, resolved by frontmatter name or filename stem. */

import type { Memory } from '../domain.ts';

export class ShowPresenter {
  /**
   * Resolve `slug` against each memory's frontmatter name (what `export` prints) and filename
   * stem, or against `Project/<name or stem>`, the form the ambiguous-match list prints (exact
   * wins, else substring), and render.
   */
  present(memories: Memory[], slug: string): string {
    const norm = slug.toLowerCase().replace(/\.md$/, '');
    const keys = (m: Memory) => {
      const ids = [m.file.replace(/\.md$/, ''), ...(m.name ? [m.name] : [])].map((id) => id.toLowerCase());
      return norm.includes('/') ? ids.map((id) => `${m.projectLabel.toLowerCase()}/${id}`) : ids;
    };

    const exact = memories.filter((m) => keys(m).includes(norm));
    const matches = exact.length ? exact : memories.filter((m) => keys(m).some((k) => k.includes(norm)));

    if (!matches.length) return `No memory matches "${slug}".`;
    if (matches.length > 1) {
      return [
        `${matches.length} memories match "${slug}" — be more specific:`,
        ...matches.map((m) => `  ${m.projectLabel}/${m.file}  —  ${m.name ?? ''}`),
      ].join('\n');
    }

    const m = matches[0];
    return [
      `${m.projectLabel}/${m.file}`,
      m.path,
      '─'.repeat(60),
      `[${m.type ?? '??'}]  ${m.name ?? ''}`,
      ...(m.description ? [m.description] : []),
      '',
      m.body,
    ].join('\n');
  }
}
