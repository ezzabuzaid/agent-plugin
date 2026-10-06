#!/usr/bin/env node
// Copies a git working tree into a scratch directory for mutation proofs, or
// removes such a copy.
//
//   node scratch-copy.mjs --repo <git root> [--dest <dir>] [--min-free-gb 1]
//                         [--include-ignored <name>]... [--exclude-ignored <name>]...
//   node scratch-copy.mjs --remove <copy>
//
// The copy holds what the working tree holds: tracked and untracked files with
// their uncommitted content, symlinks recreated verbatim (dangling ones too), and
// every git-ignored path except a denylist of caches and secrets
// (.nx .env* .DS_Store coverage test-results*). --include-ignored <name>
// brings a denylisted name back; --exclude-ignored <name> leaves one more out.
// Without --dest the copy goes to a new directory under the system temp dir.
//
// Checks after copying: every node_modules link into the repo must resolve
// inside the copy (`links.bad`), every workspace package's main/exports target
// the repo has must exist in the copy too (`missingBuilds`; targets the repo
// never built are listed in `unbuilt` and fail nothing), and every cloned
// node_modules must hold the same entries as its source (`shortNodeModules`).
//
// Prints one JSON object on stdout. Exit codes:
//   0  copy made and every check passed
//   2  copy made, but a check found a problem (see the JSON); the copy is kept
//   1  failed; nothing is left behind
//
// --remove refuses any directory without this script's manifest, kills the
// processes whose command line names the copy (an nx daemon started there), and
// deletes it.
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  constants,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  statfsSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, matchesGlob, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const MANIFEST = '.write-test-copy.json';
// git never lists `.git` itself, so it needs no entry here.
const DENYLIST = ['.nx', '.env*', '.DS_Store', 'coverage', 'test-results*'];

const { values } = parseArgs({
  options: {
    repo: { type: 'string' },
    dest: { type: 'string' },
    'min-free-gb': { type: 'string', default: '1' },
    'include-ignored': { type: 'string', multiple: true, default: [] },
    'exclude-ignored': { type: 'string', multiple: true, default: [] },
    remove: { type: 'string' },
  },
});

function fail(error, details = {}) {
  console.log(JSON.stringify({ error, ...details }));
  process.exit(1);
}

const exists = (path) => lstatSync(path, { throwIfNoEntry: false }) !== undefined;
const insideOf = (root, path) => !relative(root, path).startsWith('..');

function realpathOrNull(path) {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

// Free space on the volume that will hold `path`, measured at its nearest
// existing ancestor because `path` itself doesn't exist yet.
function freeGb(path) {
  let at = path;
  while (!exists(at)) at = dirname(at);
  const { bavail, bsize } = statfsSync(at);
  return (bavail * bsize) / 1e9;
}

if (values.remove !== undefined) {
  removeCopy(resolve(values.remove));
} else {
  makeCopy();
}

// Deletes a copy this script made. The manifest is the proof it made it.
function removeCopy(copy) {
  if (!exists(join(copy, MANIFEST))) {
    fail(`refusing to remove ${copy}: no ${MANIFEST} manifest, so scratch-copy did not make it`);
  }
  const killedPids = killProcessesUsing(copy);
  rmSync(copy, { recursive: true, force: true });
  console.log(JSON.stringify({ removed: copy, killedPids }));
}

// Processes started from the copy (an nx daemon, plugin workers) outlive the run
// that started them. The copy's path is unique, so matching it in argv touches
// only those processes; never match anything broader.
function killProcessesUsing(copy) {
  const paths = [copy, realpathSync(copy)];
  const pids = execFileSync('ps', ['-A', '-o', 'pid=,command='], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim().match(/^(\d+)\s+(.*)$/))
    .filter((match) => match && Number(match[1]) !== process.pid && paths.some((path) => match[2].includes(path)))
    .map((match) => Number(match[1]));
  for (const pid of pids) process.kill(pid, 'SIGKILL');
  return pids;
}

function makeCopy() {
  if (!values.repo) fail('--repo <git root> is required');
  const repo = realpathSync(resolve(values.repo));
  const dest = resolve(values.dest ?? join(tmpdir(), `write-test-copy-${basename(repo)}-${randomUUID()}`));

  const minFreeGb = Number(values['min-free-gb']);
  const freeGbBefore = freeGb(dest);
  if (freeGbBefore < minFreeGb) {
    fail(`only ${freeGbBefore.toFixed(2)} GB free at the destination; --min-free-gb is ${minFreeGb}`, { freeGbBefore });
  }

  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const entries = new Set(git('ls-files', '-z', '-co', '--exclude-standard'));

  const matches = (entry, patterns) => patterns.some((pattern) => matchesGlob(basename(entry), pattern));
  const leftOut = (entry) =>
    (matches(entry, DENYLIST) && !matches(entry, values['include-ignored'])) || matches(entry, values['exclude-ignored']);
  const allIgnored = git('ls-files', '-z', '-o', '-i', '--exclude-standard', '--directory')
    .map((entry) => entry.replace(/\/$/, ''))
    // A directory holding nothing but ignored content is listed along with every
    // level below it; cloning each level would copy the same files into
    // themselves, so keep the deepest entries only.
    .filter((entry, _, all) => !all.some((other) => other.startsWith(`${entry}/`)));
  const ignored = allIgnored.filter((entry) => !leftOut(entry));
  const ignoredLeftOut = allIgnored.filter(leftOut);

  // The copy is created here and nowhere else, so a failure can only ever
  // remove a directory this run made.
  if (exists(dest)) fail(`destination already exists: ${dest}`);
  mkdirSync(dest, { recursive: true });
  let report;
  try {
    const { files, skipped } = copyWorkingTree({ repo, dest, entries, ignored });
    report = {
      copy: dest,
      filesCopied: Object.keys(files).length,
      skipped,
      ignoredCopied: ignored,
      ignoredLeftOut,
      ...checkCopy({ repo, dest, ignored }),
      freeGbBefore,
      freeGbAfter: freeGb(dest),
    };
    const manifest = { source: repo, createdAt: new Date().toISOString(), files, skipped, ignoredLeftOut };
    writeFileSync(join(dest, MANIFEST), JSON.stringify(manifest, null, 2));
  } catch (error) {
    rmSync(dest, { recursive: true, force: true });
    fail(`copy failed, partial copy removed: ${error.code ?? ''} ${error.message}`.trim());
  }
  console.log(JSON.stringify(report));
  if (report.shortNodeModules.length || report.links.bad.length || report.missingBuilds.length) process.exitCode = 2;
}

function copyWorkingTree({ repo, dest, entries, ignored }) {
  const files = {};
  const skipped = [];
  for (const entry of entries) {
    const from = join(repo, entry);
    const to = join(dest, entry);
    const stat = lstatSync(from, { throwIfNoEntry: false });
    if (!stat) {
      skipped.push({ path: entry, reason: 'deleted in working tree' });
      continue;
    }
    mkdirSync(dirname(to), { recursive: true });
    if (stat.isSymbolicLink()) {
      symlinkSync(readlinkSync(from), to);
      continue;
    }
    copyFileSync(from, to, constants.COPYFILE_FICLONE);
    files[entry] = createHash('sha256').update(readFileSync(from)).digest('hex');
  }
  for (const entry of ignored) {
    const from = join(repo, entry);
    const to = join(dest, entry);
    mkdirSync(dirname(to), { recursive: true });
    const stat = lstatSync(from);
    if (stat.isSymbolicLink()) symlinkSync(readlinkSync(from), to);
    else if (stat.isDirectory()) cloneDirectory(from, to);
    else copyFileSync(from, to, constants.COPYFILE_FICLONE);
  }
  return { files, skipped };
}

// One clone call per directory: node_modules holds tens of thousands of files.
// `/bin/cp` by absolute path, because a GNU cp earlier on PATH takes other flags.
function cloneDirectory(from, to) {
  if (process.platform === 'darwin') execFileSync('/bin/cp', ['-cRP', from, to]);
  else execFileSync('cp', ['-a', '--reflink=auto', from, to]);
}

function checkCopy({ repo, dest, ignored }) {
  const nodeModules = ignored.filter((entry) => basename(entry) === 'node_modules');

  const shortNodeModules = nodeModules
    .map((entry) => ({ path: entry, missing: missingEntries(join(repo, entry), join(dest, entry)) }))
    .filter(({ missing }) => missing.length);

  // A workspace link that still resolves into the original repo makes every
  // mutation in that package invisible to the tests run in the copy.
  const realDest = realpathSync(dest);
  const links = { ok: 0, bad: [] };
  const missingBuilds = [];
  const unbuilt = [];
  for (const link of nodeModules.flatMap((modules) => linksIn(dest, modules))) {
    const original = realpathOrNull(join(repo, link));
    // Dangling in the repo too (a deleted workspace package): nothing to check.
    if (!original || !insideOf(repo, original)) continue;
    const copied = realpathOrNull(join(dest, link));
    if (!copied || !insideOf(realDest, copied)) {
      links.bad.push({ link, resolvesTo: copied });
      continue;
    }
    links.ok += 1;
    const { leftOut, unbuilt: neverBuilt } = missingTargets({ repo, dest, packageDir: copied });
    missingBuilds.push(...leftOut);
    unbuilt.push(...neverBuilt);
  }
  return { shortNodeModules, links, missingBuilds, unbuilt };
}

// cp skips some entries (sockets) and still exits 0, so compare each cloned
// node_modules, and each @scope in it, with its source by name.
function missingEntries(from, to) {
  const missing = [];
  const copied = new Set(readdirSync(to));
  for (const name of readdirSync(from)) {
    if (!copied.has(name)) missing.push(name);
    else if (name.startsWith('@') && lstatSync(join(from, name)).isDirectory()) {
      missing.push(...missingEntries(join(from, name), join(to, name)).map((inner) => `${name}/${inner}`));
    }
  }
  return missing;
}

// The symlinks directly in a node_modules directory and in its @scopes.
function linksIn(dest, modules) {
  return readdirSync(join(dest, modules))
    .flatMap((name) =>
      name.startsWith('@') ? readdirSync(join(dest, modules, name)).map((inner) => `${name}/${inner}`) : [name],
    )
    .map((name) => join(modules, name))
    .filter((link) => lstatSync(join(dest, link)).isSymbolicLink());
}

// The `main` and `exports` targets of a workspace package that the copy lacks,
// split by whether the repo has them. Only a target the copy left out is a
// problem with the copy; one the repo never built is listed and nothing more.
// Subpath patterns (`./dist/lib/*`) name no single file and are skipped.
function missingTargets({ repo, dest, packageDir }) {
  const manifestPath = join(packageDir, 'package.json');
  if (!exists(manifestPath)) return { leftOut: [], unbuilt: [] };
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const targets = manifest.main ? [manifest.main] : [];
  const walk = (value) => {
    if (typeof value === 'string') targets.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(manifest.exports);
  const missing = [...new Set(targets)]
    .filter((target) => !target.includes('*') && !exists(join(packageDir, target)))
    .map((target) => relative(realpathSync(dest), join(packageDir, target)));
  return {
    leftOut: missing
      .filter((path) => exists(join(repo, path)))
      .map((path) => ({
        package: manifest.name,
        path,
        hint: `left out of the copy; add --include-ignored ${firstMissingSegment(dest, path)}`,
      })),
    unbuilt: missing.filter((path) => !exists(join(repo, path))).map((path) => ({ package: manifest.name, path })),
  };
}

// The name of the outermost directory on `path` that the copy doesn't have.
function firstMissingSegment(dest, path) {
  const segments = path.split('/');
  return segments.find((_, i) => !exists(join(dest, ...segments.slice(0, i + 1))));
}
