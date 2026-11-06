// Printing an array of records as a text table. console.table writes to a
// stream; the packages return a string. Mappings compare the cells; the
// formatting differences are gaps.
import { Console } from 'node:console';
import { Writable } from 'node:stream';

const rows = [
  { name: 'parse', ops: 1200 },
  { name: 'stringify', ops: 950 },
];
const head = Object.keys(rows[0]);
const matrix = [head, ...rows.map((row) => head.map((key) => row[key]))];

// What a Console prints, captured instead of written to stdout.
function printed(print) {
  let text = '';
  const stdout = new Writable({
    write(chunk, encoding, done) {
      text += chunk;
      done();
    },
  });
  print(new Console({ stdout, colorMode: false }));
  return text;
}

// The cell text of each row of a rendered table, with border-only lines left
// out: cells split on the vertical box bars, or on runs of spaces when the
// table has none.
const BORDER = /^[\s─═┌┐└┘├┤┬┴┼╔╗╚╝╟╢╤╧╪║│-]*$/;
const cellsOf = (text) =>
  text
    .split('\n')
    .filter((line) => !BORDER.test(line))
    .map((line) =>
      /[│║]/.test(line)
        ? line.split(/[│║]/).map((cell) => cell.trim()).filter(Boolean)
        : line.trim().split(/\s{2,}|\s(?=\S+$)/),
    );

// console.table's cells without its (index) column, strings without the quotes
// util.inspect puts around them.
const nativeCells = (text) => cellsOf(text).map((row) => row.slice(1).map((cell) => cell.replace(/^'(.*)'$/, '$1')));
const tableOf = (data, columns) => printed((console) => console.table(data, columns));

// Whether the 950 cell is padded on its left, as a right-aligned column is.
const rightAligned = (text) => / {2,}950 [│║]/.test(text);

const cliTable = (Table, options = {}) => {
  const table = new Table({ head, style: { head: [], border: [] }, ...options });
  table.push(...matrix.slice(1));
  return table.toString();
};

export default {
  apis: ['console:console.table', 'console:new Console'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'cli-table3@0.6.5': {
      default: {
        native: () => nativeCells(tableOf(rows)),
        package: ({ default: Table }) => cellsOf(cliTable(Table)),
      },
      'default: index column': {
        gap: 'console.table always adds an (index) column first; a cli-table3 table has only its own columns',
        native: () => cellsOf(tableOf(rows))[0],
        package: ({ default: Table }) => cellsOf(cliTable(Table))[0],
      },
      'default: quoted strings': {
        gap: "strings print as util.inspect shows them, in quotes ('parse'); cli-table3 prints the text",
        native: () => cellsOf(tableOf(rows))[1].slice(1),
        package: ({ default: Table }) => cellsOf(cliTable(Table))[1],
      },
      'default: colAligns': {
        gap: 'no alignment, width, wrapping or colour options: every column is left-aligned',
        native: () => rightAligned(tableOf(rows)),
        package: ({ default: Table }) => rightAligned(cliTable(Table, { colAligns: ['left', 'right'] })),
      },
      'default: string result': {
        gap: 'console.table returns nothing and writes to the Console stream; a caller that needs the text captures that stream',
        native: () => typeof new Console({ stdout: new Writable({ write: (chunk, encoding, done) => done() }) }).table(rows),
        package: ({ default: Table }) => typeof cliTable(Table),
      },
    },
    'table@6.10.1': {
      table: {
        native: () => nativeCells(tableOf(rows)),
        package: ({ table }) => cellsOf(table(matrix)),
      },
      'table: alignment': {
        gap: 'no alignment, width, wrapping or border options: every column is left-aligned',
        native: () => rightAligned(tableOf(rows)),
        package: ({ table }) => rightAligned(table(matrix, { columns: { 1: { alignment: 'right' } } })),
      },
    },
    'columnify@1.6.0': {
      default: {
        native: () => nativeCells(tableOf(rows)),
        package: ({ default: columnify }) => cellsOf(columnify(rows, { headingTransform: (heading) => heading })),
      },
      'default: columns': {
        native: () => nativeCells(tableOf(rows, ['name'])),
        package: ({ default: columnify }) => cellsOf(columnify(rows, { columns: ['name'], headingTransform: (heading) => heading })),
      },
    },
    'easy-table@1.2.0': {
      print: {
        native: () => nativeCells(tableOf(rows)),
        package: ({ default: Table }) => cellsOf(Table.print(rows)),
      },
    },
    // The package also replaces the global console.table with its own.
    'console.table@0.10.0': {
      getTable: {
        native: () => nativeCells(tableOf(rows)),
        package: ({ getTable }) => cellsOf(getTable(rows)),
      },
    },
  },
};
