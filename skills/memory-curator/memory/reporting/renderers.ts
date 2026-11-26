/**
 * renderers.ts — discover output (Strategy + Factory).
 *
 * One Renderer per mode; RendererFactory picks by mode. Replaces the old
 * `{summary,list,...}[mode]` dispatch object with explicit polymorphism.
 */

import type { MemType, Memory, Project } from '../domain.ts';

export type DiscoverMode = 'summary' | 'list' | 'search' | 'issues' | 'json';

export interface ReportOptions {
  typeFilter?: MemType;
  staleDays?: number;
  search?: RegExp;
  print: boolean;
}

export interface Renderer {
  render(projects: Project[], opts: ReportOptions): string;
}

const pad = (s: string | number, w: number) => String(s).padEnd(w);
const padl = (s: string | number, w: number) => String(s).padStart(w);
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function filterMemories(memories: Memory[], opts: ReportOptions): Memory[] {
  const staleBefore = opts.staleDays ? Date.now() - opts.staleDays * 86_400_000 : null;
  return memories.filter((m) => {
    if (opts.typeFilter && m.type !== opts.typeFilter) return false;
    if (staleBefore !== null && m.mtimeMs > staleBefore) return false;
    if (opts.search && !opts.search.test(`${m.name}\n${m.description}\n${m.body}`)) return false;
    return true;
  });
}

class SummaryRenderer implements Renderer {
  render(projects: Project[]): string {
    const out: string[] = [];
    const labelW = Math.max(7, ...projects.map((p) => p.label.length));
    out.push(
      `${pad('PROJECT', labelW)}  ${padl('all', 4)} ${padl('usr', 4)} ${padl('fb', 4)} ${padl('prj', 4)} ${padl('ref', 4)} ${padl('drift', 5)} ${padl('bad', 3)}  idx  active`,
    );
    out.push('-'.repeat(labelW + 50));

    const totals = { all: 0, user: 0, feedback: 0, project: 0, reference: 0, drift: 0, bad: 0 };
    for (const p of projects) {
      const c = { user: 0, feedback: 0, project: 0, reference: 0, drift: 0, bad: 0 };
      for (const m of p.memories) {
        if (m.type) c[m.type]++;
        if (m.isDrift) c.drift++;
        if (m.isMalformed) c.bad++;
      }
      const active = p.memories.length ? day(p.memories[0].mtimeMs) : '—';
      out.push(
        `${pad(p.label, labelW)}  ${padl(p.memories.length, 4)} ${padl(c.user, 4)} ${padl(c.feedback, 4)} ${padl(c.project, 4)} ${padl(c.reference, 4)} ${padl(c.drift, 5)} ${padl(c.bad, 3)}  ${p.hasIndex ? ' ✓ ' : ' ✗ '}  ${active}`,
      );
      totals.all += p.memories.length;
      totals.user += c.user;
      totals.feedback += c.feedback;
      totals.project += c.project;
      totals.reference += c.reference;
      totals.drift += c.drift;
      totals.bad += c.bad;
    }

    out.push('-'.repeat(labelW + 50));
    out.push(
      `${pad(`TOTAL (${projects.length} projects)`, labelW)}  ${padl(totals.all, 4)} ${padl(totals.user, 4)} ${padl(totals.feedback, 4)} ${padl(totals.project, 4)} ${padl(totals.reference, 4)} ${padl(totals.drift, 5)} ${padl(totals.bad, 3)}`,
    );
    return out.join('\n');
  }
}

class ListRenderer implements Renderer {
  render(projects: Project[], opts: ReportOptions): string {
    const out: string[] = [];
    for (const p of projects) {
      const memories = filterMemories(p.memories, opts);
      if (!memories.length) continue;
      out.push(`\n══ ${p.label}  (${memories.length})  ${p.dir}`);
      for (const m of memories) {
        out.push(`  [${pad(m.type ?? '??', 9)}] ${m.name ?? m.file}`);
        if (m.description) out.push(`              ${m.description}`);
        if (opts.print && m.body) out.push(m.body.split('\n').map((l) => `      | ${l}`).join('\n'));
      }
    }
    return out.join('\n') || '(no memories matched the filters)';
  }
}

class SearchRenderer implements Renderer {
  render(projects: Project[], opts: ReportOptions): string {
    const out: string[] = [];
    let hits = 0;
    for (const p of projects) {
      for (const m of filterMemories(p.memories, opts)) {
        hits++;
        out.push(`${p.label}/${m.file}  —  ${m.name ?? ''}`);
        if (m.description) out.push(`    ${m.description}`);
        if (opts.print && m.body) out.push(m.body.split('\n').map((l) => `    | ${l}`).join('\n'));
      }
    }
    out.unshift(`${hits} match(es) for /${opts.search?.source}/i\n`);
    return out.join('\n');
  }
}

class IssuesRenderer implements Renderer {
  render(projects: Project[]): string {
    const out: string[] = [];
    for (const p of projects) {
      const drift = p.memories.filter((m) => m.isDrift);
      const bad = p.memories.filter((m) => m.isMalformed);
      const noIndex = !p.hasIndex && p.memories.length > 0;
      if (!drift.length && !bad.length && !noIndex) continue;

      out.push(`\n══ ${p.label}`);
      if (noIndex) out.push(`  ⚠ ${p.memories.length} memories but no MEMORY.md index`);
      for (const m of drift) {
        out.push(`  ⤫ drift   ${m.file}  filename says "${m.prefixType}" but frontmatter says "${m.type}"`);
      }
      for (const m of bad) {
        out.push(`  ⨯ no-type ${m.file}  frontmatter has no parseable type:`);
      }
    }
    return out.join('\n') || 'No integrity issues found across the corpus.';
  }
}

class JsonRenderer implements Renderer {
  render(projects: Project[], opts: ReportOptions): string {
    const data = projects.map((p) => ({
      id: p.id,
      label: p.label,
      dir: p.dir,
      hasIndex: p.hasIndex,
      memories: filterMemories(p.memories, opts).map((m) => ({
        file: m.file,
        path: m.path,
        project: m.project,
        projectLabel: m.projectLabel,
        name: m.name,
        description: m.description,
        bodyType: m.type,
        prefixType: m.prefixType,
        drift: m.isDrift,
        malformed: m.isMalformed,
        modernFrontmatter: m.modernFrontmatter,
        mtimeMs: m.mtimeMs,
        ...(opts.print ? { body: m.body } : {}),
      })),
    }));
    return JSON.stringify(data, null, 2);
  }
}

export class RendererFactory {
  static create(mode: DiscoverMode): Renderer {
    switch (mode) {
      case 'list':
        return new ListRenderer();
      case 'search':
        return new SearchRenderer();
      case 'issues':
        return new IssuesRenderer();
      case 'json':
        return new JsonRenderer();
      default:
        return new SummaryRenderer();
    }
  }
}
