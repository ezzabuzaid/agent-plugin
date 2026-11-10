// Says, for each thing a node-native run found, which lint rule the catalog
// knows for it, so the report can name the rule candidates. It reads the
// catalog and the run's findings, and builds and measures nothing.
//
//   node scripts/rules.mjs <findings.json> [--catalog <dir>] [--surface <path>]
//
// <findings.json> is an array with one finding per site that the run reports
// under Replace, Partial or Deprecated in Node:
//   { file, line, entry, idiom }        a catalog idiom (an `idioms` key of the
//                                       entry, not a `<idiom>: <case>` row)
//   { file, line, entry, dependency }   a package the entry `replaces`
//   { file, line, api }                 a deprecated or legacy API, as the
//                                       surface names it (inventory's `api`)
// Each lint row of the catalog names its subject the same way (`idiom`,
// `dependency` or `api`). A subject takes the rows of its entry that name it;
// an api takes the rows of every entry that name it.
//
// Each subject goes into one group:
//   covered     a row is `on`: a config has the rule, so it is no candidate
//   unmeasured  no row is `on`, a row is `unmeasured`: measure that rule
//   noRule      no row names the subject: a candidate for an own rule
//   judged      every row `failed` or is `off`: ADR 0008 judged it, so it is
//               no candidate; `says` gives the reason
//
// Stdout is one JSON document:
//   { covered, unmeasured, noRule, judged: [{ entry?, idiom | dependency | api,
//       count, sites: ['<file>:<line>'], rules: [{ plugin, rule, state, says }] }] }
// Exit 0: listed. Exit 2: a finding names what the catalog or the surface does
// not have, or a read failed; reason on stderr.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseSpec, readCatalog } from './catalog.mjs';

const skill = fileURLToPath(new URL('..', import.meta.url));
const KINDS = ['idiom', 'dependency', 'api'];
const STATES = ['on', 'unmeasured', 'failed', 'off'];

const kindOf = (item) => KINDS.find((kind) => kind in item);

// The subject a finding or a lint row is about, as one comparable key.
const keyOf = (entry, item) => {
  const kind = kindOf(item);
  return kind === 'api' ? `api ${item.api}` : `${entry} ${kind} ${item[kind]}`;
};

function groupOf(rules) {
  const states = new Set(rules.map(({ state }) => state));
  if (states.has('on')) return 'covered';
  if (states.has('unmeasured')) return 'unmeasured';
  return rules.length === 0 ? 'noRule' : 'judged';
}

function refuseUnknown(finding, entries, surface) {
  const where = `finding ${JSON.stringify(finding)}`;
  const kinds = KINDS.filter((kind) => kind in finding);
  if (kinds.length !== 1) throw new Error(`${where} names ${kinds.length} of ${KINDS.join(', ')}`);
  if (typeof finding.file !== 'string' || !Number.isInteger(finding.line)) throw new Error(`${where} has no file and line`);
  const [kind] = kinds;
  if (kind === 'api') {
    if (![0, 3].includes(surface.apis[finding.api]?.stability)) {
      throw new Error(`${where}: ${finding.api} is not an API the surface marks deprecated or legacy`);
    }
    return;
  }
  const entry = entries.get(finding.entry);
  if (!entry) throw new Error(`${where}: the catalog has no entry ${finding.entry}`);
  const known =
    kind === 'idiom'
      ? Object.keys(entry.idioms ?? {}).filter((key) => !key.includes(': '))
      : Object.keys(entry.replaces ?? {}).map((spec) => parseSpec(spec)?.name);
  if (!known.includes(finding[kind])) throw new Error(`${where}: entry ${finding.entry} has no ${kind} ${finding[kind]}`);
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      catalog: { type: 'string', default: join(skill, 'catalog') },
      surface: { type: 'string', default: join(skill, 'surface.json') },
    },
  });
  if (positionals.length !== 1) throw new Error('usage: rules.mjs <findings.json>');
  const findings = JSON.parse(await readFile(positionals[0], 'utf8'));
  if (!Array.isArray(findings)) throw new Error(`${positionals[0]} is not an array of findings`);
  const surface = JSON.parse(await readFile(values.surface, 'utf8'));
  const catalog = await readCatalog(values.catalog);
  const entries = new Map(catalog.map(({ id, entry }) => [id, entry]));
  for (const finding of findings) refuseUnknown(finding, entries, surface);

  const rulesBySubject = Map.groupBy(
    catalog.flatMap(({ id, entry }) =>
      Object.values(entry.lint ?? {}).map((row) => {
        const state = STATES.find((name) => name in row);
        return { key: keyOf(id, row), rule: { plugin: row.plugin, rule: row.rule, state, says: row[state] } };
      }),
    ),
    ({ key }) => key,
  );
  const groups = { covered: [], unmeasured: [], noRule: [], judged: [] };
  for (const [key, sites] of Map.groupBy(findings, (finding) => keyOf(finding.entry, finding))) {
    const [first] = sites;
    const kind = kindOf(first);
    const rules = (rulesBySubject.get(key) ?? []).map(({ rule }) => rule);
    groups[groupOf(rules)].push({
      ...(kind !== 'api' && { entry: first.entry }),
      [kind]: first[kind],
      count: sites.length,
      sites: sites.map(({ file, line }) => `${file}:${line}`),
      rules,
    });
  }
  process.stdout.write(`${JSON.stringify(groups, null, 2)}\n`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  process.stderr.write(`rules: ${error.message}\n`);
  process.exitCode = 2;
}
