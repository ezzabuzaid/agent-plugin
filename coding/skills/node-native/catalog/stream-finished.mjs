// Learn when a stream is done: ended, finished, closed early or failed.
import { Readable, Writable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { failure } from './support/outcome.mjs';

const message = (error) => error.message;
const callback = (eos, stream, options) =>
  new Promise((resolve, reject) => eos(stream, ...(options ? [options] : []), (error) => (error ? reject(error) : resolve())));
const ended = () => Readable.from(['a', 'b']).resume();
const written = () => {
  const target = new Writable({ write: (chunk, encoding, done) => done() });
  target.end('x');
  return target;
};
const failed = () => {
  const source = new Readable({ read() {} });
  source.destroy(new Error('boom'));
  return source;
};
// Starts waiting on a stream, then closes it before it ends.
const closingEarly = (wait) => {
  const source = new Readable({ read() {} });
  const waiting = wait(source);
  source.destroy();
  return waiting;
};
const closedEarly = () => {
  const source = new Readable({ read() {} });
  source.destroy();
  return source;
};
// A wait that has not settled after 50ms reads as 'never settled'.
const bounded = (wait) => Promise.race([wait, new Promise((resolve) => setTimeout(resolve, 50, 'never settled'))]);

export default {
  apis: ['stream:stream.finished'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'end-of-stream@1.4.5': {
      default: {
        native: () => failure(() => finished(ended()), message, 'done'),
        package: ({ default: eos }) => failure(() => callback(eos, ended()), message, 'done'),
      },
      'default: writable': {
        native: () => failure(() => finished(written()), message, 'done'),
        package: ({ default: eos }) => failure(() => callback(eos, written()), message, 'done'),
      },
      'default: error': {
        native: () => failure(() => finished(failed()), message, 'done'),
        package: ({ default: eos }) => failure(() => callback(eos, failed()), message, 'done'),
      },
      'default: premature close': {
        native: () => failure(() => closingEarly((source) => finished(source)), (error) => error.message.toLowerCase(), 'done'),
        package: ({ default: eos }) => failure(() => closingEarly((source) => callback(eos, source)), (error) => error.message.toLowerCase(), 'done'),
      },
      'default: premature close error': {
        gap: "finished rejects a stream closed early with code ERR_STREAM_PREMATURE_CLOSE and message 'Premature close'; end-of-stream passes a plain Error 'premature close' with no code",
        native: () => failure(() => closingEarly((source) => finished(source)), (error) => [error.message, error.code], 'done'),
        package: ({ default: eos }) => failure(() => closingEarly((source) => callback(eos, source)), (error) => [error.message, error.code], 'done'),
      },
      'default: already destroyed': {
        improves: 'finished settles for a stream that was destroyed before the call; end-of-stream never calls back for it, so its caller waits forever',
        native: () => bounded(failure(() => finished(closedEarly()), (error) => error.code, 'done')),
        package: ({ default: eos }) => bounded(failure(() => callback(eos, closedEarly()), (error) => error.code, 'done')),
      },
      'default: readable false': {
        native: () => failure(() => finished(written(), { readable: false }), message, 'done'),
        package: ({ default: eos }) => failure(() => callback(eos, written(), { readable: false }), message, 'done'),
      },
    },
  },
  idioms: {
    // Waiting for 'end' alone hangs on a stream that fails or closes early.
    onceEnd: {
      seed: '\\bonce\\(\\s*[\\w$.]+\\s*,\\s*[\'"](?:end|finish)[\'"]|\\.once\\(\\s*[\'"](?:end|finish)[\'"]',
      improves: "finished rejects when the stream fails or closes early; waiting for 'end' alone never settles then",
      native: () => bounded(failure(() => closingEarly((source) => finished(source)), (error) => error.code, 'done')),
      idiom: () => bounded(closingEarly((source) => new Promise((resolve) => source.once('end', () => resolve('done'))))),
    },
  },
};
