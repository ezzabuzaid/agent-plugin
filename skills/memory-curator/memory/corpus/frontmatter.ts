/**
 * frontmatter.ts — FrontmatterParser.
 *
 * Tolerates both auto-memory frontmatter generations: flat top-level `type:` and the
 * canonical nested `metadata:\n  type:`. The line-based parse keys on `startsWith('type:')`,
 * which excludes `node_type:`.
 */

import { isType, type ParsedFrontmatter } from '../domain.ts';

export class FrontmatterParser {
  parse(raw: string): ParsedFrontmatter {
    const { fm, body } = this.#split(raw);
    const lines = fm.split('\n').map((l) => l.trim());
    const valueOf = (key: string): string | null => {
      const line = lines.find((l) => l.startsWith(`${key}:`));
      return line ? this.#unquote(line.slice(key.length + 1)) : null;
    };

    const rawType = valueOf('type');
    return {
      name: valueOf('name'),
      description: valueOf('description'),
      type: isType(rawType) ? rawType : null,
      modern: lines.some((l) => l.startsWith('node_type:')),
      body,
    };
  }

  #split(raw: string): { fm: string; body: string } {
    if (!raw.startsWith('---')) return { fm: '', body: raw };
    const end = raw.indexOf('\n---', 3);
    if (end === -1) return { fm: '', body: raw };
    return { fm: raw.slice(3, end), body: raw.slice(end + 4).replace(/^\n+/, '') };
  }

  #unquote(s: string): string {
    return s.replace(/^["']|["']$/g, '').trim();
  }
}
