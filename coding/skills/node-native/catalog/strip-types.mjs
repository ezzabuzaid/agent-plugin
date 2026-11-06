// Running TypeScript files and stripping types from TypeScript source.
// Node 26 strips types itself (`node file.ts`) and has no
// --experimental-transform-types any more, so TypeScript that needs code
// generated (enum, namespace, parameter property, decorator) does not run.
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { run } from './support/child.mjs';
import { outcome as caught } from './support/outcome.mjs';
import { inScratch } from './support/scratch.mjs';

// One file each, in a CommonJS package: what needs no import.
const script = {
  'tsconfig.json': JSON.stringify({ compilerOptions: { module: 'commonjs', target: 'es2022', experimentalDecorators: true } }),
  'plain.ts': [
    'interface Point { x: number; y: number }',
    'const add = (a: Point): number => a.x + a.y;',
    'function first<T>(items: T[]): T | undefined { return items[0]; }',
    "console.log(JSON.stringify([add({ x: 1, y: 2 }), first<string>(['a'])]));",
  ].join('\n'),
  'enum.ts': 'enum Color { Red, Green }\nconsole.log(Color.Green, Color[0]);',
  'namespace.ts': 'namespace Shapes { export const sides = 4; }\nconsole.log(Shapes.sides);',
  'parameter-property.ts': 'class P { constructor(public x: number) {} }\nconsole.log(new P(3).x);',
  'decorator.ts': [
    'function sealed(target: any) { return class extends target { sealed = true; }; }',
    '@sealed class D {}',
    'console.log((new D() as any).sealed);',
  ].join('\n'),
};
// An ES module package whose files import each other.
const modules = {
  'package.json': JSON.stringify({ type: 'module' }),
  'tsconfig.json': JSON.stringify({
    compilerOptions: { module: 'nodenext', target: 'es2022', paths: { '@lib/*': ['./src/*'] } },
  }),
  'src/lib.ts': 'export interface Shape { sides: number }\nexport const two: number = 2;',
  'main.ts': "import type { Shape } from './src/lib.ts';\nimport { two } from './src/lib.ts';\nconst s: Shape = { sides: two };\nconsole.log(s.sides);",
  'type-import.ts': "import { Shape, two } from './src/lib.ts';\nconst s: Shape = { sides: two };\nconsole.log(s.sides);",
  'extensionless.ts': "import { two } from './src/lib';\nconsole.log(two);",
  'js-extension.ts': "import { two } from './src/lib.js';\nconsole.log(two);",
  'alias.ts': "import { two } from '@lib/lib.ts';\nconsole.log(two);",
};

// What a run printed, or how it failed (the first line that names an error).
const outcome = async (args, cwd) => {
  const { code, stdout, error } = await run(args, { cwd });
  return code === 0 ? stdout.trim() : `exit ${code}: ${error}`;
};
const natively = (tree, file) => inScratch(tree, (dir) => outcome([file], dir));
// The package runs `file`: `setup` adds its `files` and the Node `args` that
// load it (given the directory), with Node's own stripping off so the package
// does the work.
const loaded = (tree, file, setup) =>
  inScratch({ ...tree, ...setup.files }, (dir) => outcome(['--no-strip-types', ...setup.args(dir), file], dir));

const runs = (tree, file) => ({ tree, file });
const plain = runs(script, 'plain.ts');
const main = runs(modules, 'main.ts');
const needsCode = {
  enum: runs(script, 'enum.ts'),
  namespace: runs(script, 'namespace.ts'),
  'parameter property': runs(script, 'parameter-property.ts'),
  decorator: runs(script, 'decorator.ts'),
};
const resolution = {
  'type import without type': runs(modules, 'type-import.ts'),
  'extensionless import': runs(modules, 'extensionless.ts'),
  '.js import of a .ts file': runs(modules, 'js-extension.ts'),
  'path alias': runs(modules, 'alias.ts'),
};
const gaps = {
  enum: 'type stripping cannot run an enum: it needs generated code',
  namespace: 'type stripping cannot run a namespace that holds values',
  'parameter property': 'type stripping cannot run a constructor parameter property',
  decorator: 'type stripping cannot run a decorator',
  'type import without type': 'an import of a type needs `import type`; a plain import of it fails, since nothing exports it at run time',
  'extensionless import': 'an import needs its file extension: ./lib does not find ./lib.ts',
  '.js import of a .ts file': 'an import of ./lib.js does not find ./lib.ts',
  'path alias': 'tsconfig `paths` are not read: an alias does not resolve',
};

// Rows for one loader: `plain` maps; each case in `cases` is a gap.
function loader(member, setup, { mapped, cases }) {
  const rows = Object.fromEntries(
    mapped.map(({ tree, file }) => [
      tree === script ? member : `${member}: imports`,
      { native: () => natively(tree, file), package: (module, context) => loaded(tree, file, setup(module, context)) },
    ]),
  );
  for (const name of cases) {
    const { tree, file } = { ...needsCode, ...resolution }[name];
    rows[`${member}: ${name}`] = {
      gap: gaps[name],
      native: () => natively(tree, file),
      package: (module, context) => loaded(tree, file, setup(module, context)),
    };
  }
  return rows;
}

const codeCases = Object.keys(needsCode);
const allCases = [...codeCases, ...Object.keys(resolution)];
const preload = (flag, name, content) => ({ files: { [name]: content }, args: (dir) => [flag, join(dir, name)] });

// Source in, the value its last expression has once run.
const evaluate = (code) => vm.runInNewContext(code);
const codeOrName = (error) => error.code ?? error.name;
const sources = {
  typed: 'const add = (a: number, b: number): number => a + b;\ninterface P { x: number }\nadd(1, 2) as number;',
  generic: "function id<T>(value: T): T { return value; }\nid<string>('a');",
  enum: 'enum E { A, B }\nE.B;',
  namespace: 'namespace N { export const v = 4; }\nN.v;',
  'parameter property': 'class P { constructor(public x: number) {} }\nnew P(3).x;',
};
const stripped = (source) => caught(() => evaluate(stripTypeScriptTypes(source)), codeOrName);
// Rows for one transpiler `transform(module, source) -> js`.
function transpiler(member, transform) {
  const row = (source) => (module) => caught(() => evaluate(transform(module, source)), codeOrName);
  return {
    [member]: { native: () => stripped(sources.typed), package: row(sources.typed) },
    [`${member}: generic call`]: { native: () => stripped(sources.generic), package: row(sources.generic) },
    ...Object.fromEntries(
      ['enum', 'namespace', 'parameter property'].map((name) => [
        `${member}: ${name}`,
        { gap: `${gaps[name]}; stripTypeScriptTypes throws ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`, native: () => stripped(sources[name]), package: row(sources[name]) },
      ]),
    ),
    [`${member}: output text`]: {
      gap: 'keeps every position: the types become spaces, so no source map is needed but the text is not tidy',
      native: () => stripTypeScriptTypes(sources.typed),
      package: (module) => transform(module, sources.typed),
    },
  };
}

export default {
  apis: ['cli:--no-strip-types', 'module:module.stripTypeScriptTypes'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'tsx@4.23.15/esm/api': loader(
      'register',
      (module, { url }) => preload('--import', 'setup.mjs', `import { register } from ${JSON.stringify(url)};\nregister();\n`),
      { mapped: [plain, main], cases: allCases },
    ),
    'jiti@2.7.0': loader(
      'createJiti',
      // run.mjs imports the file named after it through jiti.
      (module, { url }) => ({
        files: { 'run.mjs': `import { createJiti } from ${JSON.stringify(url)};\nawait createJiti(import.meta.url).import('./' + process.argv[2]);\n` },
        args: (dir) => [join(dir, 'run.mjs')],
      }),
      { mapped: [plain, main], cases: [...codeCases, 'type import without type', 'extensionless import', '.js import of a .ts file'] },
    ),
    '@swc-node/register@1.12.1': loader(
      'register',
      // `node -r @swc-node/register`: the package root registers itself.
      (module, { url }) => ({ files: {}, args: () => ['--require', fileURLToPath(url)] }),
      { mapped: [plain], cases: codeCases },
    ),
    'ts-node@10.9.2': loader(
      'register',
      (module, { url }) => preload('--require', 'setup.cjs', `require(${JSON.stringify(fileURLToPath(url))}).register({ transpileOnly: true });\n`),
      { mapped: [plain], cases: codeCases },
    ),
    'esbuild-register@3.6.0/dist/node': loader(
      'register',
      (module, { url }) => preload('--require', 'setup.cjs', `require(${JSON.stringify(fileURLToPath(url))}).register();\n`),
      { mapped: [plain], cases: codeCases },
    ),
    'typescript@5.9.3': transpiler(
      'transpileModule',
      ({ default: ts }, source) =>
        ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.Preserve } }).outputText,
    ),
    'esbuild@0.28.2': transpiler('transformSync', ({ transformSync }, source) => transformSync(source, { loader: 'ts' }).code),
    '@swc/core@1.16.22': transpiler(
      'transformSync',
      ({ default: swc }, source) => swc.transformSync(source, { jsc: { parser: { syntax: 'typescript' }, target: 'esnext' } }).code,
    ),
  },
};
