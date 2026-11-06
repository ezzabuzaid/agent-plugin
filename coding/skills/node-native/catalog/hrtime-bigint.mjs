// Nanosecond monotonic time as one bigint, for measuring elapsed time.
import { setTimeout as sleep } from 'node:timers/promises';

// Whether a 5 ms sleep measures as at least 4 ms.
const measuresSleep = async (start, elapsedNs) => {
  const started = start();
  await sleep(5);
  return elapsedNs(started) >= 4e6;
};

export default {
  apis: ['process:process.hrtime.bigint'],
  reviewedAt: 'v26.13.0',
  replaces: {
    // On Node the package exports process.hrtime, the legacy [seconds, nanoseconds] form.
    'browser-process-hrtime@1.0.0': {
      default: {
        native: () => measuresSleep(() => process.hrtime.bigint(), (start) => Number(process.hrtime.bigint() - start)),
        package: ({ default: hrtime }) =>
          measuresSleep(hrtime, (start) => {
            const [seconds, nanoseconds] = hrtime(start);
            return seconds * 1e9 + nanoseconds;
          }),
      },
      'default: shape': {
        gap: 'one bigint of nanoseconds instead of a [seconds, nanoseconds] pair: callers subtract instead of passing the previous reading',
        native: () => typeof process.hrtime.bigint(),
        package: ({ default: hrtime }) => (Array.isArray(hrtime()) ? 'array' : typeof hrtime()),
      },
    },
  },
  idioms: {
    hrtimeTuple: {
      seed: '\\bhrtime\\((?:[\\w$.]+)?\\)',
      native: async () => {
        const start = process.hrtime.bigint();
        await sleep(5);
        return process.hrtime.bigint() - start >= 4_000_000n;
      },
      idiom: async () => {
        const start = process.hrtime();
        await sleep(5);
        const [seconds, nanoseconds] = process.hrtime(start);
        return seconds * 1e9 + nanoseconds >= 4e6;
      },
    },
  },
};
