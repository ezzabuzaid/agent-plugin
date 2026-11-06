// How many tasks the machine can run in parallel: the number of logical CPUs.
import { availableParallelism, cpus } from 'node:os';

export default {
  apis: ['os:os.availableParallelism'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'num-cpus@1.1.0': {
      default: {
        native: () => availableParallelism(),
        package: ({ default: numCpus }) => numCpus,
      },
    },
  },
  idioms: {
    cpusLength: {
      seed: '\\bcpus\\(\\)\\.length',
      native: () => availableParallelism(),
      idiom: () => cpus().length,
    },
  },
};
