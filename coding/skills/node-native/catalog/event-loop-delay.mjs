// Event loop delay: how long the loop was held up, sampled into a histogram.
// No probe compares a delay: each blocks the loop for 200 ms and asks whether
// a delay over 100 ms was seen, which every tool reports with room to spare.
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { setImmediate as immediate, setTimeout as sleep } from 'node:timers/promises';

const blockFor = (ms) => {
  const end = performance.now() + ms;
  while (performance.now() < end);
};
const seen = (ms) => ms > 100;

// Blocks the loop inside a timer callback that `scheduleBlock` schedules, so a
// tool that records where an async callback was created can name it.
const scheduleBlock = () => new Promise((resolve) => setTimeout(() => resolve(blockFor(200)), 1));

// Runs `observe` around one 200 ms block, with 30 ms of idle loop either side.
async function aroundBlock(observe) {
  const stop = observe();
  try {
    await sleep(30);
    await scheduleBlock();
    await sleep(30);
  } finally {
    await stop?.();
  }
}

// Whether monitorEventLoopDelay saw the block, and what its data says about where.
async function monitored() {
  const histogram = monitorEventLoopDelay({ resolution: 10 });
  await aroundBlock(() => {
    histogram.enable();
    return () => histogram.disable();
  });
  return { blocked: seen(histogram.max / 1e6), where: JSON.stringify(histogram.toJSON()).includes('scheduleBlock') };
}

// Reads `read` every loop turn for `ms`, keeping the largest value: a tool
// that reports only its latest sample overwrites it on its next check.
async function largest(read, ms) {
  let max = 0;
  const end = performance.now() + ms;
  while (performance.now() < end) {
    max = Math.max(max, read());
    await immediate();
  }
  return max;
}

export default {
  apis: ['perf_hooks:perf_hooks.monitorEventLoopDelay', 'perf_hooks:ELDHistogram extends Histogram'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'event-loop-lag@1.4.0': {
      default: {
        native: async () => (await monitored()).blocked,
        package: async ({ default: eventLoopLag }) => {
          const lag = eventLoopLag(10);
          await sleep(30);
          await scheduleBlock();
          return seen(await largest(lag, 30));
        },
      },
      'default: latest only': {
        gap: 'the histogram keeps every sample (max, mean, percentiles); event-loop-lag returns the last delay it measured, so the block is gone 30 ms later',
        native: async () => (await monitored()).blocked,
        package: async ({ default: eventLoopLag }) => {
          const lag = eventLoopLag(10);
          await sleep(30);
          await scheduleBlock();
          await sleep(30);
          return seen(lag());
        },
      },
    },
    'blocked@1.3.0': {
      default: {
        native: async () => (await monitored()).blocked,
        package: async ({ default: blocked }) => {
          const delays = [];
          let timer;
          await aroundBlock(() => {
            timer = blocked((ms) => delays.push(ms), { threshold: 50, interval: 10 });
            return () => clearInterval(timer);
          });
          return delays.some(seen);
        },
      },
    },
    'blocked-at@1.2.0': {
      default: {
        native: async () => (await monitored()).blocked,
        package: async ({ default: blockedAt }) => {
          const reports = [];
          await aroundBlock(() => blockedAt((ms, stack) => reports.push({ ms, stack }), { threshold: 50 }).stop);
          return reports.some((report) => seen(report.ms));
        },
      },
      'default: stack': {
        gap: 'no location: the histogram holds delays only; blocked-at reports the stack that created the blocking callback',
        native: async () => (await monitored()).where,
        package: async ({ default: blockedAt }) => {
          const reports = [];
          await aroundBlock(() => blockedAt((ms, stack) => reports.push({ ms, stack }), { threshold: 50 }).stop);
          return reports.some((report) => report.stack.some((frame) => frame.includes('scheduleBlock')));
        },
      },
    },
  },
};
