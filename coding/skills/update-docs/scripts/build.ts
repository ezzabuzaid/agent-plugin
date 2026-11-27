// The plugin installs from git, with no node_modules, so the skill ships src/main.ts and its
// dependencies as one file. Copied from coding/skills/automations/scripts/build.ts (see copied.md).
import { build, type BuildOptions } from 'esbuild';

export const options = {
  entryPoints: [new URL('./src/main.ts', import.meta.url).pathname],
  outfile: new URL('./dist/update-docs.mjs', import.meta.url).pathname,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node26',
  // @alwaysmeticulous/agent-traces, under @deepagents/trajectory, is CommonJS and requires Node
  // built-ins, which an ES module can do only through createRequire.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
} satisfies BuildOptions;

if (import.meta.main) await build(options);
