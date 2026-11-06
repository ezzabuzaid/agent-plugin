// Builds the surface of the current Node LTS, which the node-native catalog is
// reviewed against, and reports how the snapshot and the catalog drift from it.
//
// The surface holds every API the LTS documents, as `<doc>:<name>` ids
// (`fs:fs.glob`, `util:util.styleText`, `cli:--env-file`, `cli:NODE_OPTIONS`,
// `globals:fetch`), every global and every static and prototype member that the
// running Node exposes (`js:Map.prototype.getOrInsert`,
// `js:Temporal.PlainDate.prototype.add`, well-known symbols only:
// `js:Iterator.prototype[Symbol.dispose]`), every export of every built-in
// module (`node:module.builtinModules`, `node:fs/promises.glob`), the keys of
// `import.meta` (`js:import.meta.dirname`), and a few syntax probes
// (`js:syntax:using`, `js:syntax:import-attributes`). The runtime ids cover
// what the docs record in shapes the walk cannot read. Events are left out:
// they are behavior of a class that is already in the surface.
//
//   node scripts/surface.mjs [--check | --write]
//     [--index <path|url>] [--docs <path|url>] [--surface <path>] [--catalog <path>]
//
//   --check  compares the LTS in index.json with the snapshot's `node`. Nothing
//            else is fetched or built.
//   default  builds the surface and prints its drift from the snapshot and the
//            catalog.
//   --write  also replaces the snapshot, one api per line sorted by id, so a
//            refresh reads as a line diff. Building is refused unless the
//            running Node is the LTS, because the `js:` members come from it.
//
// The catalog is a directory with one module per entry, `<id>.mjs`, whose
// default export carries at least `apis` (surface ids) and `reviewedAt` (the
// LTS release the entry was last reviewed against). A missing directory reads
// as a catalog with no entries, as on the first refresh.
//
// Defaults: index https://nodejs.org/dist/index.json, docs
// https://nodejs.org/docs/<lts>/api/all.json, surface.json and catalog/ in
// this script's skill directory.
//
// Stdout is one JSON document:
//   --check  { lts, snapshot }
//   build    { lts, snapshot, new, removed, changedSinceReview, dangling }
// `changedSinceReview` lists each doc change that reached the LTS line after
// the catalog entry's `reviewedAt`; `dangling` lists catalog api ids the
// surface does not have.
// Exit 0: no drift. Exit 1: drift. Exit 2: refused or failed, reason on stderr.
import { readFile, writeFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import { basename, join } from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { readCatalog } from './catalog.mjs';

const skill = fileURLToPath(new URL('..', import.meta.url));

const API_TYPES = new Set(['class', 'ctor', 'method', 'classMethod', 'property', 'global']);
const CHILDREN = ['miscs', 'modules', 'classes', 'methods', 'classMethods', 'properties', 'globals', 'signatures'];
const ROOTS = ['modules', 'miscs', 'globals', 'classes', 'methods'];
const VERSION = /^v\d+\.\d+\.\d+$/;
const NOT_MEMBERS = new Set(['length', 'name', 'prototype', 'caller', 'arguments', 'constructor']);
const AsyncFunction = (async () => {}).constructor;
const SYNTAX = [
  ['class-extends', () => new Function('class Parent {} class Child extends Parent {}')],
  ['using', () => new Function('{ using resource = null; }')],
  ['await-using', () => new AsyncFunction('{ await using resource = null; }')],
  ['regexp-modifiers', () => new RegExp('(?i:a)')],
  ['regexp-duplicate-named-groups', () => new RegExp('(?<a>x)|(?<a>y)')],
  ['regexp-v-flag', () => new RegExp('[\\p{L}--[a-z]]', 'v')],
  ['import-attributes', () => new Function("return import('./data.json', { with: { type: 'json' } })")],
];

async function load(source) {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`${source} answered ${response.status}`);
    return response.json();
  }
  return JSON.parse(await readFile(source, 'utf8'));
}

async function loadIfPresent(path, absent) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return absent;
    throw error;
  }
}

const parts = (version) => version.slice(1).split('.').map(Number);

function compare(a, b) {
  const [x, y] = [parts(a), parts(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

const versions = (value) => [value ?? []].flat().filter((version) => VERSION.test(version));

// The release of the LTS line that first carried a change. The docs list at
// most one version per major for a change. A change listed only for older
// majors was already in this major's first release; one listed only for newer
// majors has not reached this line.
function landedIn(changeVersions, major) {
  const sameMajor = changeVersions.find((version) => parts(version)[0] === major);
  if (sameMajor) return sameMajor;
  return changeVersions.some((version) => parts(version)[0] < major) ? `v${major}.0.0` : null;
}

function flagName(raw) {
  const tokens = raw.split(/,\s*/).map((token) => token.split(/[= ]/)[0]);
  return tokens.find((token) => token.startsWith('--')) ?? tokens[0];
}

function describe(node, doc) {
  const raw = (node.textRaw ?? '').replaceAll('`', '');
  if (API_TYPES.has(node.type)) {
    return { kind: node.type, name: raw.replace(/^(Class|Static method):\s*/, '').replace(/\(.*$/s, '').trim() };
  }
  if (doc === 'cli' && node.type === 'module' && raw.startsWith('-')) return { kind: 'flag', name: flagName(raw) };
  if (doc === 'cli' && node.type === 'module' && /^[A-Z_][A-Z0-9_]*(=|$)/.test(raw)) {
    return { kind: 'env', name: raw.split('=')[0] };
  }
  if (doc === 'globals' && node.type === 'misc' && /^[\w$]+$/.test(raw)) return { kind: 'global', name: raw };
  return null;
}

function documentedSurface(docs) {
  const apis = new Map();
  const visit = (node, inheritedDoc, inherited) => {
    const doc = node.source ? basename(node.source, '.md') : inheritedDoc;
    const level = node.stability === undefined ? inherited : { stability: node.stability, text: node.stabilityText };
    const described = describe(node, doc);
    if (described) record(apis, `${doc}:${described.name}`, described.kind, node.meta ?? {}, level);
    for (const key of CHILDREN) for (const child of node[key] ?? []) visit(child, doc, level);
  };
  for (const key of ROOTS) for (const node of docs[key] ?? []) visit(node, null, undefined);
  return apis;
}

function record(apis, id, kind, meta, level) {
  const entry = apis.get(id) ?? { kind, added: new Set(), changes: new Map(), guidance: new Set() };
  for (const version of versions(meta.added)) entry.added.add(version);
  for (const change of meta.changes ?? []) {
    const changeVersions = versions(change.version);
    if (changeVersions.length > 0) {
      entry.changes.set(JSON.stringify([changeVersions, change.description]), { v: changeVersions, d: change.description });
    }
  }
  if (level) {
    entry.stability ??= level.stability;
    if (level.stability === 0 || level.stability === 3) entry.guidance.add(level.text);
  }
  apis.set(id, entry);
}

function serializable(entry) {
  const since = [...entry.added].sort(compare)[0];
  const changes = [...entry.changes.values()];
  return {
    kind: entry.kind,
    ...(since && { since }),
    ...(entry.stability !== undefined && { stability: entry.stability }),
    ...(entry.guidance.size > 0 && { guidance: [...entry.guidance] }),
    ...(changes.length > 0 && { changes }),
  };
}

// Reads getters too, so lazily defined globals such as URLPattern show their
// members. A getter's experimental warning is emitted on a later tick, so the
// warning listeners come back only after one macrotask.
async function runtimeSurface() {
  const ids = new Map();
  const warningListeners = process.listeners('warning');
  process.removeAllListeners('warning');
  const read = (owner, key) => {
    try {
      return owner[key];
    } catch {
      return undefined;
    }
  };
  const members = (owner, path, depth) => {
    for (const key of Reflect.ownKeys(owner)) {
      if (NOT_MEMBERS.has(key)) continue;
      if (typeof key === 'symbol' && Symbol[key.description?.replace(/^Symbol\./, '')] !== key) continue;
      const id = typeof key === 'symbol' ? `${path}[${key.description}]` : `${path}.${key}`;
      ids.set(id, { kind: 'runtime' });
      const value = depth > 0 ? read(owner, key) : undefined;
      if (typeof value === 'function' && value.prototype && /^[A-Z]/.test(String(key))) {
        members(value, id, 0);
        members(value.prototype, `${id}.prototype`, 0);
      }
    }
  };
  try {
    for (const key of Reflect.ownKeys(globalThis)) {
      if (typeof key === 'symbol') continue;
      ids.set(`js:${key}`, { kind: 'runtime' });
      const value = read(globalThis, key);
      if (value === globalThis || value === null || (typeof value !== 'object' && typeof value !== 'function')) continue;
      members(value, `js:${key}`, typeof value === 'object' ? 1 : 0);
      if (typeof value === 'function' && value.prototype) members(value.prototype, `js:${key}.prototype`, 0);
    }
    for (const name of builtinModules.filter((builtin) => !builtin.startsWith('_'))) {
      const specifier = name.startsWith('node:') ? name : `node:${name}`;
      const exported = process.getBuiltinModule(specifier);
      if (!exported) continue;
      ids.set(specifier, { kind: 'runtime' });
      members(exported, specifier, 0);
    }
  } finally {
    await setImmediate();
    for (const listener of warningListeners) process.on('warning', listener);
  }
  for (const key of Object.keys(import.meta)) ids.set(`js:import.meta.${key}`, { kind: 'runtime' });
  for (const [name, attempt] of SYNTAX) {
    try {
      attempt();
      ids.set(`js:syntax:${name}`, { kind: 'syntax' });
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  return ids;
}

function serialize(surface) {
  const lines = Object.keys(surface.apis)
    .sort()
    .map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(surface.apis[id])}`);
  return `{\n  "node": ${JSON.stringify(surface.node)},\n  "v8": ${JSON.stringify(surface.v8)},\n  "apis": {\n${lines.join(',\n')}\n  }\n}\n`;
}

function drift(lts, snapshot, surface, entries) {
  const before = new Set(Object.keys(snapshot.apis));
  const after = new Set(Object.keys(surface.apis));
  const major = parts(lts)[0];
  const changedSinceReview = [];
  const dangling = [];
  for (const { id, entry } of entries) {
    for (const api of entry.apis) {
      const known = surface.apis[api];
      if (!known) {
        dangling.push({ entry: id, api });
        continue;
      }
      for (const change of known.changes ?? []) {
        const landed = landedIn(change.v, major);
        if (landed && compare(landed, entry.reviewedAt) > 0) {
          changedSinceReview.push({ entry: id, api, version: landed, change: change.d });
        }
      }
    }
  }
  return {
    lts,
    snapshot: snapshot.node,
    new: [...after].filter((id) => !before.has(id)).sort(),
    removed: [...before].filter((id) => !after.has(id)).sort(),
    changedSinceReview,
    dangling,
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      check: { type: 'boolean', default: false },
      write: { type: 'boolean', default: false },
      index: { type: 'string', default: 'https://nodejs.org/dist/index.json' },
      docs: { type: 'string' },
      surface: { type: 'string', default: join(skill, 'surface.json') },
      catalog: { type: 'string', default: join(skill, 'catalog') },
    },
  });
  if (values.check && values.write) throw new Error('--check and --write exclude each other');

  const release = (await load(values.index)).find((candidate) => candidate.lts);
  if (!release) throw new Error(`${values.index} lists no LTS release`);
  const lts = release.version;
  const snapshot = await loadIfPresent(values.surface, { node: null, apis: {} });

  if (values.check) {
    process.stdout.write(`${JSON.stringify({ lts, snapshot: snapshot.node })}\n`);
    return lts === snapshot.node ? 0 : 1;
  }

  if (process.version !== lts) {
    throw new Error(`the LTS is ${lts} but this is Node ${process.version}; run the build on ${lts}`);
  }
  const docs = await load(values.docs ?? `https://nodejs.org/docs/${lts}/api/all.json`);
  const apis = Object.fromEntries([...documentedSurface(docs)].map(([id, entry]) => [id, serializable(entry)]));
  for (const [id, entry] of await runtimeSurface()) apis[id] = entry;
  const surface = { node: lts, v8: process.versions.v8, apis };
  const report = drift(lts, snapshot, surface, await readCatalog(values.catalog));
  if (values.write) await writeFile(values.surface, serialize(surface));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  const drifted =
    report.snapshot !== lts ||
    report.new.length > 0 ||
    report.removed.length > 0 ||
    report.changedSinceReview.length > 0 ||
    report.dangling.length > 0;
  return drifted ? 1 : 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  process.stderr.write(`surface: ${error.message}\n`);
  process.exitCode = 2;
}
