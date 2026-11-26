/**
 * repository.ts — CorpusRepository (Repository pattern).
 *
 * Isolates "where memories live" (~/.claude/projects/<encoded>/memory/) from the logic
 * that uses them. Injectable root + parser for testability.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Memory, Project } from '../domain.ts';
import { FrontmatterParser } from './frontmatter.ts';

export interface CorpusRepositoryOptions {
  root?: string;
  parser?: FrontmatterParser;
}

export class CorpusRepository {
  readonly #root: string;
  readonly #parser: FrontmatterParser;

  constructor(opts: CorpusRepositoryOptions = {}) {
    this.#root = opts.root ?? join(homedir(), '.claude', 'projects');
    this.#parser = opts.parser ?? new FrontmatterParser();
  }

  async load(projectFilter?: string): Promise<Project[]> {
    const entries = await readdir(this.#root, { withFileTypes: true });
    const projects: Project[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (projectFilter && !entry.name.includes(projectFilter)) continue;

      const memDir = join(this.#root, entry.name, 'memory');
      let files: string[];
      try {
        files = await readdir(memDir);
      } catch {
        continue; // no memory/ subdir — not a memory-bearing project
      }

      const label = this.#labelFor(entry.name);
      const mdFiles = files.filter((f) => f.endsWith('.md') && f !== 'MEMORY.md');
      const memories = await Promise.all(
        mdFiles.map((f) => this.#read(memDir, f, entry.name, label)),
      );
      memories.sort((a, b) => b.mtimeMs - a.mtimeMs);

      projects.push(
        new Project({ id: entry.name, label, dir: memDir, hasIndex: files.includes('MEMORY.md'), memories }),
      );
    }

    return projects.sort((a, b) => b.memories.length - a.memories.length);
  }

  async loadMemories(projectFilter?: string): Promise<Memory[]> {
    return (await this.load(projectFilter)).flatMap((p) => p.memories);
  }

  async #read(dir: string, file: string, project: string, projectLabel: string): Promise<Memory> {
    const path = join(dir, file);
    const [raw, st] = await Promise.all([readFile(path, 'utf8'), stat(path)]);
    return new Memory({
      file,
      path,
      project,
      projectLabel,
      frontmatter: this.#parser.parse(raw),
      mtimeMs: st.mtimeMs,
    });
  }

  #labelFor(id: string): string {
    return id.replace(/^-Users-[^-]+-/, '').replace(/^-/, '') || id;
  }
}
