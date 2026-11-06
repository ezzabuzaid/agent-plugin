// An embedded SQLite database, queried synchronously.
import { Database } from 'node:sqlite';

const schema = 'create table person (id integer primary key, name text, age integer)';
const people = [
  ['ada', 36],
  ['alan', 41],
];
// Rows as plain objects: node:sqlite gives null-prototype ones.
const plain = (rows) => rows.map((row) => ({ ...row }));

// A node:sqlite database with the people in it.
function native() {
  const db = new Database(':memory:');
  db.exec(schema);
  const insert = db.prepare('insert into person (name, age) values (?, ?)');
  for (const person of people) insert.run(...person);
  return db;
}
// A better-sqlite3 database with the people in it.
function better(BetterSqlite) {
  const db = new BetterSqlite(':memory:');
  db.exec(schema);
  const insert = db.prepare('insert into person (name, age) values (?, ?)');
  for (const person of people) insert.run(...person);
  return db;
}
const median = { start: () => [], step: (values, value) => [...values, value], result: (values) => values.sort()[values.length >> 1] };

// sql.js loads a WebAssembly build once.
let sqlJs;
async function wasm(initSqlJs) {
  sqlJs ??= initSqlJs();
  const SQL = await sqlJs;
  const db = new SQL.Database();
  db.run(schema);
  for (const person of people) db.run('insert into person (name, age) values (?, ?)', person);
  return db;
}
// sql.js `exec` results as row objects.
const objects = ([result]) => result.values.map((values) => Object.fromEntries(result.columns.map((column, i) => [column, values[i]])));

export default {
  apis: [
    'sqlite:new Database',
    'sqlite:database.exec',
    'sqlite:database.prepare',
    'sqlite:statement.run',
    'sqlite:statement.get',
    'sqlite:statement.all',
    'sqlite:statement.iterate',
    'sqlite:statement.setReturnArrays',
    'sqlite:statement.setReadBigInts',
    'sqlite:database.function',
    'sqlite:database.aggregate',
    'sqlite:database.serialize',
    'sqlite:database.deserialize',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'better-sqlite3@13.0.3': {
      default: {
        native: () => plain(native().prepare('select * from person order by id').all()),
        package: ({ default: BetterSqlite }) => better(BetterSqlite).prepare('select * from person order by id').all(),
      },
      'default: row prototype': {
        gap: 'rows are null-prototype objects; better-sqlite3 rows are plain objects',
        native: () => native().prepare('select name from person where id = 1').get(),
        package: ({ default: BetterSqlite }) => better(BetterSqlite).prepare('select name from person where id = 1').get(),
      },
      run: {
        native: () => native().prepare('insert into person (name, age) values (?, ?)').run('grace', 85),
        package: ({ default: BetterSqlite }) => better(BetterSqlite).prepare('insert into person (name, age) values (?, ?)').run('grace', 85),
      },
      'get: named parameters': {
        native: () => ({ ...native().prepare('select * from person where name = @name').get({ name: 'alan' }) }),
        package: ({ default: BetterSqlite }) => better(BetterSqlite).prepare('select * from person where name = @name').get({ name: 'alan' }),
      },
      iterate: {
        native: () => plain([...native().prepare('select id from person order by id').iterate()]),
        package: ({ default: BetterSqlite }) => [...better(BetterSqlite).prepare('select id from person order by id').iterate()],
      },
      pluck: {
        native: () => {
          const statement = native().prepare('select name from person order by id');
          statement.setReturnArrays(true);
          return statement.all().map(([name]) => name);
        },
        package: ({ default: BetterSqlite }) => better(BetterSqlite).prepare('select name from person order by id').pluck().all(),
      },
      raw: {
        native: () => {
          const statement = native().prepare('select name, age from person order by id');
          statement.setReturnArrays(true);
          return statement.all();
        },
        package: ({ default: BetterSqlite }) => better(BetterSqlite).prepare('select name, age from person order by id').raw().all(),
      },
      safeIntegers: {
        native: () => {
          const statement = native().prepare('select age from person where id = 1');
          statement.setReadBigInts(true);
          return statement.get().age;
        },
        package: ({ default: BetterSqlite }) => better(BetterSqlite).prepare('select age from person where id = 1').safeIntegers().get().age,
      },
      function: {
        native: () => {
          const db = native();
          db.function('twice', (value) => value * 2);
          return { ...db.prepare('select twice(age) as doubled from person where id = 1').get() };
        },
        package: ({ default: BetterSqlite }) => {
          const db = better(BetterSqlite);
          db.function('twice', (value) => value * 2);
          return db.prepare('select twice(age) as doubled from person where id = 1').get();
        },
      },
      aggregate: {
        native: () => {
          const db = native();
          db.aggregate('median', { start: median.start, step: median.step, result: median.result });
          return { ...db.prepare('select median(age) as m from person').get() };
        },
        package: ({ default: BetterSqlite }) => {
          const db = better(BetterSqlite);
          db.aggregate('median', { start: median.start, step: median.step, result: median.result });
          return db.prepare('select median(age) as m from person').get();
        },
      },
      pragma: {
        native: () => plain(native().prepare('pragma user_version').all()),
        package: ({ default: BetterSqlite }) => better(BetterSqlite).pragma('user_version'),
      },
      transaction: {
        gap: 'no transaction() wrapper: run BEGIN, COMMIT and ROLLBACK with exec',
        native: () => typeof native().transaction,
        package: ({ default: BetterSqlite }) => typeof better(BetterSqlite).transaction,
      },
      'serialize: round trip': {
        native: () => {
          const copy = new Database(':memory:');
          copy.deserialize(native().serialize());
          return plain(copy.prepare('select * from person order by id').all());
        },
        package: ({ default: BetterSqlite }) =>
          new BetterSqlite(better(BetterSqlite).serialize()).prepare('select * from person order by id').all(),
      },
    },
    'sql.js@1.15.2': {
      exec: {
        native: () => plain(native().prepare('select * from person order by id').all()),
        package: async ({ default: initSqlJs }) => objects((await wasm(initSqlJs)).exec('select * from person order by id')),
      },
      'exec: result shape': {
        gap: 'all() gives row objects; sql.js exec gives { columns, values } per statement',
        native: () => plain(native().prepare('select * from person order by id').all()),
        package: async ({ default: initSqlJs }) => (await wasm(initSqlJs)).exec('select * from person order by id'),
      },
      prepare: {
        native: () => ({ ...native().prepare('select * from person where name = $name').get({ name: 'ada' }) }),
        package: async ({ default: initSqlJs }) => {
          const statement = (await wasm(initSqlJs)).prepare('select * from person where name = $name');
          statement.bind({ $name: 'ada' });
          statement.step();
          return statement.getAsObject();
        },
      },
      getRowsModified: {
        native: () => native().prepare('update person set age = age + 1').run().changes,
        package: async ({ default: initSqlJs }) => {
          const db = await wasm(initSqlJs);
          db.run('update person set age = age + 1');
          return db.getRowsModified();
        },
      },
      create_function: {
        native: () => {
          const db = native();
          db.function('twice', (value) => value * 2);
          return db.prepare('select twice(age) as doubled from person order by id').all().map(({ doubled }) => doubled);
        },
        package: async ({ default: initSqlJs }) => {
          const db = await wasm(initSqlJs);
          db.create_function('twice', (value) => value * 2);
          return db.exec('select twice(age) as doubled from person order by id')[0].values.map(([doubled]) => doubled);
        },
      },
      'export: round trip': {
        native: () => {
          const copy = new Database(':memory:');
          copy.deserialize(native().serialize());
          return plain(copy.prepare('select * from person order by id').all());
        },
        package: async ({ default: initSqlJs }) => {
          const SQL = await sqlJs;
          const copy = new SQL.Database((await wasm(initSqlJs)).export());
          return objects(copy.exec('select * from person order by id'));
        },
      },
    },
  },
};
