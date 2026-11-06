// Runs the probes behind catalog claims, so a mapping or a gap stays recorded
// only while running code agrees with it.
//
// A catalog entry, `catalog/<id>.mjs`, default-exports
//   { apis, reviewedAt, flags?, env?, replaces?, idioms?, lint? }
//   replaces  { '<package>@<version>[/<subpath>]': { <member>[: <case>]: { native(), package(module), gap? | improves? } } }
//   idioms    { <name>: { native(), idiom(), gap? | improves? } }
//   lint      { <name>: { eslint: '<version>', plugin: '<package>@<version>', rule, code } }
// `package(module, { url, load })` gets the package's root export, or its
// subpath export when the key names one; the URL it was loaded from, for a
// probe that runs the package in a child process; and `load(spec)`, which
// imports another export of an installed package (`@noble/hashes/hmac.js`
// needs `sha256` from `@noble/hashes/sha2.js`). `flags` (Node CLI flags) and `env` (environment variables)
// are what the entry's native APIs need; the probes run with them, so a probe
// that fails without them is the evidence they are needed.
//
// Claims and verdicts:
//   a row without `gap` claims native() and the other side give deep-equal
//     results: `holds`, or `broken` when they differ or native() throws.
//   a row with `gap` claims they differ, or that native() throws: `holds`, or
//     `gap-closed` when they are now equal (the native API caught up).
//   a row with `improves` (Node does better than the other side) claims the
//     same difference: `holds`, or `improvement-lost` when they are now equal
//     (Node lost the better behaviour, or the package caught up).
//   a lint row claims the rule reports `code`: `holds`, or `broken`.
//   `probe-error`: the package side or the probe itself failed, or the row
//     lacks the functions it must run, so the row proves nothing. A key that
//     resolves to a Node built-in (an npm `buffer` or `string_decoder` keyed
//     by its bare name) is a `loads` probe-error: key a file of the package.
// Rows of an entry with `flags` or `env` carry them, so a report can name them.
//
// Probes judge the Node they run on, so every run is refused unless that Node
// is the one the surface snapshot was built on (`--surface`, default
// surface.json in this script's skill directory): the current LTS.
//
//   node scripts/probe.mjs [--catalog <dir>] [--entry <id>]...
//     Installs every `<package>@<version>` the selected entries name into one
//     scratch directory (removed afterwards) and runs their rows. Packages keep
//     their real names, so a plugin finds its peer (eslint-plugin-unicorn needs
//     `eslint`); the catalog therefore probes one version of each package, and
//     two versions of one package is refused. With `--entry`, only the selected
//     entry files are read.
//   node scripts/probe.mjs --site <probe.mjs> --from <workspace>
//     Runs one probe module of the same shape, whose `replaces` keys are bare
//     package names resolved the way <workspace> resolves them; nothing is
//     installed and nothing is written into <workspace>.
//
// Stdout is one JSON document: { rows: [{ entry, group, member, claim, verdict,
// native, other }] }. Exit 0: every row holds. Exit 1: a row does not hold.
// Exit 2: the run failed (install, import, timeout), reason on stderr.
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempDisposable, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { text } from 'node:stream/consumers';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspect, isDeepStrictEqual, parseArgs, promisify } from 'node:util';
import { parseSpec, readCatalog } from './catalog.mjs';

const self = fileURLToPath(import.meta.url);
const skill = fileURLToPath(new URL('..', import.meta.url));

async function settle(run) {
  try {
    return { value: await run() };
  } catch (error) {
    return { threw: error?.code ?? error?.name ?? String(error), message: error?.message };
  }
}

const preview = (outcome) =>
  'threw' in outcome
    ? `threw ${outcome.threw}`
    : inspect(outcome.value, { depth: 4, breakLength: Infinity, maxStringLength: 200 });

async function compare(row, side, ...args) {
  const claim = row.gap || row.improves ? 'differs' : 'equal';
  const missing = ['native', side].filter((name) => typeof row[name] !== 'function');
  if (missing.length > 0) return { claim, verdict: 'probe-error', other: `the row has no ${missing.join('() or ')}()` };
  const native = await settle(() => row.native());
  const theirs = await settle(() => row[side](...args));
  const evidence = { native: preview(native), other: preview(theirs) };
  if ('threw' in theirs) return { claim, verdict: 'probe-error', ...evidence };
  const equal = !('threw' in native) && isDeepStrictEqual(native.value, theirs.value);
  if (row.gap) return { claim, verdict: equal ? 'gap-closed' : 'holds', ...evidence };
  if (row.improves) return { claim, verdict: equal ? 'improvement-lost' : 'holds', ...evidence };
  return { claim, verdict: equal ? 'holds' : 'broken', ...evidence };
}

async function lint(row, load) {
  const claim = 'reports';
  try {
    const { Linter } = await load(`eslint@${row.eslint}`);
    const { default: plugin } = await load(row.plugin);
    const [namespace] = row.rule.split('/');
    const messages = new Linter({ configType: 'flat' }).verify(
      row.code,
      [{ plugins: { [namespace]: plugin }, rules: { [row.rule]: 'error' } }],
      'probe.mjs',
    );
    const reports = messages.filter((message) => message.ruleId === row.rule).map((message) => message.message);
    if (reports.length > 0) return { claim, verdict: 'holds', other: reports.join('; ') };
    return { claim, verdict: 'broken', other: preview({ value: messages }) };
  } catch (error) {
    return { claim, verdict: 'probe-error', other: preview({ threw: error?.message ?? String(error) }) };
  }
}

// Runs inside a child Node started with --experimental-import-meta-resolve,
// the only way `import.meta.resolve` honours a parent other than this file.
async function child() {
  const job = JSON.parse(await text(process.stdin));
  const { default: entry } = await import(job.module);
  const parent = pathToFileURL(join(job.from, 'package.json')).href;
  // A bare name Node knows as a built-in (`buffer`, `string_decoder`,
  // `util/types`) resolves to the built-in even when node_modules has a
  // package of that name, so the probe would compare Node with itself.
  const resolveSpec = (spec) => {
    const parsed = parseSpec(spec);
    if (!parsed) throw new Error(`${spec} is not <package>[@<version>][/<subpath>]`);
    const url = import.meta.resolve(`${parsed.name}${parsed.subpath ?? ''}`, parent);
    if (url.startsWith('node:')) {
      throw new Error(`${spec} resolves to the Node built-in ${url}; key a file of the package (${parsed.name}@<version>/<file>)`);
    }
    return url;
  };
  const load = (spec) => import(resolveSpec(spec));
  const rows = [];
  for (const [spec, members] of Object.entries(entry.replaces ?? {})) {
    const loaded = await settle(async () => {
      const url = resolveSpec(spec);
      return { url, module: await import(url) };
    });
    if ('threw' in loaded) {
      const other = loaded.message ? `${preview(loaded)}: ${loaded.message}` : preview(loaded);
      rows.push({ group: spec, member: '*', claim: 'loads', verdict: 'probe-error', other });
      continue;
    }
    const { module, url } = loaded.value;
    for (const [member, row] of Object.entries(members)) {
      rows.push({ group: spec, member, ...(await compare(row, 'package', module, { url, load })) });
    }
  }
  for (const [member, row] of Object.entries(entry.idioms ?? {})) {
    rows.push({ group: 'idioms', member, ...(await compare(row, 'idiom')) });
  }
  for (const [member, row] of Object.entries(entry.lint ?? {})) {
    rows.push({ group: 'lint', member, ...(await lint(row, load)) });
  }
  process.stdout.write(JSON.stringify(rows));
}

async function runEntry({ id, module, flags, env }, from) {
  const probe = spawn(process.execPath, ['--experimental-import-meta-resolve', ...flags, self, '--child'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, ...env },
    signal: AbortSignal.timeout(120_000),
    killSignal: 'SIGKILL',
  });
  probe.stdin.end(JSON.stringify({ module, from }));
  const [output, [status]] = await Promise.all([text(probe.stdout), once(probe, 'close')]);
  if (status !== 0) throw new Error(`the probes of ${id} exited ${status}`);
  return JSON.parse(output).map((row) => ({
    entry: id,
    ...(flags.length > 0 && { flags }),
    ...(Object.keys(env).length > 0 && { env }),
    ...row,
  }));
}

const runnable = ({ id, url, entry }) => ({ id, module: url, flags: entry.flags ?? [], env: entry.env ?? {}, entry });

async function entriesIn(directory, selected) {
  const catalog = await readCatalog(directory, selected);
  const missing = (selected ?? []).filter((id) => !catalog.some((entry) => entry.id === id));
  if (missing.length > 0) throw new Error(`no catalog entry named ${missing.join(', ')} in ${directory}`);
  if (catalog.length === 0) throw new Error(`no catalog entries in ${directory}`);
  return catalog.map(runnable);
}

// The `<package>@<version>` each entry needs installed; subpaths of one
// version install once.
function installsOf(entry) {
  const lint = Object.values(entry.lint ?? {}).flatMap((row) => [`eslint@${row.eslint}`, row.plugin]);
  return [...Object.keys(entry.replaces ?? {}), ...lint].map((spec) => {
    const parsed = parseSpec(spec);
    if (!parsed?.version) throw new Error(`${spec} is not <package>@<version>[/<subpath>]`);
    return `${parsed.name}@${parsed.version}`;
  });
}

async function install(directory, specs) {
  const versions = Map.groupBy(specs, (spec) => parseSpec(spec).name);
  const conflicts = [...versions].filter(([, all]) => all.length > 1).map(([, all]) => all.join(' and '));
  if (conflicts.length > 0) throw new Error(`the catalog probes two versions of one package: ${conflicts.join('; ')}`);
  await writeFile(join(directory, 'package.json'), '{ "private": true }\n');
  try {
    await promisify(execFile)(
      'npm',
      ['install', '--no-save', '--no-package-lock', '--ignore-scripts', '--no-audit', '--no-fund', ...specs],
      { cwd: directory },
    );
  } catch (error) {
    throw new Error(`npm install ${specs.join(' ')} failed: ${error.stderr?.trim() || error.message}`);
  }
}

async function refuseOffSurface(path) {
  let surface;
  try {
    surface = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`no surface at ${path}; build it with surface.mjs --write first`);
    throw error;
  }
  if (surface.node !== process.version) {
    throw new Error(`the surface is ${surface.node} but this is Node ${process.version}; probe on ${surface.node}`);
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      catalog: { type: 'string', default: join(skill, 'catalog') },
      surface: { type: 'string', default: join(skill, 'surface.json') },
      entry: { type: 'string', multiple: true },
      site: { type: 'string' },
      from: { type: 'string' },
      child: { type: 'boolean', default: false },
    },
  });
  if (values.child) {
    await child();
    return 0;
  }
  await refuseOffSurface(values.surface);

  let rows;
  if (values.site) {
    if (!values.from) throw new Error('--site needs --from <workspace>');
    const url = pathToFileURL(resolve(values.site)).href;
    const { default: entry } = await import(url);
    rows = await runEntry(runnable({ id: basename(values.site, '.mjs'), url, entry }), resolve(values.from));
  } else {
    const entries = await entriesIn(values.catalog, values.entry);
    await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-probe-'));
    const specs = [...new Set(entries.flatMap(({ entry }) => installsOf(entry)))];
    if (specs.length > 0) await install(scratch.path, specs);
    rows = [];
    for (const entry of entries) rows.push(...(await runEntry(entry, scratch.path)));
  }
  process.stdout.write(`${JSON.stringify({ rows }, null, 2)}\n`);
  return rows.every((row) => row.verdict === 'holds') ? 0 : 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  process.stderr.write(`probe: ${error.message}\n`);
  process.exitCode = 2;
}
