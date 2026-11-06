// A monotonic clock in fractional milliseconds since the process started, and
// named marks and measures on it, for timing code.
import { mock } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

// Whether `read` counts from the same zero as performance.now(): two reads in
// a row differ by microseconds, two clocks with other zeros by far more.
const sameOrigin = (read) => Math.abs(read() - performance.now()) < 1;

// Whether `read` measures a 5 ms sleep as at least 4 ms and well under a second.
const measuresSleep = async (read) => {
  const start = read();
  await sleep(5);
  const elapsed = read() - start;
  return elapsed >= 4 && elapsed < 1000;
};

// Runs `run` while the wall clock jumps back six seconds halfway through, as an
// NTP correction or a manual clock change does.
async function clockJumpsBack(run) {
  mock.timers.enable({ apis: ['Date'], now: 10_000 });
  try {
    return await run(() => mock.timers.setTime(4_000));
  } finally {
    mock.timers.reset();
  }
}

export default {
  apis: ['perf_hooks:performance.now', 'perf_hooks:performance.mark', 'perf_hooks:performance.measure'],
  reviewedAt: 'v26.13.0',
  replaces: {
    // On a runtime with a global performance, the package returns performance.now().
    'performance-now@2.1.0': {
      default: {
        native: () => sameOrigin(() => performance.now()),
        package: ({ default: now }) => sameOrigin(now),
      },
    },
    'present@1.0.0': {
      default: {
        native: () => measuresSleep(() => performance.now()),
        package: ({ default: present }) => measuresSleep(present),
      },
      'default: origin': {
        gap: 'present counts from the arbitrary zero of process.hrtime(); performance.now() counts from process start (performance.timeOrigin)',
        native: () => sameOrigin(() => performance.now()),
        package: ({ default: present }) => sameOrigin(present),
      },
    },
  },
  idioms: {
    dateNowElapsed: {
      // `Date.now() - started`; not a cutoff time such as `Date.now() - TTL_MS`,
      // `Date.now() - 24 * HOUR` or `Date.now() - maxAgeMinutes * 60_000`.
      seed: '(?<!console\\.\\w+\\([^;]*)Date\\.now\\(\\)\\s*-\\s*(?![A-Z][A-Z0-9_]*\\b|\\d)[\\w$.]+(?![\\w$.]|\\s*\\*)',
      native: async () => {
        performance.mark('task:start');
        await sleep(5);
        const { duration } = performance.measure('task', 'task:start');
        performance.clearMarks('task:start');
        performance.clearMeasures('task');
        return duration >= 4 && duration < 1000;
      },
      idiom: async () => {
        const start = Date.now();
        await sleep(5);
        const elapsed = Date.now() - start;
        return elapsed >= 4 && elapsed < 1000;
      },
    },
    dateNowElapsedClockChange: {
      improves: 'performance.now() is monotonic, so an elapsed time stays right when the wall clock is set back; Date.now() follows the wall clock, and the elapsed time comes out negative',
      native: () =>
        clockJumpsBack(async (setBack) => {
          const start = performance.now();
          setBack();
          return performance.now() - start >= 0;
        }),
      idiom: () =>
        clockJumpsBack(async (setBack) => {
          const start = Date.now();
          setBack();
          return Date.now() - start >= 0;
        }),
    },
  },
};
