// Running async work under a named lock, one holder at a time.
import { locks } from 'node:worker_threads';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Starts tasks that each take `ms` under `run`, and returns the order in which
// they started and ended.
async function order(run, durations = [20, 5]) {
  const log = [];
  await Promise.all(
    durations.map((ms, index) =>
      run(async () => {
        log.push(`start ${index}`);
        await wait(ms);
        log.push(`end ${index}`);
      }),
    ),
  );
  return log;
}

// Holds `name` for 50 ms while `attempt` runs.
async function whileHeld(name, attempt) {
  const held = locks.request(name, () => wait(50));
  try {
    return await attempt();
  } finally {
    await held;
  }
}

export default {
  apis: ['worker_threads:locks.request'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'async-mutex@0.5.0': {
      Mutex: {
        native: () => order((task) => locks.request('probe-mutex', task)),
        package: ({ Mutex }) => {
          const mutex = new Mutex();
          return order((task) => mutex.runExclusive(task));
        },
      },
      tryAcquire: {
        native: () => whileHeld('probe-try', () => locks.request('probe-try', { ifAvailable: true }, (lock) => (lock ? 'ran' : 'locked'))),
        package: async ({ Mutex, tryAcquire, E_ALREADY_LOCKED }) => {
          const mutex = new Mutex();
          const release = await mutex.acquire();
          try {
            return await tryAcquire(mutex)
              .runExclusive(() => 'ran')
              .catch((error) => (error === E_ALREADY_LOCKED ? 'locked' : Promise.reject(error)));
          } finally {
            release();
          }
        },
      },
      withTimeout: {
        native: () =>
          whileHeld('probe-timeout', () =>
            locks
              .request('probe-timeout', { signal: AbortSignal.timeout(20) }, () => 'ran')
              .catch((error) => (error.name === 'TimeoutError' ? 'timed out' : Promise.reject(error))),
          ),
        package: async ({ Mutex, withTimeout, E_TIMEOUT }) => {
          const mutex = withTimeout(new Mutex(), 20);
          const release = await mutex.acquire();
          try {
            return await mutex
              .runExclusive(() => 'ran')
              .catch((error) => (error === E_TIMEOUT ? 'timed out' : Promise.reject(error)));
          } finally {
            release();
          }
        },
      },
      Semaphore: {
        gap: 'no counted locks: a shared lock admits every holder, a Semaphore(2) only two',
        native: () => order((task) => locks.request('probe-shared', { mode: 'shared' }, task), [20, 20, 5]),
        package: ({ Semaphore }) => {
          const semaphore = new Semaphore(2);
          return order((task) => semaphore.runExclusive(task), [20, 20, 5]);
        },
      },
    },
  },
};
