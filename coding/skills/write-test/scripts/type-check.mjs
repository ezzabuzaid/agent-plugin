// The type checker of mutate.mjs's type mode: the project's own TypeScript,
// through its compiler API, over the project's own tsconfig, with mutated text
// held in memory. Nothing is written: the host refuses every write and the
// program never emits, so other sessions keep building the same tree.
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

// The typescript the project itself resolves from `cwd`, as its own tsc would.
// Throws when there is none, or when it ships no compiler API (TypeScript 7's
// native port exports only its version from the package root).
export function projectTypeScript(cwd) {
  const require = createRequire(join(cwd, 'package.json'));
  const path = require.resolve('typescript');
  const ts = require(path);
  if (typeof ts.createProgram !== 'function') {
    throw new Error(`${path} (typescript ${ts.version}) has no compiler API (createProgram); the type mode needs TypeScript 6 or older`);
  }
  return ts;
}

// Returns check(overrides): a type check of the tsconfig's program in which
// each absolute path in `overrides` reads as its text there, and every other
// file reads from disk. Unchanged files are parsed once and shared between
// checks.
export function typeChecker(ts, tsconfig) {
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
