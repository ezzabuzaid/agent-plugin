// Driving V8's CPU and heap profilers from inside the process through the
// inspector protocol, with promises.
import { Session } from 'node:inspector/promises';

// Work for the profilers to see.
const work = () => {
  const values = [];
  for (let index = 0; index < 1e5; index++) values.push({ index });
  return values.length;
};

// Runs `use` on a connected session, disconnected afterwards.
async function withSession(use) {
  const session = new Session();
  session.connect();
  try {
    return await use(session);
  } finally {
    session.disconnect();
  }
}
const withInspector = async (Inspector, use) => {
  const inspector = new Inspector({ storage: { type: 'raw' } });
  try {
    return await use(inspector);
  } finally {
    await inspector.destroy();
  }
};

// The fields of a profile; their values depend on the run.
const fields = (profile) => Object.keys(profile).sort();

export default {
  apis: [
    'inspector:inspector.Session',
    'inspector:new inspector.Session',
    'inspector:session.connect',
    'inspector:session.post',
    'inspector:session.disconnect',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'inspector-api@1.5.0': {
      'default: CPU profile': {
        native: () =>
          withSession(async (session) => {
            await session.post('Profiler.enable');
            await session.post('Profiler.start');
            work();
            const { profile } = await session.post('Profiler.stop');
            await session.post('Profiler.disable');
            return fields(profile);
          }),
        package: ({ default: Inspector }) =>
          withInspector(Inspector, async (inspector) => {
            await inspector.profiler.enable();
            await inspector.profiler.start();
            work();
            return fields(await inspector.profiler.stop());
          }),
      },
      'default: heap sampling': {
        native: () =>
          withSession(async (session) => {
            await session.post('HeapProfiler.enable');
            await session.post('HeapProfiler.startSampling');
            work();
            const { profile } = await session.post('HeapProfiler.stopSampling');
            await session.post('HeapProfiler.disable');
            return fields(profile);
          }),
        package: ({ default: Inspector }) =>
          withInspector(Inspector, async (inspector) => {
            await inspector.heap.enable();
            await inspector.heap.startSampling();
            work();
            return fields(await inspector.heap.stopSampling());
          }),
      },
    },
  },
};
