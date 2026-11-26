/**
 * domain.ts — core value objects for the memory corpus.
 *
 * `Memory` is a rich domain object: derived facts (drift, malformed, embedding text)
 * are behavior on the object, not precomputed primitive flags. Fields are declared
 * explicitly (NOT via constructor parameter properties — those crash Node's
 * strip-only TS loader), and frontmatter is held behind a `#private` field.
 */

export const KNOWN_TYPES = ['user', 'feedback', 'project', 'reference'] as const;
export type MemType = (typeof KNOWN_TYPES)[number];
export const isType = (s: string | null): s is MemType =>
  s !== null && (KNOWN_TYPES as readonly string[]).includes(s);

export interface ParsedFrontmatter {
  name: string | null;
  description: string | null;
  type: MemType | null;
  modern: boolean; // nested under metadata: (has node_type:)
  body: string;
}

export interface MemoryInit {
  file: string;
  path: string;
  project: string;
  projectLabel: string;
  frontmatter: ParsedFrontmatter;
  mtimeMs: number;
}

export class Memory {
  readonly file: string;
  readonly path: string;
  readonly project: string;
  readonly projectLabel: string;
  readonly mtimeMs: number;
  readonly #fm: ParsedFrontmatter;

  constructor(init: MemoryInit) {
    this.file = init.file;
    this.path = init.path;
    this.project = init.project;
    this.projectLabel = init.projectLabel;
    this.mtimeMs = init.mtimeMs;
    this.#fm = init.frontmatter;
  }

  get name(): string | null {
    return this.#fm.name;
  }
  get description(): string | null {
    return this.#fm.description;
  }
  /** Type declared in the frontmatter (the source of truth). */
  get type(): MemType | null {
    return this.#fm.type;
  }
  get body(): string {
    return this.#fm.body;
  }
  get modernFrontmatter(): boolean {
    return this.#fm.modern;
  }

  /** Type inferred from the filename prefix (e.g. `feedback_foo.md`). */
  get prefixType(): MemType | null {
    const i = this.file.indexOf('_');
    const seg = i === -1 ? '' : this.file.slice(0, i);
    return isType(seg) ? seg : null;
  }

  /** Filename prefix disagrees with the declared type. */
  get isDrift(): boolean {
    return this.prefixType !== null && this.type !== null && this.prefixType !== this.type;
  }

  /** No parseable type in the frontmatter. */
  get isMalformed(): boolean {
    return this.type === null;
  }

  /** Canonical text for embedding / lexical indexing. */
  text(): string {
    return [this.type ? `[${this.type}]` : '', this.name ?? '', this.description ?? '', this.body]
      .filter(Boolean)
      .join('\n')
      .trim();
  }
}

export interface ProjectInit {
  id: string;
  label: string;
  dir: string;
  hasIndex: boolean;
  memories: Memory[];
}

export class Project {
  readonly id: string;
  readonly label: string;
  readonly dir: string;
  readonly hasIndex: boolean;
  readonly memories: Memory[];

  constructor(init: ProjectInit) {
    this.id = init.id;
    this.label = init.label;
    this.dir = init.dir;
    this.hasIndex = init.hasIndex;
    this.memories = init.memories;
  }
}
