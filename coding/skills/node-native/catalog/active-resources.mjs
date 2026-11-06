// Listing what keeps the event loop alive: open handles and pending requests.
import { join } from 'node:path';
import { output } from './support/child.mjs';
import { inScratch } from './support/scratch.mjs';

// A program that holds a timer and a listening server open, runs `report`,
// and prints the JSON of what it collected. It runs in its own process, so
// nothing of the probe's own process is listed; `prelude` runs first.
const program = (prelude, report) => `${prelude}
import { createServer } from 'node:net';
const timer = setInterval(() => {}, 1000);
const server = createServer().listen(0, '127.0.0.1');
await new Promise((resolve) => server.on('listening', resolve));
const collected = ${report};
clearInterval(timer);
server.close();
console.log(JSON.stringify(collected));
`;
const run = (source) =>
  inScratch({ 'program.mjs': source }, async (dir) => {
    return JSON.parse(await output([join(dir, 'program.mjs')]));
  });

const nativeReport = () => run(program('', 'process.getActiveResourcesInfo()'));
const packageReport = (url) =>
  run(
    program(
      `const { default: whyIsNodeRunning } = await import(${JSON.stringify(url)});`,
      '(() => { const lines = []; whyIsNodeRunning({ error: (line) => lines.push(line) }); return lines; })()',
    ),
  );

// Resource types named in either report, upper-cased (async_hooks spells them
// TCPSERVERWRAP, getActiveResourcesInfo TCPServerWrap), of the two the program holds.
const held = ['TIMEOUT', 'TCPSERVERWRAP'];
const typesOf = (names) => held.filter((type) => names.some((name) => name.toUpperCase() === type)).sort();

export default {
  apis: ['process:process.getActiveResourcesInfo'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'why-is-node-running@3.2.3': {
      default: {
        native: async () => typesOf(await nativeReport()),
        package: async (module, { url }) =>
          typesOf((await packageReport(url)).filter((line) => line.startsWith('# ')).map((line) => line.slice(2))),
      },
      'default: creation site': {
        gap: 'the list names resource types only; why-is-node-running prints the file, line and source that created each one',
        native: async () => (await nativeReport()).some((name) => name.includes('program.mjs')),
        package: async (module, { url }) => (await packageReport(url)).some((line) => line.includes('program.mjs:')),
      },
    },
  },
};
