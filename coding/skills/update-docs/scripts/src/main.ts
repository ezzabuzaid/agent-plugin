import { homedir } from 'node:os';

import { NotInRepository, UpdateDocsError } from './errors.ts';
import { Git, GitFailed } from './git.ts';
import { UpdateDocs } from './update-docs.ts';

try {
  const { exitCode, stdout } = await new UpdateDocs({
    home: process.env.HOME ?? homedir(),
    repoRoot: await repositoryRoot(),
    variables: process.env,
  }).run(process.argv.slice(2));
  process.stdout.write(stdout);
  process.exitCode = exitCode;
} catch (error) {
  if (!(error instanceof UpdateDocsError)) {
    throw error;
  }
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
}

/**
 * The top level of the repository, so a run started in a folder inside it
 * keeps the same state as one started at the root. git exits 128 outside a
 * repository, which is the caller's fault, not the tool's.
 */
async function repositoryRoot(): Promise<string> {
  try {
    return (
      await new Git(process.cwd(), process.env).run([
        'rev-parse',
        '--show-toplevel',
      ])
    ).trim();
  } catch (error) {
    if (error instanceof GitFailed && error.exitCode === 128) {
      throw new NotInRepository(process.cwd());
    }
    throw error;
  }
}
