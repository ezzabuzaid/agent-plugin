/**
 * report-command.ts — the discover-family commands (Command pattern + Template Method).
 *
 * `ReportCommand` is an abstract base holding the shared load→render flow; each concrete
 * command supplies only its usage/description/render-mode. `SearchCommand` additionally
 * carries a `<regex>` positional, so it overrides `register` to pass it through.
 */

import type { CAC } from 'cac';
import { type CommandContext, type GlobalCliOptions, type MemoryCommand, parseType } from './command.ts';
import { RendererFactory, type DiscoverMode, type ReportOptions } from '../reporting/renderers.ts';

function buildReportOptions(opts: GlobalCliOptions, searchSource?: string): ReportOptions {
  return {
    typeFilter: parseType(opts.type),
    staleDays: opts.stale !== undefined ? Number(opts.stale) : undefined,
    search: searchSource !== undefined ? new RegExp(searchSource, 'i') : undefined,
    print: Boolean(opts.print),
  };
}

abstract class ReportCommand implements MemoryCommand {
  protected abstract readonly usage: string;
  protected abstract readonly description: string;
  protected abstract readonly mode: DiscoverMode;

  register(cli: CAC, ctx: CommandContext): void {
    cli.command(this.usage, this.description).action((opts: GlobalCliOptions) => this.run(ctx, opts));
  }

  protected async run(ctx: CommandContext, opts: GlobalCliOptions, searchSource?: string): Promise<void> {
    const projects = await ctx.repository.load(opts.project);
    const output = RendererFactory.create(this.mode).render(projects, buildReportOptions(opts, searchSource));
    process.stdout.write(output + '\n');
  }
}

export class SummaryCommand extends ReportCommand {
  protected readonly usage = 'summary';
  protected readonly description = 'Per-project counts table with integrity flags';
  protected readonly mode = 'summary';
}

export class ListCommand extends ReportCommand {
  protected readonly usage = 'list';
  protected readonly description = 'List every memory, grouped by project';
  protected readonly mode = 'list';
}

export class IssuesCommand extends ReportCommand {
  protected readonly usage = 'issues';
  protected readonly description = 'Integrity lint: type drift, missing type, missing index';
  protected readonly mode = 'issues';
}

export class ExportCommand extends ReportCommand {
  protected readonly usage = 'export';
  protected readonly description = 'Machine-readable full dump (JSON)';
  protected readonly mode = 'json';
}

export class SearchCommand extends ReportCommand {
  protected readonly usage = 'search <regex>';
  protected readonly description = 'Full-text search over name + description + body';
  protected readonly mode = 'search';

  override register(cli: CAC, ctx: CommandContext): void {
    cli
      .command(this.usage, this.description)
      .action((regex: string, opts: GlobalCliOptions) => this.run(ctx, opts, regex));
  }
}
