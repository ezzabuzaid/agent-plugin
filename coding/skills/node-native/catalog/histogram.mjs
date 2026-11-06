// HDR histograms of recorded values: count, mean, deviation, percentiles,
// merging, coordinated-omission correction and serialisation.
import { createHistogram, importHistogram } from 'node:perf_hooks';

const values = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 1000, 123456];
const percentiles = [25, 50, 75, 90, 99, 99.9, 100];
// `values` as hdr-histogram-js encodeIntoCompressedBase64 writes them: the
// compressed encoding HdrHistogram ports share.
const hdrEncoded = 'HISTFAAAADV4nJNpmSzMwMAgAcSMQMzMAAGMEPL/fzifiYmJgYmZiZ2Jl0mcSZ3JkWk2H9P+PCYAp2IF6A==';

const recorded = (list = values) => {
  const histogram = createHistogram();
  for (const value of list) histogram.record(value);
  return histogram;
};
const built = (build, list = values) => {
  const histogram = build();
  for (const value of list) histogram.recordValue(value);
  return histogram;
};

const statsOf = (histogram) => ({
  count: histogram.count,
  min: histogram.min,
  mean: histogram.mean,
  stddev: histogram.stddev,
  percentiles: percentiles.map((percentile) => histogram.percentile(percentile)),
});
const hdrStatsOf = (histogram) => ({
  count: histogram.totalCount,
  min: histogram.minNonZeroValue,
  mean: histogram.mean,
  stddev: histogram.stdDeviation,
  percentiles: percentiles.map((percentile) => histogram.getValueAtPercentile(percentile)),
});

export default {
  apis: [
    'perf_hooks:perf_hooks.createHistogram',
    'perf_hooks:RecordableHistogram extends Histogram',
    'perf_hooks:histogram.record',
    'perf_hooks:histogram.recordCorrected',
    'perf_hooks:histogram.percentile',
    'perf_hooks:histogram.add',
    'perf_hooks:histogram.subtract',
    'perf_hooks:histogram.reset',
    'perf_hooks:histogram.export',
    'perf_hooks:perf_hooks.importHistogram',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'hdr-histogram-js@3.0.1': {
      build: {
        native: () => statsOf(recorded()),
        package: ({ build }) => hdrStatsOf(built(build)),
      },
      'build: maxValue': {
        gap: 'max is the highest value equivalent to the largest recorded one (123519 for 123456); hdr-histogram-js maxValue is the value itself',
        native: () => recorded().max,
        package: ({ build }) => built(build).maxValue,
      },
      'build: percentile rank': {
        gap: 'percentile(90) of 1, 2, 3, 5, 8, 13 is 8; hdr-histogram-js returns 13: the two pick a different rank for one percentile',
        native: () => recorded(values.slice(0, 6)).percentile(90),
        package: ({ build }) => built(build, values.slice(0, 6)).getValueAtPercentile(90),
      },
      'build: recordValueWithCount': {
        gap: 'record() takes one value: recording a value n times takes n calls',
        native: () => {
          const histogram = createHistogram();
          histogram.record(5, 3);
          return histogram.count;
        },
        package: ({ build }) => {
          const histogram = build();
          histogram.recordValueWithCount(5, 3);
          return histogram.totalCount;
        },
      },
      'build: recordValueWithExpectedInterval': {
        native: () => {
          const histogram = createHistogram();
          histogram.recordCorrected(100, 10);
          return statsOf(histogram);
        },
        package: ({ build }) => {
          const histogram = build();
          histogram.recordValueWithExpectedInterval(100, 10);
          return hdrStatsOf(histogram);
        },
      },
      'build: add': {
        native: () => {
          const histogram = recorded(values.slice(0, 6));
          histogram.add(recorded(values.slice(6)));
          return statsOf(histogram);
        },
        package: ({ build }) => {
          const histogram = built(build, values.slice(0, 6));
          histogram.add(built(build, values.slice(6)));
          return hdrStatsOf(histogram);
        },
      },
      'build: subtract': {
        native: () => {
          const histogram = recorded([...values, ...values]);
          histogram.subtract(recorded());
          return statsOf(histogram);
        },
        package: ({ build }) => {
          const histogram = built(build, [...values, ...values]);
          histogram.subtract(built(build));
          return hdrStatsOf(histogram);
        },
      },
      'build: reset': {
        native: () => {
          const histogram = recorded();
          histogram.reset();
          return histogram.count;
        },
        package: ({ build }) => {
          const histogram = built(build);
          histogram.reset();
          return histogram.totalCount;
        },
      },
      encodeIntoCompressedBase64: {
        native: () => statsOf(importHistogram(recorded().export())),
        package: ({ build, encodeIntoCompressedBase64, decodeFromCompressedBase64 }) =>
          hdrStatsOf(decodeFromCompressedBase64(encodeIntoCompressedBase64(built(build)))),
      },
      decodeFromCompressedBase64: {
        gap: "export() writes Node's own CBOR format: importHistogram cannot read the compressed HdrHistogram encoding that other HdrHistogram ports exchange",
        native: () => {
          try {
            return importHistogram(Buffer.from(hdrEncoded, 'base64')).count;
          } catch (error) {
            return `threw ${error.code ?? error.name}`;
          }
        },
        package: ({ decodeFromCompressedBase64 }) => decodeFromCompressedBase64(hdrEncoded).totalCount,
      },
    },
  },
};
