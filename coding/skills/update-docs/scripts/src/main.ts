import { homedir } from 'node:os';

import { UpdateDocsError } from './errors.ts';
import { Git } from './git.ts';
import { UpdateDocs } from './update-docs.ts';

try {
  // The top level of the repo, so a run started in a folder inside it keeps
  // the same state as one started at the root.
  const repoRoot = (
    await new Git(process.cwd(), process.env).run([
      'rev-parse',
      '--show-toplevel',
    ])
  ).trim();
  const { exitCode, stdout } = await new UpdateDocs({
    home: process.env.HOME ?? homedir(),
    repoRoot,
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
