// Reads the node-native catalog: one module per entry, `<id>.mjs`, in one
// directory, in file-name order. A missing directory reads as a catalog with
// no entries; whether that is acceptable is the caller's rule.
//
//   readCatalog(directory, ids?) -> [{ id, url, entry }]   entry = the default export
//     With `ids`, only those entries are imported, so a half-written sibling
//     file does not break a run that never asked for it. An id with no file is
//     left out; the caller decides whether that is an error.
//
//   parseSpec(spec) -> { name, version, subpath }
//     A `replaces` key is `<package>@<version>` with an optional `/<subpath>`
//     (`chalk@6.0.1`, `@scope/pkg@1.0.0`, `dequal@2.0.3/lite`); a site probe's
//     key has no version (`dequal/lite`). `version` and `subpath` are
//     undefined when absent; `null` comes back for a key that is neither.
//
//   memberOf(key) -> the member a `replaces` row is about: the key itself, or
//     the part before ': ' for a row about one case of it (`'cloneDeep: class
//     instance'`).
import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SPEC = /^((?:@[^/@\s]+\/)?[^/@\s]+)(?:@(\d+\.\d+\.\d+[^/\s]*))?(\/[^\s]+)?$/;

export function parseSpec(spec) {
  const match = SPEC.exec(spec);
  return match ? { name: match[1], version: match[2], subpath: match[3] } : null;
}

export const memberOf = (key) => key.split(': ')[0];

export async function readCatalog(directory, ids) {
  let files;
  try {
    files = await readdir(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const entries = [];
  for (const file of files.filter((name) => name.endsWith('.mjs')).sort()) {
    const id = basename(file, '.mjs');
    if (ids && !ids.includes(id)) continue;
    const url = pathToFileURL(join(directory, file)).href;
    const { default: entry } = await import(url);
    entries.push({ id, url, entry });
  }
  return entries;
}
