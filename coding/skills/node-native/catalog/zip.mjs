// Read and write ZIP archives, in memory or on disk.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buffer } from 'node:stream/consumers';
import { createZipArchive, ZipBuffer, ZipEntry, ZipFile, zipFiles } from 'node:zlib';
import { inScratch } from './support/scratch.mjs';

const modified = new Date(Date.UTC(2020, 0, 2, 3, 4, 6));
const FILES = { 'a.txt': 'alpha', 'dir/b.txt': 'beta '.repeat(20) };
// The archive every reader reads: a file, a directory, and a deflated file,
// written by zlib with a fixed modification time and an archive comment.
const archive = async () =>
  buffer(
    createZipArchive(
      [
        await ZipEntry.create('a.txt', Buffer.from(FILES['a.txt']), { modified }),
        await ZipEntry.create('dir/', Buffer.alloc(0), { modified }),
        await ZipEntry.create('dir/b.txt', Buffer.from(FILES['dir/b.txt']), { modified }),
      ],
      { comment: 'hi' },
    ),
  );
const sorted = (rows) => rows.sort(([a], [b]) => a.localeCompare(b));
// What a reader sees: each entry's name and text, directories with no text.
const listed = async (zip) => {
  const rows = [];
  for (const [name, entry] of zip) rows.push([name, entry.isDirectory ? null : String(await entry.content())]);
  return sorted(rows);
};
// Reads an archive some package wrote, with zlib: the bytes differ by
// writer (timestamps, extra fields), the entries must not.
const written = async (bytes) => listed(new ZipBuffer(Buffer.from(bytes)));
// The archive zlib writes for FILES.
const nativeWrite = async () =>
  written(await buffer(createZipArchive(await Promise.all(Object.entries(FILES).map(([name, text]) => ZipEntry.create(name, Buffer.from(text)))))));
const filesOnly = (rows) => rows.filter(([, text]) => text !== null);
// Runs `read(path)` on the archive written to a file.
const onDisk = async (read) => {
  const bytes = await archive();
  return inScratch({}, async (dir) => {
    const path = join(dir, 'archive.zip');
    await writeFile(path, bytes);
    return read(path, dir);
  });
};
const nativeFromDisk = () =>
  onDisk(async (path) => {
    const zip = await ZipFile.open(path);
    try {
      const rows = [];
      for (const [name, pending] of zip.entries()) {
        const entry = await pending;
        rows.push([name, entry.isDirectory ? null : String(await entry.content())]);
      }
      return sorted(rows);
    } finally {
      await zip.close();
    }
  });
// yauzl reads entries one at a time through callbacks.
const yauzlRead = (yauzl, open) =>
  new Promise((resolve, reject) => {
    open({ lazyEntries: true }, (error, zip) => {
      if (error) return reject(error);
      const rows = [];
      zip.on('error', reject);
      zip.on('end', () => resolve(sorted(rows)));
      zip.on('entry', (entry) => {
        if (entry.fileName.endsWith('/')) {
          rows.push([entry.fileName, null]);
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, async (failure, stream) => {
          if (failure) return reject(failure);
          rows.push([entry.fileName, String(await buffer(stream))]);
          zip.readEntry();
        });
      });
      zip.readEntry();
    });
  });

export default {
  apis: [
    'zlib:zlib.ZipBuffer',
    'zlib:zlib.ZipEntry',
    'zlib:zlib.ZipEntry.create',
    'zlib:zipEntry.content',
    'zlib:zlib.createZipArchive',
    'zlib:zipBuffer.add',
    'zlib:zipBuffer.delete',
    'zlib:zipBuffer.get',
    'zlib:zipBuffer.toBuffer',
    'zlib:zlib.ZipFile',
    'zlib:zlib.ZipFile.open',
    'zlib:zipFile.entries',
    'zlib:zlib.zipFiles',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'adm-zip@0.6.1': {
      getEntries: {
        native: async () => listed(new ZipBuffer(await archive())),
        package: async ({ default: AdmZip }) =>
          sorted(new AdmZip(await archive()).getEntries().map((entry) => [entry.entryName, entry.isDirectory ? null : entry.getData().toString()])),
      },
      'getEntries: file': {
        native: nativeFromDisk,
        package: ({ default: AdmZip }) =>
          onDisk((path) => sorted(new AdmZip(path).getEntries().map((entry) => [entry.entryName, entry.isDirectory ? null : entry.getData().toString()]))),
      },
      readAsText: {
        native: async () => String(await new ZipBuffer(await archive()).get('dir/b.txt').content()),
        package: async ({ default: AdmZip }) => new AdmZip(await archive()).readAsText('dir/b.txt'),
      },
      getZipComment: {
        native: async () => new ZipBuffer(await archive()).comment,
        package: async ({ default: AdmZip }) => new AdmZip(await archive()).getZipComment(),
      },
      'getEntries: modified time': {
        native: async () => new ZipBuffer(await archive()).get('a.txt').modified.toISOString(),
        package: async ({ default: AdmZip }) => new AdmZip(await archive()).getEntry('a.txt').header.time.toISOString(),
      },
      addFile: {
        native: nativeWrite,
        package: ({ default: AdmZip }) => {
          const zip = new AdmZip();
          for (const [name, text] of Object.entries(FILES)) zip.addFile(name, Buffer.from(text));
          return written(zip.toBuffer());
        },
      },
      'addFile: edit an archive': {
        native: async () => {
          const zip = new ZipBuffer(await archive());
          await zip.add('c.txt', Buffer.from('gamma'));
          zip.delete('a.txt');
          return written(await zip.toBuffer());
        },
        package: async ({ default: AdmZip }) => {
          const zip = new AdmZip(await archive());
          zip.addFile('c.txt', Buffer.from('gamma'));
          zip.deleteFile('a.txt');
          return written(zip.toBuffer());
        },
      },
      addLocalFile: {
        native: () =>
          inScratch(FILES, async (dir) =>
            filesOnly(await written(await buffer(zipFiles(Object.keys(FILES).map((name) => [join(dir, name), name])))))),
        package: ({ default: AdmZip }) =>
          inScratch(FILES, (dir) => {
            const zip = new AdmZip();
            zip.addLocalFile(join(dir, 'a.txt'));
            zip.addLocalFile(join(dir, 'dir/b.txt'), 'dir');
            return written(zip.toBuffer());
          }),
      },
      extractAllTo: {
        gap: 'zlib has no extract-to-directory: walk the entries and write each file (mkdir for directories) yourself',
        native: async () => typeof new ZipBuffer(await archive()).extractAllTo,
        package: async ({ default: AdmZip }) => typeof new AdmZip(await archive()).extractAllTo,
      },
    },
    'jszip@3.10.2': {
      loadAsync: {
        native: async () => listed(new ZipBuffer(await archive())),
        package: async ({ default: JSZip }) => {
          const zip = await JSZip.loadAsync(await archive());
          const rows = [];
          for (const [name, entry] of Object.entries(zip.files)) rows.push([name, entry.dir ? null : await entry.async('string')]);
          return sorted(rows);
        },
      },
      'loadAsync: comment': {
        native: async () => new ZipBuffer(await archive()).comment,
        package: async ({ default: JSZip }) => (await JSZip.loadAsync(await archive())).comment,
      },
      generateAsync: {
        native: nativeWrite,
        package: async ({ default: JSZip }) => {
          const zip = new JSZip();
          for (const [name, text] of Object.entries(FILES)) zip.file(name, text);
          return filesOnly(await written(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })));
        },
      },
      'generateAsync: folders': {
        gap: 'createZipArchive writes only the entries it is given; jszip also writes an entry for each parent folder (dir/)',
        native: nativeWrite,
        package: async ({ default: JSZip }) => {
          const zip = new JSZip();
          for (const [name, text] of Object.entries(FILES)) zip.file(name, text);
          return written(await zip.generateAsync({ type: 'nodebuffer' }));
        },
      },
    },
    'fflate@0.8.3': {
      unzipSync: {
        native: async () => filesOnly(await listed(new ZipBuffer(await archive()))),
        package: async ({ unzipSync }) =>
          sorted(Object.entries(unzipSync(await archive())).filter(([name]) => !name.endsWith('/')).map(([name, bytes]) => [name, String(Buffer.from(bytes))])),
      },
      zipSync: {
        native: nativeWrite,
        package: ({ zipSync }) => written(zipSync(Object.fromEntries(Object.entries(FILES).map(([name, text]) => [name, Buffer.from(text)])))),
      },
    },
    'yauzl@3.4.0': {
      fromBuffer: {
        native: async () => listed(new ZipBuffer(await archive())),
        package: async (yauzl) => yauzlRead(yauzl, async (options, done) => yauzl.fromBuffer(await archive(), options, done)),
      },
      open: {
        native: nativeFromDisk,
        package: (yauzl) => onDisk((path) => yauzlRead(yauzl, (options, done) => yauzl.open(path, options, done))),
      },
    },
    'yazl@3.3.1': {
      ZipFile: {
        native: nativeWrite,
        package: async ({ ZipFile: YazlZipFile }) => {
          const zip = new YazlZipFile();
          for (const [name, text] of Object.entries(FILES)) zip.addBuffer(Buffer.from(text), name);
          zip.end();
          return written(await buffer(zip.outputStream));
        },
      },
    },
    'archiver@8.0.0': {
      ZipArchive: {
        native: nativeWrite,
        package: async ({ ZipArchive }) => {
          const zip = new ZipArchive();
          for (const [name, text] of Object.entries(FILES)) zip.append(Buffer.from(text), { name });
          const bytes = buffer(zip);
          await zip.finalize();
          return written(await bytes);
        },
      },
      'ZipArchive: file': {
        native: () =>
          inScratch(FILES, async (dir) => written(await buffer(zipFiles(Object.keys(FILES).map((name) => [join(dir, name), name]))))),
        package: ({ ZipArchive }) =>
          inScratch(FILES, async (dir) => {
            const zip = new ZipArchive();
            for (const name of Object.keys(FILES)) zip.file(join(dir, name), { name });
            const bytes = buffer(zip);
            await zip.finalize();
            return written(await bytes);
          }),
      },
      'ZipArchive: directory': {
        gap: 'zipFiles does not walk a directory: list each file; archiver.directory() adds a whole tree',
        native: () => inScratch(FILES, async (dir) => written(await buffer(zipFiles([[join(dir, 'dir'), 'dir/']])))),
        package: ({ ZipArchive }) =>
          inScratch(FILES, async (dir) => {
            const zip = new ZipArchive();
            zip.directory(join(dir, 'dir'), 'dir');
            const bytes = buffer(zip);
            await zip.finalize();
            return written(await bytes);
          }),
      },
    },
  },
};
