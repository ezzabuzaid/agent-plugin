/** registry.ts — the full set of commands, in help-display order. */

import type { MemoryCommand } from './command.ts';
import { ExportCommand, IssuesCommand, ListCommand, SearchCommand, SummaryCommand } from './report-command.ts';
import { ShowCommand } from './show-command.ts';
import { RecallCommand } from './recall-command.ts';

export function buildCommands(): MemoryCommand[] {
  return [
    new SummaryCommand(),
    new ListCommand(),
    new SearchCommand(),
    new IssuesCommand(),
    new ExportCommand(),
    new ShowCommand(),
    new RecallCommand(),
  ];
}
