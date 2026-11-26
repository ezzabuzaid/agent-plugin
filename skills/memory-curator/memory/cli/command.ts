/**
 * command.ts — the Command pattern contract.
 *
 * Each subcommand is a self-registering object: it knows how to wire itself onto the cac
 * program and execute. `CommandContext` carries shared dependencies (one repository, the
 * cache paths) so commands don't each reconstruct them.
 */

import type { CAC } from 'cac';
import { isType, KNOWN_TYPES, type MemType } from '../domain.ts';
import type { CorpusRepository } from '../corpus/repository.ts';

export interface CommandContext {
  repository: CorpusRepository;
  cache: {
    vectors: string;
    fastembed: string;
    transformers: string;
  };
}

export interface MemoryCommand {
  register(cli: CAC, ctx: CommandContext): void;
}

/** Options shared by every command (registered globally on the cac program). */
export interface GlobalCliOptions {
  project?: string;
  type?: string;
  stale?: string | number;
  print?: boolean;
}

export function parseType(t: string | undefined): MemType | undefined {
  if (t === undefined) return undefined;
  if (!isType(t)) throw new Error(`--type must be one of ${KNOWN_TYPES.join('|')}, got "${t}"`);
  return t;
}
