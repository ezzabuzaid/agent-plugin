// Lists what a node-native scan has to judge in one repository, without
// judging it:
//   - each workspace's direct dependencies that a catalog entry, or e18e,
//     covers, with every import site and the members that site uses. From
//     e18e count its `native` replacements and its `removal` verdicts (the
//     package can just be deleted, `removal` carries e18e's reason), each only
//     when Node ships it: the surface has the id, its `nodeFeatureId` loads in
//     this Node, it links Node's docs, or it is ECMAScript (an MDN
//     `Web/JavaScript/` page). Bun, Deno, browser-only and tooling advice
//     (jquery → DOM, lodash wholesale, npm-check) do not count;
//   - calls to APIs the surface marks deprecated (stability 0) or legacy (3),
//     found through the file's own import of the module, or as `new X(` and
//     `X.member(` for a global such as Buffer;
//   - lines that match a catalog idiom's `seed` (a place to look, never proof
//     that the idiom is there or that nothing else is).
// It reads the files git tracks or would track, so .gitignore applies, and
// writes nothing. Like the probes, it runs only on the Node the surface was
// built on (`--surface`), because what "Node ships" means is that Node.
//
//   node scripts/inventory.mjs <repo> [--catalog <dir>] [--surface <path>] [--e18e <version|url>]
//
// `--e18e` is a module-replacements version (fetched from unpkg), or the URL
// that serves its native.json, micro-utilities.json and preferred.json
// manifests (a mirror).
//
// For a dependency a catalog entry covers, each site splits the names it uses
// (named imports, members read off a default or namespace binding, and
// `default` when that binding is called or constructed) into `mapped`, which a
// mapping row of the entries covers, and `unmapped`, which keep the package
// unless a reader finds otherwise. `gaps` holds, for each used name, the gap
// rows the entries prove for it (`'cloneDeep: class instance'` is a case of
// `cloneDeep`): a mapped name with gaps maps except in those cases.
// `improvements` holds, the same way, the rows where Node does better than the
// package (`improves`): a change the migration brings, not a reason to keep it.
//
// An e18e replacement that the surface marks deprecated or legacy does not
// count: Node itself says not to use it (util.inherits → class extends).
//
// A workspace is a directory with a package.json. `runtime` is 'browser' when
// its package.json has a `browser` field, or when one of its tsconfig*.json
// files has DOM in `lib` and none of them has node in `types`; otherwise
// 'node'. `signals` say what was seen.
//
// Stdout is one JSON document:
//   { repo, e18e, workspaces: [{ path, runtime, signals,
//       dependencies: [{ package, entries, e18e, removal?,
//         sites: [{ file, line, specifier, typeOnly, imports, members, mapped?, unmapped?, gaps?, improvements? }] }],
//       deprecated: [{ file, line, api, guidance }],
//       seeds: [{ file, line, entry, idiom }] }] }
// Exit 0: listed. Exit 2: not a git work tree, e18e unreachable, or a read
// failed; reason on stderr.
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { memberOf, parseSpec, readCatalog } from './catalog.mjs';

const skill = fileURLToPath(new URL('..', import.meta.url));
const E18E = '3.4.0';
const SOURCE = /\.[cm]?[jt]sx?$/;
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const BUILTINS = new Set(builtinModules.map((name) => name.replace(/^node:/, '')));
const IMPORTS = [
  /\bimport\s+(type\s+)?([\w$*{}\s,]+?)\s+from\s*['"]([^'"]+)['"]/g,
  /\bexport\s+(type\s+)?([\w$*{}\s,]+?)\s+from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*()()['"]([^'"]+)['"]/g,
  /(?:\b(?:const|let|var)\s+([\w$]+|\{[^}]*\})\s*=\s*)?(?:await\s+)?\b(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const packageOf = (specifier) => {
  if (specifier.startsWith('node:') || BUILTINS.has(specifier)) return specifier.replace(/^node:/, '');
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

// What a clause binds: the names it imports, the local name of each
// (`{ parse as parseUrl }`, `{ parse: parseUrl }`), and local names for the
// whole module (a default, a namespace, or a `default:` out of a dynamic import).
function bindingsOf(clause) {
  const imports = [];
  const locals = [];
  const aliases = {};
  const named = clause.match(/\{([^}]*)\}/)?.[1];
  for (const part of (named ?? '').split(',').map((item) => item.trim()).filter(Boolean)) {
    const [imported, local = imported] = part.replace(/^type\s+/, '').split(/\s+as\s+|\s*:\s*/);
    if (imported === 'default') locals.push(local);
    else {
      imports.push(imported);
      aliases[imported] = local;
    }
  }
  const rest = clause.replace(/\{[^}]*\}/, '').replace(/,/g, ' ').trim();
  const namespace = rest.match(/\*\s+as\s+([\w$]+)/);
  if (namespace) locals.push(namespace[1]);
  else if (/^[\w$]+$/.test(rest)) locals.push(rest);
  if (locals.length > 0) imports.unshift('default');
  return { imports, locals, aliases };
}

function importsIn(text) {
  const found = [];
  for (const [index, pattern] of IMPORTS.entries()) {
    for (const match of text.matchAll(pattern)) {
      const dynamic = index === 3;
      const specifier = dynamic ? match[2] : match[3];
      const clause = (dynamic ? match[1] : match[2]) ?? '';
      const { imports, locals, aliases } =
        dynamic && /^[\w$]+$/.test(clause) ? { imports: ['default'], locals: [clause], aliases: {} } : bindingsOf(clause);
      found.push({ specifier, line: lineAt(text, match.index), typeOnly: !dynamic && Boolean(match[1]), imports, locals, aliases });
    }
  }
  return found;
}

// Every name of a member chain counts: `chalk.red.ansi256(208)` uses red and
// ansi256, so a gap behind a chained name still reaches the site.
function membersUsed(text, locals) {
  const members = new Set();
  for (const local of locals) {
    const chain = new RegExp(`(?<![\\w$.])${RegExp.escape(local)}((?:\\s*\\??\\.\\s*[\\w$]+)+)`, 'g');
    for (const match of text.matchAll(chain)) {
      for (const name of match[1].split('.').map((part) => part.replace(/[\s?]/g, '')).filter(Boolean)) members.add(name);
    }
  }
  return [...members].sort();
}

const calledDirectly = (text, locals) =>
  locals.some((local) => new RegExp(`(?:(?<![\\w$.])${RegExp.escape(local)}\\s*\\(|\\bnew\\s+${RegExp.escape(local)}\\b)`).test(text));

function linesMatching(text, pattern, skip) {
  return [...text.matchAll(pattern)].map((match) => lineAt(text, match.index)).filter((line) => line !== skip);
}

// Deprecated and legacy APIs a file can be searched for: `<module>.<member>`
// through the file's import of that module, `new X` and `X.<member>` for a
// global X. Instance members (`buf.slice`) need types, so they are left to the
// reader.
function deprecatedTargets(surface) {
  const targets = [];
  for (const [api, entry] of Object.entries(surface.apis)) {
    if (entry.stability !== 0 && entry.stability !== 3) continue;
    const name = api.slice(api.indexOf(':') + 1);
    const guidance = entry.guidance ?? [];
    const ctor = name.match(/^new\s+([\w$]+)$/);
    if (ctor && typeof globalThis[ctor[1]] === 'function') {
      targets.push({ api, guidance, global: new RegExp(`\\bnew\\s+${RegExp.escape(ctor[1])}\\s*\\(`, 'g') });
      continue;
    }
    const dot = name.lastIndexOf('.');
    if (dot < 0) continue;
    const [owner, member] = [name.slice(0, dot), name.slice(dot + 1)];
    if (BUILTINS.has(owner)) targets.push({ api, guidance, module: owner, member });
    else if (/^[A-Z]/.test(owner) && typeof globalThis[owner] === 'function') {
      targets.push({ api, guidance, global: new RegExp(`(?<![\\w$.])${RegExp.escape(owner)}\\.${RegExp.escape(member)}\\b`, 'g') });
    }
  }
  return targets;
}

function deprecatedIn(file, text, imports, targets) {
  const hits = [];
  for (const target of targets) {
    if (target.global) {
      for (const line of linesMatching(text, target.global)) hits.push({ file, line, api: target.api, guidance: target.guidance });
      continue;
    }
    for (const site of imports.filter((item) => packageOf(item.specifier) === target.module && !item.typeOnly)) {
      const local = site.aliases[target.member];
      const patterns = [
        ...(local ? [new RegExp(`(?<![\\w$.])${RegExp.escape(local)}\\s*\\(`, 'g')] : []),
        ...site.locals.map((local) => new RegExp(`(?<![\\w$.])${RegExp.escape(local)}\\s*\\.\\s*${RegExp.escape(target.member)}\\b`, 'g')),
      ];
      for (const pattern of patterns) {
        for (const line of linesMatching(text, pattern, site.line)) hits.push({ file, line, api: target.api, guidance: target.guidance });
      }
    }
  }
  return hits;
}

async function readJson(path) {
  const text = await readFile(path, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`${path} is not valid JSON: ${error.message}`);
    throw error;
  }
}

async function readIfPresent(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function runtimeOf(directory, files) {
  const manifest = await readJson(join(directory, 'package.json'));
  const signals = manifest.browser ? ['package.json has a browser field'] : [];
  let dom = false;
  let node = false;
  for (const file of files) {
    const tsconfig = await readIfPresent(join(directory, file));
    if (tsconfig === null) continue;
    const lib = tsconfig.match(/"lib"\s*:\s*\[([^\]]*)\]/)?.[1] ?? '';
    const types = tsconfig.match(/"types"\s*:\s*\[([^\]]*)\]/)?.[1] ?? '';
    if (/"dom"/i.test(lib)) {
      dom = true;
      signals.push(`${file} lib has DOM`);
    }
    if (/"node"/.test(types)) {
      node = true;
      signals.push(`${file} types have node`);
    }
  }
  return { runtime: manifest.browser || (dom && !node) ? 'browser' : 'node', signals, manifest };
}

function shipsInNode(replacement, stabilities) {
  const known = stabilities.get(replacement.id);
  if (known) return !known.has(0) && !known.has(3);
  const feature = replacement.nodeFeatureId;
  if (feature) {
    const module = process.getBuiltinModule(feature.moduleName.replace(/^(?!node:)/, 'node:'));
    return module !== undefined && (feature.exportName === undefined || feature.exportName in module);
  }
  if (replacement.url?.type === 'node') return true;
  return replacement.url?.type === 'mdn' && replacement.url.id.startsWith('Web/JavaScript/');
}

async function manifest(source, name) {
  const base = /^\d+\.\d+\.\d+$/.test(source) ? `https://unpkg.com/module-replacements@${source}/manifests` : source;
  const url = `${base.replace(/\/$/, '')}/${name}.json`;
  const response = await fetch(url).catch((error) => {
    throw new Error(`${url} could not be fetched: ${error.cause?.code ?? error.message}`);
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

async function e18eNative(source, surface) {
  // Every stability the surface records under a name, whichever doc or the
  // runtime listed it (`buffer:Buffer.from` and `js:Buffer.from`).
  const stabilities = new Map();
  for (const [id, entry] of Object.entries(surface.apis)) {
    const name = id.slice(id.indexOf(':') + 1);
    if (!stabilities.has(name)) stabilities.set(name, new Set());
    if (entry.stability !== undefined) stabilities.get(name).add(entry.stability);
  }
  const byPackage = new Map();
  for (const name of ['native', 'micro-utilities', 'preferred']) {
    const { mappings, replacements } = await manifest(source, name);
    for (const [moduleName, mapping] of Object.entries(mappings)) {
      const shipped = mapping.replacements.map((id) => replacements[id]).filter((item) => item && shipsInNode(item, stabilities));
      const native = shipped.filter((item) => item.type === 'native').map((item) => item.id);
      const removal = shipped.find((item) => item.type === 'removal')?.description;
      if (native.length === 0 && !removal) continue;
      const known = byPackage.get(moduleName) ?? { native: [] };
      byPackage.set(moduleName, {
        native: [...new Set([...known.native, ...native])].sort(),
        ...((known.removal ?? removal) && { removal: known.removal ?? removal }),
      });
    }
  }
  return byPackage;
}

// A copy of refuseOffSurface in probe.mjs (strike 2; see docs/copies.md).
function refuseOffSurface(surface, path) {
  if (surface.node !== process.version) {
    throw new Error(`the surface at ${path} is ${surface.node} but this is Node ${process.version}; run on ${surface.node}`);
  }
}

async function filesOf(repo) {
  const { stdout } = await promisify(execFile)(
    'git',
    ['-C', repo, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { maxBuffer: 512 * 1024 * 1024 },
  ).catch((error) => {
    throw new Error(`${repo} is not a git work tree: ${error.stderr?.trim() || error.message}`);
  });
  return [...new Set(stdout.split('\0').filter(Boolean))].sort();
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      catalog: { type: 'string', default: join(skill, 'catalog') },
      surface: { type: 'string', default: join(skill, 'surface.json') },
      e18e: { type: 'string', default: E18E },
    },
  });
  if (positionals.length !== 1) throw new Error('usage: inventory.mjs <repo>');
  const repo = resolve(positionals[0]);
  const surface = await readJson(values.surface);
  refuseOffSurface(surface, values.surface);
  const files = await filesOf(repo);
  const [catalog, e18e] = await Promise.all([readCatalog(values.catalog), e18eNative(values.e18e, surface)]);

  const entriesByPackage = Map.groupBy(
    catalog.flatMap(({ id, entry }) =>
      Object.entries(entry.replaces ?? {}).map(([spec, rows]) => ({
        id,
        name: parseSpec(spec).name,
        rows: Object.entries(rows).map(([key, row]) => ({ member: memberOf(key), gap: row.gap, improves: row.improves })),
      })),
    ),
    ({ name }) => name,
  );
  const mapOf = (name) => {
    const rows = (entriesByPackage.get(name) ?? []).flatMap((covered) => covered.rows);
    return {
      mapped: new Set(rows.filter((row) => !row.gap).map((row) => row.member)),
      gaps: Map.groupBy(rows.filter((row) => row.gap), (row) => row.member),
      improvements: Map.groupBy(rows.filter((row) => row.improves), (row) => row.member),
    };
  };
  const seeds = catalog.flatMap(({ id, entry }) =>
    Object.entries(entry.idioms ?? {})
      .filter(([, row]) => row.seed)
      .map(([idiom, row]) => ({ entry: id, idiom, pattern: new RegExp(row.seed, 'g') })),
  );
  const targets = deprecatedTargets(surface);

  // git lists a tracked package.json even after it is deleted from the work
  // tree; such a directory is no workspace any more.
  const manifests = files.filter((file) => file === 'package.json' || file.endsWith('/package.json')).map((file) => dirname(file));
  const workspaces = new Map();
  for (const root of manifests) {
    const tsconfigs = files
      .filter((file) => dirname(file) === root && /^tsconfig[\w.-]*\.json$/.test(basename(file)))
      .map((file) => basename(file));
    let described;
    try {
      described = await runtimeOf(join(repo, root), tsconfigs);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const { runtime, signals, manifest } = described;
    const declared = new Set(DEPENDENCY_FIELDS.flatMap((field) => Object.keys(manifest[field] ?? {})));
    const covered = [...declared].filter((name) => entriesByPackage.has(name) || e18e.has(name)).sort();
    workspaces.set(root, {
      path: root,
      runtime,
      signals,
      dependencies: covered.map((name) => ({
        package: name,
        entries: (entriesByPackage.get(name) ?? []).map(({ id }) => id),
        e18e: e18e.get(name)?.native ?? [],
        ...(e18e.get(name)?.removal && { removal: e18e.get(name).removal }),
        sites: [],
      })),
      deprecated: [],
      seeds: [],
    });
  }
  const roots = [...workspaces.keys()];
  const workspaceOf = (file) =>
    roots.filter((root) => root === '.' || file.startsWith(`${root}/`)).sort((a, b) => b.length - a.length)[0];

  for (const file of files.filter((name) => SOURCE.test(name) && !name.endsWith('.d.ts'))) {
    const root = workspaceOf(file);
    if (root === undefined) continue;
    const text = await readIfPresent(join(repo, file));
    if (text === null) continue;
    const workspace = workspaces.get(root);
    const imports = importsIn(text);
    for (const dependency of workspace.dependencies) {
      const map = mapOf(dependency.package);
      for (const site of imports.filter((item) => packageOf(item.specifier) === dependency.package)) {
        const members = membersUsed(text, site.locals);
        const used = [
          ...new Set([
            ...site.imports.filter((name) => name !== 'default'),
            ...members,
            ...(calledDirectly(text, site.locals) ? ['default'] : []),
          ]),
        ].sort();
        const gaps = Object.fromEntries(
          used.filter((name) => map.gaps.has(name)).map((name) => [name, map.gaps.get(name).map((row) => row.gap)]),
        );
        const improvements = Object.fromEntries(
          used
            .filter((name) => map.improvements.has(name))
            .map((name) => [name, map.improvements.get(name).map((row) => row.improves)]),
        );
        dependency.sites.push({
          file,
          line: site.line,
          specifier: site.specifier,
          typeOnly: site.typeOnly,
          imports: site.imports,
          members,
          ...(dependency.entries.length > 0 && {
            mapped: used.filter((name) => map.mapped.has(name)),
            unmapped: used.filter((name) => !map.mapped.has(name)),
            gaps,
            improvements,
          }),
        });
      }
    }
    workspace.deprecated.push(...deprecatedIn(file, text, imports, targets));
    for (const seed of seeds) {
      for (const line of linesMatching(text, seed.pattern)) workspace.seeds.push({ file, line, entry: seed.entry, idiom: seed.idiom });
    }
  }

  process.stdout.write(`${JSON.stringify({ repo, e18e: values.e18e, workspaces: [...workspaces.values()] }, null, 2)}\n`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  process.stderr.write(`inventory: ${error.message}\n`);
  process.exitCode = 2;
}
