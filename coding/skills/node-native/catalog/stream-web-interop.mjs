// Convert between Node streams and web streams (ReadableStream).
import { Readable } from 'node:stream';
import { failure } from './support/outcome.mjs';

const CHUNKS = ['ab', 'cd', 'ef'];
const web = () => new Blob(CHUNKS).stream();
const node = () => Readable.from(CHUNKS.map((chunk) => Buffer.from(chunk)));
// The text a Node stream carries.
const nodeText = async (stream) => {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
};
// The text a web stream carries.
const webText = async (stream) => {
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of stream) text += decoder.decode(chunk, { stream: true });
  return text + decoder.decode();
};
const failingNode = () =>
  new Readable({
    read() {
      this.destroy(new Error('source failed'));
    },
  });

export default {
  apis: ['stream:stream.Readable.fromWeb', 'stream:stream.Readable.toWeb'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'readable-web-to-node-stream@5.0.0': {
      ReadableWebToNodeStream: {
        native: () => nodeText(Readable.fromWeb(web())),
        package: ({ ReadableWebToNodeStream }) => nodeText(new ReadableWebToNodeStream(web())),
      },
    },
    'readable-stream-node-to-web@1.0.1': {
      default: {
        native: () => webText(Readable.toWeb(node())),
        package: ({ default: nodeToWeb }) => webText(nodeToWeb(node())),
      },
      'default: error': {
        native: () => failure(() => webText(Readable.toWeb(failingNode()))),
        package: ({ default: nodeToWeb }) => failure(() => webText(nodeToWeb(failingNode()))),
      },
    },
  },
};
