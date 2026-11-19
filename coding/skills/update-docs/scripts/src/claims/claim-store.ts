import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';

import { ClaimCorrupt, NoClaim } from '../errors.ts';
import { ROOT, Shape } from '../ledger/shape.ts';
import { Claim, type PathStamp } from './claim.ts';
import { formatPathState, parsePathState } from './path-state.ts';

/**
 * The open claims, one file per project, so creating a claim is one
 * exclusive create: two runs of one project cannot both hold a claim.
 */
export class ClaimStore {
  readonly #folder: string;

  constructor(folder: string) {
    this.#folder = folder;
  }

  /**
   * Records a new claim. A project with an open claim gets no second one:
   * the open claim comes back instead, so the caller can say how to undo it.
   */
  async create(
    claim: Claim,
  ): Promise<{ kind: 'created' } | { kind: 'open'; claim: Claim }> {
    await mkdir(this.#folder, { recursive: true });
    try {
      await writeFile(this.#file(claim.project), serialize(claim), {
        flag: 'wx',
      });
      return { kind: 'created' };
    } catch (error) {
      if (Error.isError(error) && 'code' in error && error.code === 'EEXIST') {
        return { kind: 'open', claim: await this.read(claim.project) };
      }
      throw error;
    }
  }

  async read(project: string): Promise<Claim> {
    const file = this.#file(project);
    let text: string;
    try {
      text = await readFile(file, 'utf8');
    } catch (error) {
      if (isMissing(error)) {
        throw new NoClaim(project);
      }
      throw error;
    }
    return parse(file, text);
  }

  /** Every open claim; before the first claim there are none. */
  async all(): Promise<Claim[]> {
    let names: string[];
    try {
      names = await readdir(this.#folder);
    } catch (error) {
      if (isMissing(error)) {
        return [];
      }
      throw error;
    }
    return Promise.all(
      names
        .filter((name) => name.endsWith('.json') && !name.startsWith('.'))
        .map((name) => this.read(name.slice(0, -'.json'.length))),
    );
  }

  /** Writes a temporary file beside the claim, then renames it over it. */
  async replace(claim: Claim): Promise<void> {
    const temporary = join(this.#folder, `.claim-${randomUUID()}.json`);
    await writeFile(temporary, serialize(claim));
    await rename(temporary, this.#file(claim.project));
  }

  async remove(project: string): Promise<void> {
    await rm(this.#file(project));
  }

  #file(project: string): string {
    return join(this.#folder, `${project}.json`);
  }
}

function serialize(claim: Claim): string {
  return `${JSON.stringify(
    {
      project: claim.project,
      head: claim.head,
      at: claim.at,
      paths: Object.fromEntries(
        [...claim.stamps].map(([path, stamp]) => [
          path,
          stamp.kind === 'unstamped'
            ? { kind: 'unstamped' }
            : {
                kind: 'stamped',
                at: stamp.at,
                state: formatPathState(stamp.state),
              },
        ]),
      ),
    },
    null,
    2,
  )}\n`;
}

function parse(file: string, text: string): Claim {
  const shape = new Shape(
    (path, problem) => new ClaimCorrupt(file, path, problem),
  );
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ClaimCorrupt(file, 'the document', error.message);
    }
    throw error;
  }
  const claim = shape.object(value, ROOT, ['project', 'head', 'at', 'paths']);
  const paths = shape.record(claim.get('paths'), 'paths');
  return new Claim({
    project: shape.text(claim.get('project'), 'project'),
    head: shape.text(claim.get('head'), 'head'),
    at: shape.instant(claim.get('at'), 'at'),
    stamps: new Map(
      Object.entries(paths).map(([path, each]): [string, PathStamp] => {
        const at = `paths.${path}`;
        const kind = shape.oneOf(shape.record(each, at).kind, `${at}.kind`, [
          'unstamped',
          'stamped',
        ]);
        if (kind === 'unstamped') {
          shape.object(each, at, ['kind']);
          return [path, { kind }];
        }
        const stamp = shape.object(each, at, ['kind', 'at', 'state']);
        const state = parsePathState(
          shape.text(stamp.get('state'), `${at}.state`),
        );
        if (state === 'invalid') {
          throw new ClaimCorrupt(
            file,
            `${at}.state`,
            'expected absent or sha256:<hex>',
          );
        }
        return [
          path,
          { kind, at: shape.instant(stamp.get('at'), `${at}.at`), state },
        ];
      }),
    ),
  });
}

function isMissing(error: unknown): boolean {
  return Error.isError(error) && 'code' in error && error.code === 'ENOENT';
}
