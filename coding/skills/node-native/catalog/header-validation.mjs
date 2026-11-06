// Checking an HTTP header name (an RFC 9110 token) or value before sending
// it: http.isValidHeaderName and http.isValidHeaderValue return a boolean,
// http.validateHeaderName and http.validateHeaderValue throw.
import { isValidHeaderName, isValidHeaderValue } from 'node:http';

const NAMES = ['content-type', 'X-Ok_1', "!#$%&'*+.^_`|~", 'bad name', 'x:y', '', 'ü', 'a"b', '{x}', 'a\nb'];
const VALUES = ['ok', 'tab\tok', ' lead', 'ü', 'a\nb', 'a\rb', '\x00', '\x7f', 'Ā', '😀'];

export default {
  apis: ['http:http.isValidHeaderName', 'http:http.isValidHeaderValue', 'http:http.validateHeaderName', 'http:http.validateHeaderValue'],
  reviewedAt: 'v26.13.0',
  idioms: {
    tokenRegex: {
      seed: String.raw`\[!#\$%&'\*\+`,
      native: () => NAMES.map((name) => isValidHeaderName(name)),
      idiom: () => {
        const TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
        return NAMES.map((name) => TOKEN_REGEXP.test(name));
      },
    },
    headerValueRegex: {
      seed: String.raw`\[\^\\t\\x20-\\x7e\\x80-\\xff\]`,
      native: () => VALUES.map((value) => isValidHeaderValue(value)),
      idiom: () => {
        const HEADER_CHARS_REGEXP = /[^\t\x20-\x7e\x80-\xff]/;
        return VALUES.map((value) => !HEADER_CHARS_REGEXP.test(value));
      },
    },
  },
};
