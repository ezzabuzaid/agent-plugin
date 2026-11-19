import { readFile } from 'node:fs/promises';
import { join, matchesGlob } from 'node:path';

import { ConfigInvalid, ConfigMissing } from '../errors.ts';
import { ROOT, Shape } from '../ledger/shape.ts';

/** Paths no run may claim, such as files another checker owns. */
export interface Refusal {
  readonly glob: string;
  readonly reason: string;
}

/**
 * What a repository tells update-docs about its own docs: the guide the docs
 * follow, the map file at its root that every project's run may edit, and the
 * paths no run may claim.
 */
export class RepoConfig {
  static readonly file = '.claude/update-docs.json';

  readonly guide: string;
  readonly map: string;
  readonly refuse: readonly Refusal[];

  private constructor(fields: Pick<RepoConfig, 'guide' | 'map' | 'refuse'>) {
    this.guide = fields.guide;
    this.map = fields.map;
    this.refuse = fields.refuse;
  }

  static async read(repoRoot: string): Promise<RepoConfig> {
    const file = join(repoRoot, RepoConfig.file);
    let text: string;
    try {
      text = await readFile(file, 'utf8');
    } catch (error) {
      if (Error.isError(error) && 'code' in error && error.code === 'ENOENT') {
        throw new ConfigMissing(file);
      }
      throw error;
    }
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ConfigInvalid(file, 'the document', error.message);
      }
      throw error;
    }
    const shape = new Shape(
      (path, problem) => new ConfigInvalid(file, path, problem),
    );
    const config = shape.object(value, ROOT, ['guide', 'map', 'refuse']);
    return new RepoConfig({
      guide: shape.text(config.get('guide'), 'guide'),
      map: shape.text(config.get('map'), 'map'),
      refuse: shape.list(config.get('refuse'), 'refuse', (each, at) => {
        const refusal = shape.object(each, at, ['glob', 'reason']);
        return {
          glob: shape.text(refusal.get('glob'), `${at}.glob`),
          reason: shape.text(refusal.get('reason'), `${at}.reason`),
        };
      }),
    });
  }

  /** The repository's reason to refuse a claim of the path, if any. */
  refusal(path: string): Refusal | undefined {
    return this.refuse.find(({ glob }) => matchesGlob(path, glob));
  }
}
