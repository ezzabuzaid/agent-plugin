// HTTP status messages and method names: http.STATUS_CODES maps a status
// code to its reason phrase, http.METHODS lists the methods the parser knows.
import { METHODS, STATUS_CODES } from 'node:http';
import { outcome } from './support/outcome.mjs';

const CODES = Object.keys(STATUS_CODES).map(Number);
// Codes whose reason phrase changed in RFC 9110 (or never had one), where
// packages that froze an older table still answer the old phrase.
const RENAMED = [203, 207, 302, 408, 413, 414, 416, 418, 504, 505];
const STABLE = CODES.filter((code) => ![...RENAMED, 208, 226, 425, 506, 508, 509, 510].includes(code));
const phrases = (codes, phrase) =>
  codes.map((code) => [code, outcome(() => phrase(code))]);
// What a lookup of an unknown code answers.
const unknown = (lookup) => outcome(() => lookup(999));

export default {
  apis: ['node:http.STATUS_CODES', 'node:http.METHODS'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'statuses@2.0.2': {
      message: {
        native: () => phrases(CODES, (code) => STATUS_CODES[code]),
        package: ({ default: statuses }) => phrases(CODES, (code) => statuses.message[code]),
      },
      default: {
        native: () => phrases(CODES, (code) => STATUS_CODES[code]),
        package: ({ default: statuses }) => phrases(CODES, (code) => statuses(code)),
      },
      codes: {
        native: () => CODES,
        package: ({ default: statuses }) => statuses.codes,
      },
      'default: unknown code': {
        gap: 'statuses(999) throws "invalid status code"; STATUS_CODES[999] is undefined',
        native: () => unknown((code) => STATUS_CODES[code]),
        package: ({ default: statuses }) => unknown((code) => statuses(code)),
      },
      'default: by message': {
        gap: 'statuses("Not Found") answers 404 (any case); STATUS_CODES maps codes to phrases only, so a reverse lookup has to search its entries',
        native: () => STATUS_CODES['Not Found'],
        package: ({ default: statuses }) => statuses('Not Found'),
      },
      code: {
        gap: 'statuses.code maps a lower-case phrase to its code; STATUS_CODES has no reverse map',
        native: () => STATUS_CODES['not found'],
        package: ({ default: statuses }) => statuses.code['not found'],
      },
      redirect: {
        gap: 'statuses.redirect, .empty and .retry classify codes (redirect, no body, retry later); STATUS_CODES only names them',
        native: () => [301, 204, 503].map((code) => typeof STATUS_CODES[code]),
        package: ({ default: statuses }) => [statuses.redirect[301], statuses.empty[204], statuses.retry[503]],
      },
    },
    'http-status-codes@2.3.0': {
      getReasonPhrase: {
        native: () => phrases(STABLE, (code) => STATUS_CODES[code]),
        package: ({ getReasonPhrase }) => phrases(STABLE, getReasonPhrase),
      },
      'getReasonPhrase: renamed phrases': {
        gap: 'http-status-codes keeps pre-RFC 9110 phrases (302 Moved Temporarily, 413 Request Entity Too Large, 418 I\'m a teapot) and has no 208, 226, 425, 506, 508, 510; STATUS_CODES follows RFC 9110',
        native: () => phrases([302, 413, 414, 416, 418, 425, 508], (code) => STATUS_CODES[code]),
        package: ({ getReasonPhrase }) => phrases([302, 413, 414, 416, 418, 425, 508], getReasonPhrase),
      },
      'getReasonPhrase: unknown code': {
        gap: 'getReasonPhrase(999) throws; STATUS_CODES[999] is undefined',
        native: () => unknown((code) => STATUS_CODES[code]),
        package: ({ getReasonPhrase }) => unknown(getReasonPhrase),
      },
      getStatusCode: {
        gap: 'getStatusCode("Not Found") answers 404; STATUS_CODES has no reverse map',
        native: () => STATUS_CODES['Not Found'],
        package: ({ getStatusCode }) => getStatusCode('Not Found'),
      },
      StatusCodes: {
        gap: 'StatusCodes.NOT_FOUND names each code as a constant; node:http exports no named status constants',
        native: () => STATUS_CODES.NOT_FOUND,
        package: ({ StatusCodes }) => StatusCodes.NOT_FOUND,
      },
    },
    'http-status@2.1.0': {
      default: {
        native: () => phrases(STABLE, (code) => STATUS_CODES[code]),
        package: ({ default: status }) => phrases(STABLE, (code) => status[code]),
      },
      'default: renamed phrases': {
        gap: 'http-status keeps RFC 2616 phrases (408 Request Time-out, 504 Gateway Time-out, 207 Multi Status); STATUS_CODES follows RFC 9110',
        native: () => phrases([207, 408, 413, 504, 505], (code) => STATUS_CODES[code]),
        package: ({ default: status }) => phrases([207, 408, 413, 504, 505], (code) => status[code]),
      },
      'default: names and classes': {
        gap: 'http-status also maps codes to constant names, descriptions and classes (404_NAME, 404_MESSAGE, 404_CLASS); STATUS_CODES has the reason phrase only',
        native: () => [STATUS_CODES['404_NAME'], STATUS_CODES['404_CLASS']],
        package: ({ default: status }) => [status['404_NAME'], status['404_CLASS']],
      },
    },
    'methods@1.1.2': {
      default: {
        native: () => METHODS.map((method) => method.toLowerCase()),
        package: ({ default: methods }) => methods,
      },
      'default: casing': {
        gap: 'methods lists lower-case names (get, m-search); http.METHODS lists them as sent on the wire (GET, M-SEARCH)',
        native: () => METHODS.slice(0, 3),
        package: ({ default: methods }) => methods.slice(0, 3),
      },
    },
  },
};
