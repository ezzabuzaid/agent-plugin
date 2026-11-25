// The plugin installs from git, with no node_modules, so the skill ships automations.ts and its
// dependencies as one file. ../references/RULINGS.md says why.
import { build, type BuildOptions } from 'esbuild';

export const options = {
  entryPoints: [new URL('./automations.ts', import.meta.url).pathname],
  outfile: new URL('./dist/automations.mjs', import.meta.url).pathname,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node26',
  // yaml, plist and @xmldom/xmldom are CommonJS and require Node built-ins, which an ES module can do only
  // through createRequire.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
} satisfies BuildOptions;

if (import.meta.main) await build(options);
