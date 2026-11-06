// Publish a message to every other BroadcastChannel of the same name in the
// process (main thread and workers). Native channels do not reach other
// processes or browser tabs; the package's file-based "node" method does.
import { createHash } from 'node:crypto';
import { readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Runs `run(make)` with the package's channels and removes what they leave on
// disk. Its "node" method keeps each channel in os.tmpdir()/pubkey.bc/A<the
// first 20 hex digits of sha256(name)> (getPaths in methods/node.js). The row
// removes the folders of the channels it opened; when no other channel is left
// in pubkey.bc, the package's clearNodeFolder() removes the base folder, which
// also resets the package's cached "base folder exists" promise for the next
// row (a bare rmdir would leave that cache stale and the next channel fails
// with ENOENT).
async function packaged({ BroadcastChannel: Channel, clearNodeFolder }, run) {
  const names = new Set();
  try {
    return await run((name, options) => {
      names.add(name);
      return new Channel(name, options);
    });
  } finally {
    const base = join(tmpdir(), 'pubkey.bc');
    for (const name of names) {
      const folder = `A${createHash('sha256').update(name).digest('hex').slice(0, 20)}`;
      await rm(join(base, folder), { recursive: true, force: true });
    }
    let left = [];
    try {
      left = await readdir(base);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (left.length === 0) await clearNodeFolder();
  }
}
// What a second channel of one name receives from the first.
const delivered = async (make, data = { n: 1, list: ['a'] }) => {
  const sender = make('node-native-probe');
  const receiver = make('node-native-probe');
  const received = new Promise((resolve) => {
    receiver.onmessage = (message) => resolve(message?.data ?? message);
  });
  await sender.postMessage(data);
  const timeout = new Promise((resolve) => setTimeout(() => resolve('nothing'), 2000).unref());
  const value = await Promise.race([received, timeout]);
  await sender.close();
  await receiver.close();
  return value;
};
const own = async (make) => {
  const channel = make('node-native-probe-self');
  let heard = 'nothing';
  channel.onmessage = () => {
    heard = 'own message';
  };
  await channel.postMessage('x');
  await new Promise((resolve) => setTimeout(resolve, 200));
  await channel.close();
  return heard;
};

export default {
  apis: ['globals:BroadcastChannel', 'js:BroadcastChannel'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'broadcast-channel@7.4.0': {
      BroadcastChannel: {
        native: () => delivered((name) => new BroadcastChannel(name)),
        package: (module) => packaged(module, (make) => delivered(make)),
      },
      'BroadcastChannel: Date in a message': {
        improves:
          'BroadcastChannel structured-clones a message, so a Date arrives as a Date; the package sends JSON through its files, so another process receives a string',
        native: () => delivered((name) => new BroadcastChannel(name), { at: new Date(0) }),
        // The file path is what another process receives. In one process the
        // package's fast path (on by default) races it and may hand over the
        // original object first, so the row turns the fast path off.
        package: (module) =>
          packaged(module, (make) =>
            delivered((name) => make(name, { node: { useFastPath: false } }), { at: new Date(0) }),
          ),
      },
      'BroadcastChannel: own messages': {
        native: () => own((name) => new BroadcastChannel(name)),
        package: (module) => packaged(module, own),
      },
    },
  },
};
