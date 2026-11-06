// Running cleanup code when the process exits, also when a signal ends it.
import { join } from 'node:path';
import { run } from './support/child.mjs';
import { inScratch } from './support/scratch.mjs';

// Runs `source` as an ES module in a child of this Node and reports what the
// child printed and how it ended. Handlers print with writeSync: a write to a
// pipe from an exit handler is lost on macOS.
const exited = (source) =>
  inScratch({ 'main.mjs': `import { writeSync } from 'node:fs';\n${source}` }, async (dir) => {
    const { stdout, code, signal } = await run([join(dir, 'main.mjs')]);
    return { stdout, code, signal };
  });

// The interval keeps the child alive until the signal arrives.
const killSelf = "setInterval(() => {}, 1000); setTimeout(() => process.kill(process.pid, 'SIGTERM'), 10);";
const flush = "await new Promise((resolve) => setTimeout(resolve, 10)); writeSync(1, 'flushed');";

export default {
  apis: ['process:Process'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'signal-exit@4.1.0': {
      onExit: {
        native: () => exited("process.on('exit', (code) => writeSync(1, `exit ${code}`)); process.exitCode = 3;"),
        package: (_module, { url }) =>
          exited(`import { onExit } from '${url}';
onExit((code) => { writeSync(1, \`exit \${code}\`); });
process.exitCode = 3;`),
      },
      'onExit: killed by SIGTERM': {
        gap: "the 'exit' event does not fire when a signal kills the process",
        native: () => exited(`process.on('exit', (code) => writeSync(1, \`exit \${code}\`)); ${killSelf}`),
        package: (_module, { url }) =>
          exited(`import { onExit } from '${url}';
onExit((code, signal) => { writeSync(1, \`exit \${code} \${signal}\`); });
${killSelf}`),
      },
      'onExit: killed by SIGTERM, with a signal listener': {
        native: () =>
          exited(`process.once('SIGTERM', (signal) => {
  writeSync(1, \`exit null \${signal}\`);
  process.kill(process.pid, signal);
});
${killSelf}`),
        package: (_module, { url }) =>
          exited(`import { onExit } from '${url}';
onExit((code, signal) => { writeSync(1, \`exit \${code} \${signal}\`); });
${killSelf}`),
      },
    },
    'exit-hook@5.1.0': {
      default: {
        native: () => exited("process.on('exit', (code) => writeSync(1, `exit ${code}`)); process.exitCode = 3;"),
        package: (_module, { url }) =>
          exited(`import exitHook from '${url}';
exitHook((code) => { writeSync(1, \`exit \${code}\`); });
process.exitCode = 3;`),
      },
      asyncExitHook: {
        native: () => exited(`process.once('beforeExit', async () => { ${flush} });`),
        package: (_module, { url }) =>
          exited(`import { asyncExitHook } from '${url}';
asyncExitHook(async () => { ${flush} }, { wait: 500 });`),
      },
      'asyncExitHook: killed by SIGTERM': {
        gap: "'beforeExit' does not fire when a signal ends the process; exit-hook runs the hook, then exits 143",
        native: () => exited(`process.once('beforeExit', async () => { ${flush} }); ${killSelf}`),
        package: (_module, { url }) =>
          exited(`import { asyncExitHook } from '${url}';
asyncExitHook(async () => { ${flush} }, { wait: 500 });
${killSelf}`),
      },
    },
  },
};
