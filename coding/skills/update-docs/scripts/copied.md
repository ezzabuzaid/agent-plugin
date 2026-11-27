# Copies in these scripts (Rule of Three, strike 2)

A plugin installs from git with no node_modules, so a skill whose script needs npm packages ships a committed esbuild bundle. Two skills do it now; a third one extracts the shared part and switches all three. Until then, mirror every fix in both copies and name both files in the commit.

| Piece | Source | Copy | What differs |
|---|---|---|---|
| `build.ts`: esbuild options exported for the test, `bundle`, `platform: 'node'`, `format: 'esm'`, `target: 'node26'`, the `createRequire` banner for CommonJS dependencies, a build only when run as main | `coding/skills/automations/scripts/build.ts` | `build.ts` | the entry (`src/main.ts`) and the outfile (`dist/update-docs.mjs`); the banner's reason names `@alwaysmeticulous/agent-traces` under `@deepagents/trajectory` |
| The two guard tests: the committed bundle is what `build.ts` makes of the source, and the bundle runs alone with no node_modules beside it | `coding/skills/automations/scripts/automations.test.ts` | `src/update-docs.test.ts` | the command the lone bundle runs (`show nothing` in an empty repo) and the text it must print |
