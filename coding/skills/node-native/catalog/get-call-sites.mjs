// Reading the caller's stack frames as data: function, file, line, column.
import { getCallSites } from 'node:util';

// Both sides capture inside `at`, so frame 1 is the same line and column.
function at(capture) {
  return capture();
}
const method = {
  probe(capture) {
    return capture();
  },
};

export default {
  apis: ['util:util.getCallSites'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'callsites@4.2.0': {
      default: {
        native: () => {
          const { functionName, scriptName, lineNumber, columnNumber } = at(() => getCallSites())[1];
          return { functionName, scriptName, lineNumber, columnNumber };
        },
        package: ({ default: callsites }) => {
          const site = at(() => callsites())[1];
          return {
            functionName: site.getFunctionName(),
            scriptName: site.getFileName(),
            lineNumber: site.getLineNumber(),
            columnNumber: site.getColumnNumber(),
          };
        },
      },
      'default: getTypeName': {
        gap: 'a call site has no receiver type (getTypeName) or other V8 CallSite methods',
        native: () => method.probe(() => getCallSites())[1].typeName,
        package: ({ default: callsites }) => method.probe(() => callsites())[1].getTypeName(),
      },
    },
  },
};
