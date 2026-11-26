// The type checker of mutate.mjs's type mode: the compiler that the project's
// own `tsc` command runs, over the project's own tsconfig, with mutated text
// held in memory. TypeScript 6 or older checks through its compiler API,
// TypeScript 7 through its unstable API, whose file-system hook serves each
// mutant. Nothing is written: no program emits, and the TypeScript 6 host
// refuses every write, so other sessions keep building the same tree.
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// The package of the tsc that `npx tsc` runs from `cwd`: the first
// node_modules/.bin/tsc from `cwd` up, followed to its file, and the nearest
// package.json above that file. In a repo whose `typescript` is an alias of
// TypeScript 6 for tools and whose `tsc` is TypeScript 7, it is TypeScript 7.
function tscPackage(cwd) {
  const searched = [];
  for (let dir = resolve(cwd); !searched.includes(dir); dir = dirname(dir)) {
    searched.push(dir);
    let bin;
    try {
      bin = realpathSync(join(dir, 'node_modules', '.bin', 'tsc'));
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (let root = dirname(bin); ; root = dirname(root)) {
      try {
        return { root, manifest: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) };
      } catch (error) {
        if (error.code !== 'ENOENT' || dirname(root) === root) throw error;
      }
    }
  }
  throw new Error(`no node_modules/.bin/tsc in ${searched.join(', ')}: the type mode checks with the compiler the project's tsc runs`);
}

// Returns the checker of the project's own compiler for `tsconfig`:
// { compiler, check(overrides), close() }. check(overrides) type-checks the
// tsconfig's program in which each absolute path in `overrides` reads as its
// text there and every other file reads from disk, and returns
// { has(file), errors(file) }. close() stops the compiler.
export async function projectChecker(cwd, tsconfig) {
  const { root, manifest } = tscPackage(cwd);
  const compiler = `typescript ${manifest.version}`;
  // The package resolves its own files, as a file of the package would.
  const requireFromPackage = createRequire(join(root, 'package.json'));
  if (Number(manifest.version.split('.')[0]) >= 7) {
    const sync = requireFromPackage.resolve(`${manifest.name}/unstable/sync`);
    return { compiler, ...nativeChecker(await import(pathToFileURL(sync)), compiler, cwd, tsconfig) };
  }
  const ts = requireFromPackage(root);
  return { compiler, check: typeChecker(ts, tsconfig), close() {} };
}

// TypeScript 7: one API server for the run. Each check serves its overrides
// through the file-system hook (undefined reads the file from disk) and opens
// a snapshot that names the files whose text changed since the last check.
// A check's result stays readable until close(), which disposes every
// snapshot: mutate.mjs reads the unmutated check again beside each mutant. A
// referenced project's files are its sources, as an editor reads them: the
// API's project system follows a reference to its source, not its output.
function nativeChecker({ API, DiagnosticCategory }, compiler, cwd, tsconfig) {
  let current = new Map();
  const api = new API({ cwd, fs: { readFile: (file) => current.get(resolve(file)) } });
  // The chain of a message, indented as TypeScript 6 flattens it with '\n'.
  // messageChain is optional (dist/api/sync/types.d.ts, Diagnostic).
  const flatten = ({ text, messageChain = [] }, depth) =>
    [`${'  '.repeat(depth)}${text}`, ...messageChain.flatMap((link) => flatten(link, depth + 1))];

  const check = (overrides) => {
    const changed = [...new Set([...current.keys(), ...overrides.keys()])];
    current = overrides;
    const snapshot = api.updateSnapshot({ openProjects: [tsconfig], fileChanges: { changed } });
    // undefined for a config the snapshot did not open (dist/api/sync/api.d.ts, Snapshot.getProject).
    const project = snapshot.getProject(tsconfig);
    if (!project) throw new Error(`${tsconfig} did not open as a project of ${compiler}`);
    const { program } = project;
    return {
      has: (file) => program.getSourceFile(file) !== undefined,
      // The errors TypeScript reports in one file, each at its 1-based line:
      // a diagnostic's pos counts UTF-16 code units, as a JS string does.
      errors(file) {
        if (program.getSourceFile(file) === undefined) return [];
        const text = overrides.get(file) ?? readFileSync(file, 'utf8');
        return [...program.getSyntacticDiagnostics(file), ...program.getSemanticDiagnostics(file)]
          .filter((diagnostic) => diagnostic.category === DiagnosticCategory.Error)
          .map((diagnostic) => ({
            file,
            line: text.slice(0, diagnostic.pos).split('\n').length,
            code: diagnostic.code,
            message: flatten(diagnostic, 0).join('\n'),
          }));
      },
    };
  };
  return { check, close: () => api.close() };
}

// TypeScript 6 or older: returns check(overrides) over the compiler API.
// Unchanged files are parsed once and shared between checks.
function typeChecker(ts, tsconfig) {
  const configErrors = [];
  const parsed = ts.getParsedCommandLineOfConfigFile(tsconfig, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => configErrors.push(diagnostic),
  });
  if (!parsed || configErrors.length) {
    throw new Error(`${tsconfig} does not parse: ${configErrors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join('; ')}`);
  }
  // A check reads sources, never a referenced project's built declarations:
  // those are stale against a mutant. Project references and composite are
  // dropped for that reason, as an editor reads the source of a reference.
  const options = {
    ...parsed.options,
    noEmit: true,
    composite: false,
    incremental: false,
    tsBuildInfoFile: undefined,
    declaration: false,
    declarationMap: false,
    emitDeclarationOnly: false,
    sourceMap: false,
  };
  const host = ts.createCompilerHost(options, true);
  const readFromDisk = host.readFile.bind(host);
  const parseFromDisk = host.getSourceFile.bind(host);
  const parsedFromDisk = new Map();
  // The program would read through this instead of getSourceFile.
  delete host.getSourceFileByPath;
  host.writeFile = (file) => {
    throw new Error(`the type check writes nothing, yet TypeScript asked to write ${file}`);
  };
  let oldProgram;

  return (overrides) => {
    host.readFile = (file) => overrides.get(resolve(file)) ?? readFromDisk(file);
    host.getSourceFile = (file, languageVersion, onError, shouldCreate) => {
      const text = overrides.get(resolve(file));
      if (text !== undefined) return ts.createSourceFile(file, text, languageVersion, true);
      if (!parsedFromDisk.has(file)) parsedFromDisk.set(file, parseFromDisk(file, languageVersion, onError, shouldCreate));
      return parsedFromDisk.get(file);
    };
    const program = ts.createProgram({ rootNames: parsed.fileNames, options, host, oldProgram });
    oldProgram = program;
    return {
      has: (file) => program.getSourceFile(file) !== undefined,
      // The errors TypeScript reports in one file, each at its 1-based line.
      errors(file) {
        const source = program.getSourceFile(file);
        if (!source) return [];
        return [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)]
          .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
          .map((diagnostic) => ({
            file,
            line: source.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1,
            code: diagnostic.code,
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          }));
      },
    };
  };
}
