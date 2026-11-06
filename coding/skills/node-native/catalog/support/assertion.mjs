// Runs one assertion of a probe and reports its verdict, so a row compares what
// two assertion libraries decide instead of the errors they throw.
//
//   verdict(assertion) -> 'pass' when it returns (or its promise resolves),
//     'fail' when it throws (or rejects with) an assertion error: a name that
//     contains AssertionError, or an error with a matcherResult (expect's),
//     else `threw ${error.name}` for any other throw.
// assertion is called with no arguments; a synchronous or async one gives the
// verdict the same way (see failure in ./outcome.mjs).
import { failure } from './outcome.mjs';

const judged = (error) => (/AssertionError/.test(error.name) || error.matcherResult ? 'fail' : `threw ${error.name}`);

export const verdict = (assertion) => failure(assertion, judged, 'pass');
