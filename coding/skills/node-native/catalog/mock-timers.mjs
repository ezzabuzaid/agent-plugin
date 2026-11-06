// Fake timers and a fake clock: fire setTimeout/setInterval/setImmediate on
// demand and set what Date reports, without waiting.
import { mock } from 'node:test';

// Runs `body` with node:test's timers mocked; disposing the timers resets them.
const mocked = async (options, body) => {
  using timers = mock.timers;
  timers.enable(options);
  return await body(timers);
};
// The same, with a @sinonjs/fake-timers clock, uninstalled afterwards.
const faked = async (install, options, body) => {
  const clock = install(options);
  try {
    return await body(clock);
  } finally {
    clock.uninstall();
  }
};
// Schedules three timers and an interval, and records what fires.
const schedule = (fired) => {
  setTimeout(() => fired.push('timeout 100'), 100);
  setTimeout(() => fired.push('timeout 50'), 50);
  const interval = setInterval(() => fired.push('interval'), 40);
  setTimeout(() => clearInterval(interval), 130);
};
const all = ['setTimeout', 'setInterval', 'Date'];
// fake-timers fakes only the functions it is given; mock.timers fakes each clear function with its timer.
const allFaked = [...all, 'clearTimeout', 'clearInterval'];

const nativeTick = () =>
  mocked({ apis: all, now: 0 }, (timers) => {
    const fired = [];
    schedule(fired);
    timers.tick(60);
    const early = [...fired];
    timers.tick(60);
    return { early, fired, now: Date.now() };
  });
const nativeRunAll = () =>
  mocked({ apis: all, now: 0 }, (timers) => {
    const fired = [];
    schedule(fired);
    timers.runAll();
    return { fired, now: Date.now() };
  });
const nativeSetTime = () =>
  mocked({ apis: all, now: 0 }, (timers) => {
    const fired = [];
    setTimeout(() => fired.push('fired'), 100);
    timers.setTime(5000);
    return { now: Date.now(), date: new Date().toISOString(), fired };
  });
const nativeNow = () => mocked({ apis: ['Date'], now: 1000 }, () => [Date.now(), new Date().getTime()]);

// Rows for a package whose `install(module)` gives a fake-timers install function.
const fakeTimerRows = (installer) => ({
  tick: {
    native: nativeTick,
    package: (module) =>
      faked(installer(module), { now: 0, toFake: allFaked }, (clock) => {
        const fired = [];
        schedule(fired);
        clock.tick(60);
        const early = [...fired];
        clock.tick(60);
        return { early, fired, now: Date.now() };
      }),
  },
  runAll: {
    native: nativeRunAll,
    package: (module) =>
      faked(installer(module), { now: 0, toFake: allFaked }, (clock) => {
        const fired = [];
        schedule(fired);
        clock.runAll();
        return { fired, now: Date.now() };
      }),
  },
  setSystemTime: {
    native: nativeSetTime,
    package: (module) =>
      faked(installer(module), { now: 0, toFake: allFaked }, (clock) => {
        const fired = [];
        setTimeout(() => fired.push('fired'), 100);
        clock.setSystemTime(5000);
        return { now: Date.now(), date: new Date().toISOString(), fired };
      }),
  },
  now: {
    native: nativeNow,
    package: (module) => faked(installer(module), { now: 1000, toFake: ['Date'] }, () => [Date.now(), new Date().getTime()]),
  },
  'performance.now': {
    gap: 'mock.timers leaves performance.now on the real clock; fake-timers advances it with the fake clock',
    native: () =>
      mocked({ apis: all, now: 0 }, (timers) => {
        const before = performance.now();
        timers.tick(10_000);
        return performance.now() - before >= 10_000;
      }),
    package: (module) =>
      faked(installer(module), { now: 0, toFake: [...allFaked, 'performance'] }, (clock) => {
        const before = performance.now();
        clock.tick(10_000);
        return performance.now() - before >= 10_000;
      }),
  },
  'Date inside a callback': {
    gap: 'during tick(), a callback reads Date at the end of the tick; fake-timers gives it the time the timer was due',
    native: () =>
      mocked({ apis: all, now: 0 }, (timers) => {
        const seen = [];
        setTimeout(() => seen.push(Date.now()), 40);
        timers.tick(60);
        return seen;
      }),
    package: (module) =>
      faked(installer(module), { now: 0, toFake: allFaked }, (clock) => {
        const seen = [];
        setTimeout(() => seen.push(Date.now()), 40);
        clock.tick(60);
        return seen;
      }),
  },
});

// The member's own row is the tick case; every other case is keyed `<member>: <case>`.
const rows = (member, installer) => {
  const { tick, ...cases } = fakeTimerRows(installer);
  return {
    [member]: tick,
    ...Object.fromEntries(Object.entries(cases).map(([name, row]) => [`${member}: ${name}`, row])),
  };
};

export default {
  apis: [
    'test:MockTimers',
    'test:timers.enable',
    'test:timers.tick',
    'test:timers.runAll',
    'test:timers.setTime',
    'test:timers.reset',
    'test:timers[Symbol.dispose]',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    '@sinonjs/fake-timers@15.4.0': rows('install', ({ install }) => install),
    'sinon@22.1.0': rows('useFakeTimers', ({ default: sinon }) => (options) => sinon.useFakeTimers(options)),
  },
  idioms: {
    patchDateNow: {
      seed: 'Date\\.now\\s*=\\s*(\\(\\)\\s*=>|function)',
      native: () => mocked({ apis: ['Date'], now: 1000 }, () => Date.now()),
      idiom: () => {
        const real = Date.now;
        Date.now = () => 1000;
        try {
          return Date.now();
        } finally {
          Date.now = real;
        }
      },
    },
    'patchDateNow: new Date': {
      seed: 'Date\\.now\\s*=\\s*(\\(\\)\\s*=>|function)',
      gap: 'patching Date.now leaves new Date() on the real clock; mock.timers moves both',
      native: () => mocked({ apis: ['Date'], now: 1000 }, () => new Date().getTime()),
      idiom: () => {
        const real = Date.now;
        Date.now = () => 1000;
        try {
          return new Date().getTime();
        } finally {
          Date.now = real;
        }
      },
    },
    realWaitInTest: {
      seed: 'await new Promise\\(\\s*\\(?\\s*(\\w+)\\s*\\)?\\s*=>\\s*\\{?\\s*setTimeout\\(\\s*\\1\\s*,',
      native: () =>
        mocked({ apis: ['setTimeout'] }, (timers) => {
          const fired = [];
          setTimeout(() => fired.push('debounced'), 30);
          timers.tick(30);
          return fired;
        }),
      idiom: async () => {
        const fired = [];
        setTimeout(() => fired.push('debounced'), 30);
        await new Promise((resolve) => setTimeout(resolve, 40));
        return fired;
      },
    },
  },
};
