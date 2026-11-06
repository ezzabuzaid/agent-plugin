// Immutable binary data: Blob, and File, a Blob with a name and a modification time.

// What a reader of a Blob sees: size, text, bytes, and a typed slice.
const read = async (Blob) => {
  const blob = new Blob(['ab', new Uint8Array([99]), 'é'], { type: 'text/plain' });
  const slice = blob.slice(1, 3, 'x/y');
  return [blob.size, blob.type, await blob.text(), [...new Uint8Array(await blob.arrayBuffer())], slice.size, slice.type, await slice.text(), String(blob)];
};
const file = (File) => {
  const made = new File(['x'], 'a.txt', { type: 'text/plain', lastModified: 5 });
  return [made.name, made.type, made.lastModified, made.size];
};
const typeCase = (Blob) => new Blob(['x'], { type: 'Text/Plain' }).type;
const hasBytes = (Blob) => typeof new Blob(['x']).bytes;
// What the global Response sends for the Blob: its text, or "[object Blob]"
// when it does not know the class.
const asBody = (Blob) => new Response(new Blob(['hi'])).text();

const family = (spec, get) => ({
  Blob: {
    native: () => read(Blob),
    package: (module) => read(get(module).Blob),
  },
  File: {
    native: () => file(File),
    package: (module) => file(get(module).File),
  },
  'Blob: type case': {
    gap: `Blob lowercases its type (Text/Plain → text/plain); ${spec} keeps it as given`,
    native: () => typeCase(Blob),
    package: (module) => typeCase(get(module).Blob),
  },
  'Blob: bytes': {
    improves: `the native Blob has bytes(), which resolves to a Uint8Array; ${spec} has only arrayBuffer()`,
    native: () => hasBytes(Blob),
    package: (module) => hasBytes(get(module).Blob),
  },
  'Blob: as a fetch body': {
    improves: `fetch and Response send the bytes of a native Blob; a ${spec} Blob goes out as the text "[object Blob]", so a migration swaps every Blob at once`,
    native: () => asBody(Blob),
    package: (module) => asBody(get(module).Blob),
  },
});

export default {
  apis: ['globals:Blob', 'globals:File', 'js:Blob', 'js:File', 'js:Blob.prototype.bytes'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fetch-blob@4.0.0': (({ File, ...rows }) => rows)(family('fetch-blob', (module) => module)),
    'fetch-blob@4.0.0/file.js': {
      File: {
        native: () => file(File),
        package: ({ File }) => file(File),
      },
    },
    'formdata-node@6.0.3': family('formdata-node', (module) => module),
    'node-fetch@3.3.2': family('node-fetch', (module) => module),
  },
};
