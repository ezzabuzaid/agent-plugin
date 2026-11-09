// Checks the committed catalog against the committed surface snapshot, so an
// entry that names a missing API or a row that cannot be probed fails before
// any refresh runs.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { memberOf, parseSpec, readCatalog } from './catalog.mjs';

const skill = fileURLToPath(new URL('..', import.meta.url));
const VERSION = /^v(\d+)\.(\d+)\.(\d+)$/;
const versioned = (spec) => Boolean(parseSpec(spec ?? '')?.version);
const LINT_STATES = ['on', 'failed', 'off', 'unmeasured'];

const committed = async () => ({
  surface: JSON.parse(await readFile(join(skill, 'surface.json'), 'utf8')),
  entries: await readCatalog(join(skill, 'catalog')),
});

const newer = (a, b) => {
  const [x, y] = [a.match(VERSION).slice(1).map(Number), b.match(VERSION).slice(1).map(Number)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

test('the catalog has entries', async () => {
  const { entries } = await committed();

  assert.ok(entries.length > 0, 'catalog/ holds no entry modules');
});

test('every entry names APIs the surface has and a review no newer than the surface', async () => {
  const { surface, entries } = await committed();

  const problems = entries.flatMap(({ id, entry }) => [
    ...(Array.isArray(entry.apis) && entry.apis.length > 0 ? [] : [`${id}: no apis`]),
    ...(entry.apis ?? []).filter((api) => !(api in surface.apis)).map((api) => `${id}: ${api} is not in surface.json`),
    ...(VERSION.test(entry.reviewedAt ?? '')
      ? newer(entry.reviewedAt, surface.node) > 0
        ? [`${id}: reviewedAt ${entry.reviewedAt} is newer than the surface ${surface.node}`]
        : []
      : [`${id}: reviewedAt ${entry.reviewedAt} is not a release`]),
  ]);

  assert.deepEqual(problems, []);
});

test('no entry recommends an API Node itself deprecated or marked legacy', async () => {
  const { surface, entries } = await committed();

  const retired = entries.flatMap(({ id, entry }) =>
    (entry.apis ?? [])
      .filter((api) => [0, 3].includes(surface.apis[api]?.stability))
      .map((api) => `${id}: ${api} has stability ${surface.apis[api].stability}`),
  );

  assert.deepEqual(retired, []);
});

test('every entry claims at least one replacement a probe can check', async () => {
  const { entries } = await committed();

  const empty = entries
    .filter(({ entry }) => Object.keys(entry.replaces ?? {}).length + Object.keys(entry.idioms ?? {}).length === 0)
    .map(({ id }) => id);

  assert.deepEqual(empty, []);
});

test('every replaced member and idiom carries both sides of its probe, every gap says what is missing, every improvement what Node does better, and no row is both', async () => {
  const { entries } = await committed();

  const rows = entries.flatMap(({ id, entry }) => [
    ...Object.entries(entry.replaces ?? {}).flatMap(([spec, members]) => [
      ...(versioned(spec) ? [] : [{ where: `${id} ${spec}`, problem: 'is not <package>@<version>[/<subpath>]' }]),
      ...Object.entries(members).map(([key, row]) =>
        /^[\w$]+$/.test(memberOf(key))
          ? { where: `${id} ${spec} ${key}`, row, side: 'package' }
          : { where: `${id} ${spec} ${key}`, problem: 'is not <member> or <member>: <case>' },
      ),
    ]),
    ...Object.entries(entry.idioms ?? {}).map(([name, row]) => ({ where: `${id} idioms ${name}`, row, side: 'idiom' })),
  ]);
  const problems = rows.flatMap(({ where, row, side, problem }) => {
    if (problem) return [`${where} ${problem}`];
    return [
      ...(typeof row.native === 'function' ? [] : [`${where}: no native()`]),
      ...(typeof row[side] === 'function' ? [] : [`${where}: no ${side}()`]),
      ...('gap' in row && !(typeof row.gap === 'string' && row.gap.trim()) ? [`${where}: gap does not say what is missing`] : []),
      ...('improves' in row && !(typeof row.improves === 'string' && row.improves.trim())
        ? [`${where}: improves does not say what Node does better`]
        : []),
      ...('gap' in row && 'improves' in row ? [`${where}: is a gap and an improvement; it is one or the other`] : []),
    ];
  });

  assert.deepEqual(problems, []);
});

test('every idiom seed finds the idiom it describes and not the native code that replaces it', async () => {
  const { entries } = await committed();

  const problems = entries.flatMap(({ id, entry }) =>
    Object.entries(entry.idioms ?? {})
      .filter(([, row]) => 'seed' in row)
      .flatMap(([name, row]) => {
        let seed;
        try {
          seed = new RegExp(row.seed);
        } catch (error) {
          return [`${id} ${name}: seed does not compile (${error.message})`];
        }
        return [
          ...(seed.test(String(row.idiom)) ? [] : [`${id} ${name}: seed does not match its idiom()`]),
          ...(seed.test(String(row.native)) ? [`${id} ${name}: seed also matches its native()`] : []),
        ];
      }),
  );

  assert.deepEqual(problems, []);
});

test('flags and env an entry needs are CLI flags and string variables', async () => {
  const { entries } = await committed();

  const problems = entries.flatMap(({ id, entry }) => [
    ...(entry.flags ?? []).filter((flag) => !/^--[\w-]+(=.*)?$/.test(flag)).map((flag) => `${id}: flag ${flag}`),
    ...Object.entries(entry.env ?? {})
      .filter(([name, value]) => !/^[A-Z_][A-Z0-9_]*$/.test(name) || typeof value !== 'string')
      .map(([name]) => `${id}: env ${name}`),
  ]);

  assert.deepEqual(problems, []);
});

test('every lint row names the eslint and plugin versions, the rule, and code the rule reports', async () => {
  const { entries } = await committed();

  const problems = entries.flatMap(({ id, entry }) =>
    Object.entries(entry.lint ?? {}).flatMap(([name, row]) => [
      ...(/^\d+\.\d+\.\d+$/.test(row.eslint ?? '') ? [] : [`${id} lint ${name}: eslint is not a version`]),
      ...(versioned(row.plugin) ? [] : [`${id} lint ${name}: plugin is not <package>@<version>`]),
      ...(/^(@[^/]+|[^@/][^/]*)\/.+$/.test(row.rule ?? '') ? [] : [`${id} lint ${name}: rule is not <plugin>/<rule>`]),
      ...(typeof row.code === 'string' && row.code.trim() ? [] : [`${id} lint ${name}: no code`]),
    ]),
  );

  assert.deepEqual(problems, []);
});

test('every lint row says one thing about its rule: on in a config, failed on real code, off for a reason, or unmeasured', async () => {
  const { entries } = await committed();
  const { default: configs } = await import(new URL('../catalog/support/lint-configs.mjs', import.meta.url));

  const problems = entries.flatMap(({ id, entry }) =>
    Object.entries(entry.lint ?? {}).flatMap(([name, row]) => {
      const states = LINT_STATES.filter((state) => state in row);
      if (states.length !== 1) return [`${id} lint ${name}: has ${states.length} of ${LINT_STATES.join(', ')}`];
      const [state] = states;
      return [
        ...(typeof row[state] === 'string' && row[state].trim() ? [] : [`${id} lint ${name}: ${state} says nothing`]),
        ...(state === 'on' && !(row.on in configs) ? [`${id} lint ${name}: on names ${row.on}, not a config`] : []),
      ];
    }),
  );

  assert.deepEqual(problems, []);
});

test('a rule has the same state in every row that names it', async () => {
  const { entries } = await committed();

  const said = entries.flatMap(({ entry }) =>
    Object.values(entry.lint ?? {}).map((row) => ({
      rule: row.rule,
      states: LINT_STATES.filter((state) => state in row).map((state) => `${state}: ${row[state]}`),
    })),
  );
  const split = [...Map.groupBy(said, ({ rule }) => rule)]
    .map(([rule, rows]) => [rule, [...new Set(rows.flatMap(({ states }) => states))]])
    .filter(([, states]) => states.length > 1);

  assert.deepEqual(split, []);
});
