// Logging how long a labelled piece of work took.
import { Console } from 'node:console';
import { Writable } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';

// The lines `run` logs through the Console it is given, with every number
// replaced by N: durations differ between runs, the line shape does not.
async function logged(run) {
  let text = '';
  const stdout = new Writable({
    write(chunk, encoding, done) {
      text += chunk;
      done();
    },
  });
  await run(new Console({ stdout, colorMode: false }));
  return text.replaceAll(/\d+(?:\.\d+)?/g, 'N').trimEnd().split('\n');
}

export default {
  apis: ['console:console.time', 'console:console.timeEnd', 'console:console.timeLog'],
  reviewedAt: 'v26.13.0',
  idioms: {
    logElapsed: {
      seed: 'console\\.\\w+\\([^;]*Date\\.now\\(\\)\\s*-',
      native: () =>
        logged(async (console) => {
          console.time('parse');
          await sleep(5);
          console.timeEnd('parse');
        }),
      idiom: () =>
        logged(async (console) => {
          const start = Date.now();
          await sleep(5);
          console.log(`parse: ${Date.now() - start}ms`);
        }),
    },
    logElapsedSteps: {
      native: () =>
        logged(async (console) => {
          console.time('parse');
          await sleep(5);
          console.timeLog('parse', 'read');
          await sleep(5);
          console.timeEnd('parse');
        }),
      idiom: () =>
        logged(async (console) => {
          const start = Date.now();
          await sleep(5);
          console.log(`parse: ${Date.now() - start}ms`, 'read');
          await sleep(5);
          console.log(`parse: ${Date.now() - start}ms`);
        }),
    },
  },
};
