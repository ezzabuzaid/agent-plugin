// Parsing and serializing MIME types (Content-Type values) per the WHATWG MIME Sniffing standard.
import { MIMEType } from 'node:util';
import { outcome } from './support/outcome.mjs';

const inputs = [
  'text/html; charset=UTF-8',
  'Text/HTML;Charset="utf-8"',
  'application/json',
  'text/plain; charset="a\\"b"',
  'multipart/form-data; boundary=----x; charset=utf-8',
  'text/html;charset=utf-8;charset=ascii',
  'text/html; a=b, c/d',
  'text/plain;x="  y "',
];
// Inputs RFC 9110 refuses at a parameter that WHATWG skips or reads leniently:
// an empty value, a name without "=", an unquoted value with spaces, text
// after a closing quote, an unterminated quoted string.
const malformed = ['text/html; foo=', 'text/html; charset', 'text/html; a=b, c/d', 'text/html; a="b"c', 'text/plain; x="a\\'];
const wellFormed = inputs.filter((input) => !malformed.includes(input));
const essenceAndParams = (mime) => ({ type: mime.essence, parameters: Object.fromEntries(mime.params) });
const view = (mime) => [mime.essence, mime.type, mime.subtype, Object.fromEntries(mime.params ?? mime.parameters), String(mime)];

export default {
  apis: ['util:util.MIMEType', 'util:MIMEType.parse', 'util:util.MIMEParams'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'whatwg-mimetype@5.0.0': {
      MIMEType: {
        native: () => inputs.map((input) => view(new MIMEType(input))),
        package: ({ MIMEType: Whatwg }) => inputs.map((input) => view(new Whatwg(input))),
      },
      'MIMEType: parse of invalid input': {
        native: () => MIMEType.parse('bogus'),
        package: ({ MIMEType: Whatwg }) => Whatwg.parse('bogus'),
      },
      'MIMEType: edit and serialize': {
        native: () => {
          const mime = new MIMEType('text/html');
          mime.subtype = 'plain';
          mime.params.set('charset', 'utf-8');
          return String(mime);
        },
        package: ({ MIMEType: Whatwg }) => {
          const mime = new Whatwg('text/html');
          mime.subtype = 'plain';
          mime.parameters.set('charset', 'utf-8');
          return String(mime);
        },
      },
      ...Object.fromEntries(
        ['isHTML', 'isXML', 'isJavaScript'].map((method) => [
          `MIMEType: ${method}`,
          {
            gap: `no ${method}() classification method`,
            native: () => new MIMEType('text/html')[method](),
            package: ({ MIMEType: Whatwg }) => new Whatwg('text/html')[method](),
          },
        ]),
      ),
    },
    'fast-content-type-parse@4.0.1': {
      parse: {
        native: () => wellFormed.map((input) => essenceAndParams(new MIMEType(input))),
        package: ({ parse }) => wellFormed.map((input) => ({ type: parse(input).type, parameters: { ...parse(input).parameters } })),
      },
      'parse: invalid type': {
        native: () => outcome(() => new MIMEType('bogus')),
        package: ({ parse }) => outcome(() => parse('bogus')),
      },
      'parse: malformed parameter': {
        gap: 'WHATWG skips a malformed parameter (empty value, no "=", text after a closing quote) and keeps the type; fast-content-type-parse throws "invalid parameter format"',
        native: () => malformed.map((input) => outcome(() => essenceAndParams(new MIMEType(input)))),
        package: ({ parse }) =>
          malformed.map((input) => outcome(() => ({ type: parse(input).type, parameters: { ...parse(input).parameters } }))),
      },
      'parse: parameters shape': {
        gap: 'parameters are a MIMEParams map (get, has, set); fast-content-type-parse returns an object whose properties are the parameters',
        native: () => new MIMEType('text/html; charset=utf-8').params.charset,
        package: ({ parse }) => parse('text/html; charset=utf-8').parameters.charset,
      },
      safeParse: {
        native: () => ['text/html; charset=utf-8', 'bogus'].map((input) => MIMEType.parse(input)?.essence ?? ''),
        package: ({ safeParse }) => ['text/html; charset=utf-8', 'bogus'].map((input) => safeParse(input).type),
      },
      'safeParse: invalid type': {
        gap: 'MIMEType.parse returns null for an invalid type; safeParse returns { type: "", parameters: {} }',
        native: () => MIMEType.parse('bogus'),
        package: ({ safeParse }) => {
          const { type, parameters } = safeParse('bogus');
          return { type, parameters: { ...parameters } };
        },
      },
      'safeParse: malformed parameter': {
        gap: 'MIMEType.parse keeps the type and skips a malformed parameter; safeParse drops the whole value and returns type ""',
        native: () => malformed.map((input) => MIMEType.parse(input).essence),
        package: ({ safeParse }) => malformed.map((input) => safeParse(input).type),
      },
    },
    'content-type@3.1.1': {
      parse: {
        native: () =>
          inputs.map((input) => {
            const mime = new MIMEType(input);
            return { type: mime.essence, parameters: Object.fromEntries(mime.params) };
          }),
        package: ({ parse }) => inputs.map((input) => ({ type: parse(input).type, parameters: { ...parse(input).parameters } })),
      },
      'parse: empty parameter value': {
        gap: 'a parameter with an empty value is dropped (WHATWG); content-type keeps it as ""',
        native: () => Object.fromEntries(new MIMEType('text/html; foo=').params),
        package: ({ parse }) => ({ ...parse('text/html; foo=').parameters }),
      },
      'parse: invalid type': {
        gap: 'an invalid type throws ERR_INVALID_MIME_SYNTAX; content-type 3 returns it as the type',
        native: () => new MIMEType('bogus').essence,
        package: ({ parse }) => parse('bogus').type,
      },
      format: {
        gap: 'serializes parameters without the space after ";" that content-type writes',
        native: () => {
          const mime = new MIMEType('text/html');
          mime.params.set('charset', 'utf-8');
          mime.params.set('q', 'a b');
          return String(mime);
        },
        package: ({ format }) => format({ type: 'text/html', parameters: { charset: 'utf-8', q: 'a b' } }),
      },
    },
  },
};
