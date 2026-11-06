// WHATWG streams: ReadableStream, WritableStream, TransformStream, their
// readers, writers and queuing strategies.
import { Readable } from 'node:stream';
import { failure, outcome } from './support/outcome.mjs';

// What a ReadableStream class does with a pulled source: chunks read through a
// reader, then what async iteration and tee give.
const read = async ({ ReadableStream }) => {
  const queue = ['a', 'b', 'c'];
  const stream = new ReadableStream({
    pull(controller) {
      if (queue.length === 0) controller.close();
      else controller.enqueue(queue.shift());
    },
  });
  const reader = stream.getReader();
  const first = await reader.read();
  reader.releaseLock();
  const [left, right] = stream.tee();
  const rest = [];
  for await (const chunk of left) rest.push(chunk);
  const copy = [];
  for await (const chunk of right) copy.push(chunk);
  return [first, rest, copy, stream.locked];
};
const fromIterable = async ({ ReadableStream }) => {
  const out = [];
  for await (const chunk of ReadableStream.from((async function* () {
    yield 1;
    yield 2;
  })()))
    out.push(chunk);
  return out;
};
const write = async ({ WritableStream }) => {
  const seen = [];
  const stream = new WritableStream({
    write: (chunk) => void seen.push(chunk),
    close: () => void seen.push('closed'),
  });
  const writer = stream.getWriter();
  await writer.write('a');
  await writer.write('b');
  await writer.close();
  return seen;
};
const transform = async ({ ReadableStream, TransformStream, WritableStream }) => {
  const seen = [];
  const source = new ReadableStream({
    start(controller) {
      for (const chunk of ['ab', 'cd']) controller.enqueue(chunk);
      controller.close();
    },
  });
  await source
    .pipeThrough(new TransformStream({ transform: (chunk, controller) => controller.enqueue(chunk.toUpperCase()), flush: (controller) => controller.enqueue('!') }))
    .pipeTo(new WritableStream({ write: (chunk) => void seen.push(chunk) }));
  return seen;
};
// How a failure in the source reaches the end of a pipe.
const piped = ({ ReadableStream, WritableStream }) => {
  const source = new ReadableStream({
    pull: (controller) => controller.error(new Error('source failed')),
  });
  return failure(() => source.pipeTo(new WritableStream()));
};
const strategies = ({ CountQueuingStrategy, ByteLengthQueuingStrategy }) => {
  const count = new CountQueuingStrategy({ highWaterMark: 4 });
  const bytes = new ByteLengthQueuingStrategy({ highWaterMark: 16 });
  return [count.highWaterMark, count.size('abc'), bytes.highWaterMark, bytes.size(new Uint8Array(5))];
};
const backpressure = async ({ ReadableStream, CountQueuingStrategy }) => {
  const sizes = [];
  const stream = new ReadableStream(
    {
      start(controller) {
        for (const chunk of [1, 2, 3]) {
          controller.enqueue(chunk);
          sizes.push(controller.desiredSize);
        }
        controller.close();
      },
    },
    new CountQueuingStrategy({ highWaterMark: 2 }),
  );
  await stream.cancel();
  return sizes;
};
// A byte stream read into a caller's buffer with a BYOB reader.
const byob = async ({ ReadableStream }) => {
  const stream = new ReadableStream({
    type: 'bytes',
    pull(controller) {
      const view = controller.byobRequest.view;
      view.set([1, 2, 3].slice(0, view.byteLength));
      controller.byobRequest.respond(Math.min(3, view.byteLength));
      controller.close();
    },
  });
  const reader = stream.getReader({ mode: 'byob' });
  const { value } = await reader.read(new Uint8Array(8));
  return [...value];
};
// Reads a stream of the given class through Readable.fromWeb.
const toNode = async (ReadableStream) => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([104, 105]));
      controller.close();
    },
  });
  return outcome(async () => String(Buffer.concat(await Readable.fromWeb(stream).toArray())), (error) => error.code);
};
const globals = {
  ReadableStream,
  WritableStream,
  TransformStream,
  CountQueuingStrategy,
  ByteLengthQueuingStrategy,
};

export default {
  apis: [
    'globals:ReadableStream',
    'globals:WritableStream',
    'globals:TransformStream',
    'globals:ReadableStreamDefaultReader',
    'globals:ReadableStreamBYOBReader',
    'globals:WritableStreamDefaultWriter',
    'js:ReadableStream.from',
    'js:ReadableStream.prototype.tee',
    'js:ReadableStream.prototype.pipeTo',
    'js:ReadableStream.prototype.pipeThrough',
    'js:ReadableStream.prototype.values',
    'webstreams:CountQueuingStrategy',
    'webstreams:ByteLengthQueuingStrategy',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'web-streams-polyfill@4.5.0': {
      ReadableStream: {
        native: () => read(globals),
        package: (module) => read(module),
      },
      'ReadableStream: from': {
        native: () => fromIterable(globals),
        package: (module) => fromIterable(module),
      },
      'ReadableStream: pipeTo error': {
        native: () => piped(globals),
        package: (module) => piped(module),
      },
      'ReadableStream: byob reader': {
        native: () => byob(globals),
        package: (module) => byob(module),
      },
      WritableStream: {
        native: () => write(globals),
        package: (module) => write(module),
      },
      TransformStream: {
        native: () => transform(globals),
        package: (module) => transform(module),
      },
      CountQueuingStrategy: {
        native: () => backpressure(globals),
        package: (module) => backpressure(module),
      },
      ByteLengthQueuingStrategy: {
        native: () => strategies(globals),
        package: (module) => strategies(module),
      },
      // A polyfill stream is not a native one, so Node APIs that check for a
      // web stream refuse it.
      'ReadableStream: Node interop': {
        improves: 'Readable.fromWeb takes a native ReadableStream; it throws ERR_INVALID_ARG_TYPE for a web-streams-polyfill one',
        native: () => toNode(ReadableStream),
        package: ({ ReadableStream }) => toNode(ReadableStream),
      },
    },
  },
};
