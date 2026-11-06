// Join a writable and a readable into one duplex stream, or make two duplex
// streams wired to each other.
import { Duplex, duplexPair, PassThrough, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// A writable side that upper-cases what it gets into the readable side.
const sides = (objectMode = false) => {
  const readable = new PassThrough({ objectMode });
  const writable = new PassThrough({ objectMode });
  writable.on('data', (chunk) => readable.write(objectMode ? { n: chunk.n + 1 } : String(chunk).toUpperCase()));
  writable.on('end', () => readable.end());
  return { writable, readable };
};
// Writes `chunks` into the duplex and reads what comes out of it.
const through = async (duplex, chunks = ['ab', 'cd'], objectMode = false) => {
  const out = [];
  await pipeline(Readable.from(chunks, { objectMode }), duplex, async (source) => {
    for await (const chunk of source) out.push(objectMode ? chunk : String(chunk));
  });
  return objectMode ? out : out.join('');
};
// Writes on each end of a pair and reads what reaches the other end.
const exchanged = async ([left, right]) => {
  left.end('ping');
  right.end('pong');
  const [atRight, atLeft] = await Promise.all([right.toArray(), left.toArray()]);
  return [String(Buffer.concat(atRight)), String(Buffer.concat(atLeft))];
};
// The error a duplex reports when its readable side fails, and whether it is
// destroyed with it.
const failedSide = (join) => {
  const { writable, readable } = sides();
  const duplex = join(writable, readable);
  const reported = new Promise((resolve) => duplex.once('error', (error) => resolve(error.message)));
  readable.destroy(new Error('side failed'));
  return reported.then((message) => [message, duplex.destroyed]);
};

export default {
  apis: ['stream:stream.Duplex.from', 'stream:stream.duplexPair'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'duplexify@4.1.3': {
      default: {
        native: () => through(Duplex.from(sides())),
        package: ({ default: duplexify }) => {
          const { writable, readable } = sides();
          return through(duplexify(writable, readable));
        },
      },
      obj: {
        native: () => through(Duplex.from(sides(true)), [{ n: 1 }, { n: 2 }], true),
        package: ({ default: duplexify }) => {
          const { writable, readable } = sides(true);
          return through(duplexify.obj(writable, readable), [{ n: 1 }, { n: 2 }], true);
        },
      },
      'default: error': {
        native: () => failedSide((writable, readable) => Duplex.from({ writable, readable })),
        package: ({ default: duplexify }) => failedSide(duplexify),
      },
      'default: set sides later': {
        gap: 'Duplex.from takes both sides when it is called; duplexify also starts empty and takes them later through setWritable and setReadable',
        native: () => typeof Duplex.from({ writable: new PassThrough(), readable: new PassThrough() }).setReadable,
        package: ({ default: duplexify }) => typeof duplexify().setReadable,
      },
    },
    'duplexpair@1.0.2': {
      default: {
        native: () => exchanged(duplexPair()),
        package: ({ default: DuplexPair }) => {
          const { socket1, socket2 } = new DuplexPair();
          return exchanged([socket1, socket2]);
        },
      },
    },
  },
};
