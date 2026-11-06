// Benchmark runner: declared benchmarks, measured samples and their summary
// statistics. Timings never compare: every probe records fixed durations
// (context.record, tinybench's overriddenDuration, a mitata clock that the task
// advances), so the statistics are exact.

// node:bench loads only under --experimental-bench (the entry's flag), so it
// is imported inside the probes, never when the catalog is read.
const nodeBench = () => import('node:bench');

// Milliseconds per sample, in invocation order.
const durations = [4, 1, 2];
const sorted = (values) => [...values].sort((a, b) => a - b);
const round = (value) => Math.round(value * 100) / 100;

// Runs one benchmark per name with node:bench: 3 samples, no warmup, each
// sample recorded with the next fixed duration. Returns each bench:complete.
async function benchNative(names, { hooks = {} } = {}) {
  const { createRunner } = await nodeBench();
  const runner = createRunner({ yieldBetweenSamples: false });
  for (const [hook, fn] of Object.entries(hooks)) runner[hook](fn);
  for (const name of names) {
    runner.bench(name, { samples: 3, warmup: 0 }, (b) => {
      b.record({ operations: 1, duration_ns: BigInt(durations[b.index] * 1e6) });
    });
  }
  const results = [];
  for await (const { type, data } of runner.run()) if (type === 'bench:complete') results.push(data);
  return results;
}

// The same plan with tinybench: 3 iterations, no time budget, no warmup.
// tinybench calls a task once, unsampled, to learn whether it is async: the
// plan starts with that call.
async function benchTiny(Bench, names, { fnOptions } = {}) {
  const bench = new Bench({ iterations: 3, time: 0, warmup: false, retainSamples: true });
  for (const name of names) {
    const plan = [0, ...durations];
    let call = 0;
    bench.add(name, () => ({ overriddenDuration: plan[call++] }), fnOptions);
  }
  await bench.run();
  return bench.tasks.map((task) => ({ name: task.name, ...task.result }));
}

// mitata times the task with the `now` it is given: the task moves that clock
// by the next duration, in nanoseconds. Its first call is an unsampled warmup
// that reads the real clock, so the plan starts with a zero step.
async function measureMitata(measure) {
  const plan = [0, ...durations];
  let clock = 0;
  let call = 0;
  return measure(() => {
    clock += plan[call++] * 1e6;
  }, { now: () => clock, min_samples: 3, max_samples: 3, warmup_samples: 0, min_cpu_time: 0 });
}


export default {
  apis: [
    'bench:createRunner',
    'bench:bench',
    'bench:suite',
    'bench:beforeEach',
    'bench:run',
    'bench:context.record',
    'cli:--experimental-bench',
  ],
  reviewedAt: 'v26.13.0',
  flags: ['--experimental-bench'],
  replaces: {
    'tinybench@6.2.3': {
      'Bench: task names': {
        native: async () => (await benchNative(['parse', 'stringify'])).map((result) => result.name),
        package: async ({ Bench }) => (await benchTiny(Bench, ['parse', 'stringify'])).map((task) => task.name),
      },
      'Bench: sample count': {
        native: async () => (await benchNative(['task']))[0].samples.length,
        package: async ({ Bench }) => (await benchTiny(Bench, ['task']))[0].throughput.samplesCount,
      },
      'Bench: throughput': {
        native: async () => {
          const { summary } = (await benchNative(['task']))[0];
          return { mean: summary.mean, median: summary.median, min: summary.min, max: summary.max };
        },
        package: async ({ Bench }) => {
          const { throughput } = (await benchTiny(Bench, ['task']))[0];
          return { mean: throughput.mean, median: throughput.p50, min: throughput.min, max: throughput.max };
        },
      },
      'Bench: throughput samples': {
        native: async () => sorted((await benchNative(['task']))[0].samples.map((sample) => sample.rate)),
        package: async ({ Bench }) => [...(await benchTiny(Bench, ['task']))[0].throughput.samples],
      },
      'Bench: latency samples': {
        native: async () => sorted((await benchNative(['task']))[0].samples.map((sample) => Number(sample.duration_ns) / 1e6)),
        package: async ({ Bench }) => [...(await benchTiny(Bench, ['task']))[0].latency.samples],
      },
      // Both use Student's t on the sample standard error; the critical
      // values differ past the third decimal.
      'Bench: confidence interval': {
        native: async () => {
          const { confidenceInterval } = (await benchNative(['task']))[0].summary;
          return [round(confidenceInterval.lower), round(confidenceInterval.upper)];
        },
        package: async ({ Bench }) => {
          const { mean, moe } = (await benchTiny(Bench, ['task']))[0].throughput;
          return [round(mean - moe), round(mean + moe)];
        },
      },
      'Bench: standard deviation': {
        gap: 'summary.stddev is the population standard deviation (311.8 for rates 250, 500, 1000); tinybench sd is the sample one (381.9)',
        native: async () => (await benchNative(['task']))[0].summary.stddev,
        package: async ({ Bench }) => (await benchTiny(Bench, ['task']))[0].throughput.sd,
      },
      'Bench: percentiles': {
        gap: 'the summary has no p75, p99, p995 or p999; tinybench reports them',
        native: async () => {
          const { summary } = (await benchNative(['task']))[0];
          return [summary.p75, summary.p99, summary.p995, summary.p999];
        },
        package: async ({ Bench }) => {
          const { throughput } = (await benchTiny(Bench, ['task']))[0];
          return [throughput.p75, throughput.p99, throughput.p995, throughput.p999];
        },
      },
      'Bench: latency statistics': {
        gap: 'the summary describes rates (ops/s) only; tinybench also summarises latency (mean 2.33 ms per operation)',
        native: async () => (await benchNative(['task']))[0].summary.mean,
        package: async ({ Bench }) => (await benchTiny(Bench, ['task']))[0].latency.mean,
      },
      // A beforeEach of node:bench runs once per benchmark, as tinybench's beforeAll does per task.
      'Bench: beforeAll': {
        native: async () => {
          let calls = 0;
          await benchNative(['parse', 'stringify'], { hooks: { beforeEach: () => calls++ } });
          return calls;
        },
        package: async ({ Bench }) => {
          let calls = 0;
          await benchTiny(Bench, ['parse', 'stringify'], { fnOptions: { beforeAll: () => calls++ } });
          return calls;
        },
      },
      'Bench: beforeEach': {
        gap: 'no hook per sample: beforeEach runs once per benchmark; per-sample setup goes in the benchmark function before start()',
        native: async () => {
          let calls = 0;
          await benchNative(['task'], { hooks: { beforeEach: () => calls++ } });
          return calls;
        },
        package: async ({ Bench }) => {
          let calls = 0;
          await benchTiny(Bench, ['task'], { fnOptions: { beforeEach: () => calls++ } });
          return calls;
        },
      },
      'Bench: time budget': {
        gap: 'no time budget: a benchmark takes its fixed `samples` count; tinybench keeps sampling until `time` ms pass',
        native: async () => {
          const { createRunner } = await nodeBench();
          const runner = createRunner({ yieldBetweenSamples: false });
          runner.bench('task', { samples: 1, warmup: 0 }, (b) => {
            b.start();
            b.end(1);
          });
          for await (const { type, data } of runner.run()) if (type === 'bench:complete') return data.samples.length > 1;
        },
        package: async ({ Bench }) => {
          const bench = new Bench({ iterations: 1, time: 20, warmup: false });
          bench.add('task', () => {});
          await bench.run();
          return bench.tasks[0].result.latency.samplesCount > 1;
        },
      },
    },
    'mitata@1.0.34': {
      'measure: samples': {
        native: async () => sorted((await benchNative(['task']))[0].samples.map((sample) => Number(sample.duration_ns))),
        package: async ({ measure }) => (await measureMitata(measure)).samples,
      },
      'measure: sample count': {
        native: async () => (await benchNative(['task']))[0].samples.length,
        package: async ({ measure }) => (await measureMitata(measure)).ticks,
      },
      // The fastest sample has the highest rate: latency min and max are 1e9 / rate max and min.
      'measure: min and max': {
        native: async () => {
          const { summary } = (await benchNative(['task']))[0];
          return { min: 1e9 / summary.max, max: 1e9 / summary.min };
        },
        package: async ({ measure }) => {
          const { min, max } = await measureMitata(measure);
          return { min, max };
        },
      },
      'measure: avg': {
        gap: 'summary.mean is the mean of the rates, so 1e9 / mean (1.71 ms) is not the mean latency that mitata reports as avg (2.33 ms)',
        native: async () => 1e9 / (await benchNative(['task']))[0].summary.mean,
        package: async ({ measure }) => (await measureMitata(measure)).avg,
      },
      'measure: percentiles': {
        gap: 'the summary has no p25, p75, p99 or p999; mitata reports them',
        native: async () => {
          const { summary } = (await benchNative(['task']))[0];
          return [summary.p25, summary.p75, summary.p99, summary.p999];
        },
        package: async ({ measure }) => {
          const stats = await measureMitata(measure);
          return [stats.p25, stats.p75, stats.p99, stats.p999];
        },
      },
      'measure: sample order': {
        gap: 'samples stay in invocation order (4, 1, 2 ms), so a warmup trend shows; mitata sorts them',
        native: async () => (await benchNative(['task']))[0].samples.map((sample) => Number(sample.duration_ns)),
        package: async ({ measure }) => (await measureMitata(measure)).samples,
      },
    },
    'benchmark@2.1.4': {
      'Suite: names': {
        native: async () => (await benchNative(['parse', 'stringify'])).map((result) => result.name),
        package: async ({ default: Benchmark }) => {
          const suite = new Benchmark.Suite();
          const options = { minSamples: 3, maxTime: 0 };
          suite.add('parse', () => {}, options).add('stringify', () => {}, options);
          await new Promise((resolve) => suite.on('complete', resolve).run({ async: false }));
          return suite.map((benchmark) => benchmark.name);
        },
      },
      'Suite: sample count': {
        native: async () => (await benchNative(['task']))[0].samples.length,
        package: async ({ default: Benchmark }) => {
          const suite = new Benchmark.Suite();
          suite.add('task', () => {}, { minSamples: 3, maxTime: 0 });
          await new Promise((resolve) => suite.on('complete', resolve).run({ async: false }));
          return suite[0].stats.sample.length;
        },
      },
      'Suite: maxTime': {
        gap: 'no time budget: a benchmark takes its fixed `samples` count; benchmark.js samples until maxTime seconds pass',
        native: async () => (await benchNative(['task']))[0].samples.length > 3,
        package: async ({ default: Benchmark }) => {
          const suite = new Benchmark.Suite();
          suite.add('task', () => {}, { minSamples: 3, maxTime: 0.3 });
          await new Promise((resolve) => suite.on('complete', resolve).run({ async: false }));
          return suite[0].stats.sample.length > 3;
        },
      },
    },
  },
};
