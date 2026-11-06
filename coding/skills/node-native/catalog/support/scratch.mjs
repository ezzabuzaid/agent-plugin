// Runs a probe inside a fresh temporary directory, removed afterwards.
// `files` seeds it ({ 'src/a.js': 'content' }); `run` gets the directory's real
// path, the form packages that call realpath report (/private/var/… on macOS).
// Anything else a probe needs (a symlink, a second tree) it makes inside `run`.
//
// Shared probe code lives in catalog/support/: readCatalog reads only the
// catalog directory's own files, so nothing here is ever taken for an entry.
import { mkdir, mkdtempDisposable, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export async function inScratch(files, run) {
  await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-scratch-'));
  const dir = await realpath(scratch.path);
  for (const [file, content] of Object.entries(files)) {
    await mkdir(join(dir, dirname(file)), { recursive: true });
    await writeFile(join(dir, file), content);
  }
  return await run(dir);
}
