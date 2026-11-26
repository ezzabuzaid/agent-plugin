/** show-command.ts — `show <slug>`: print one memory in full. */

import type { CAC } from 'cac';
import type { CommandContext, GlobalCliOptions, MemoryCommand } from './command.ts';
import { ShowPresenter } from '../reporting/show-presenter.ts';

export class ShowCommand implements MemoryCommand {
  register(cli: CAC, ctx: CommandContext): void {
    cli
      .command('show <slug>', 'Print one memory in full, resolved by frontmatter name or filename slug')
      .action(async (slug: string, opts: GlobalCliOptions) => {
        const memories = await ctx.repository.loadMemories(opts.project);
        process.stdout.write(new ShowPresenter().present(memories, slug) + '\n');
      });
  }
}
