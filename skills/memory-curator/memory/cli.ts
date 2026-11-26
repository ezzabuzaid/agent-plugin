/**
 * cli.ts — the `memory` program entry.
 *
 * Builds the shared CommandContext, registers global filter options, lets each command
 * (Command pattern, see cli/) wire itself onto the cac program, then dispatches. Holds no
 * command logic of its own.
 *
 *   node ~/.claude/skills/memory-curator/memory/cli.ts <summary|list|search|issues|export|show|recall> [...]
 */

import { join } from 'node:path';
import { cac } from 'cac';
import { CorpusRepository } from './corpus/repository.ts';
import { KNOWN_TYPES } from './domain.ts';
import type { CommandContext } from './cli/command.ts';
import { buildCommands } from './cli/registry.ts';

const CACHE_DIR = join(import.meta.dirname, '.cache'); // models + vectors, colocated with the bundled CLI

const ctx: CommandContext = {
  repository: new CorpusRepository(),
  cache: {
    vectors: join(CACHE_DIR, 'memory-vectors.ndjson'),
    fastembed: join(CACHE_DIR, 'fastembed'),
    transformers: join(CACHE_DIR, 'transformers'),
  },
};

const cli = cac('memory');

// Shared filters as global options (apply where relevant, ignored elsewhere).
cli.option('--project <substr>', 'Only projects whose id contains substr');
cli.option('--type <t>', `Only memories of type: ${KNOWN_TYPES.join(' | ')}`);
cli.option('--stale <days>', 'Only memories not modified within the last <days> days');
cli.option('--print', 'Also print memory bodies (list / search / export)');

for (const command of buildCommands()) command.register(cli, ctx);

cli.help();
cli.version('1.0.0');
cli.parse(process.argv, { run: false });

const wantsMeta = process.argv.slice(2).some((a) => ['--help', '-h', '--version', '-v'].includes(a));

if (cli.matchedCommand) {
  try {
    await cli.runMatchedCommand();
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
} else if (!wantsMeta) {
  // No subcommand matched (unknown or missing command) — fail loudly, never show nothing.
  const name = cli.args[0];
  if (name) process.stderr.write(`Unknown command: ${name}\n\n`);
  cli.outputHelp();
  process.exit(name ? 1 : 0);
}
