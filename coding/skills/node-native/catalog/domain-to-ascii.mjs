// Convert an internationalised domain name to and from its punycode (ASCII) form.
import { domainToASCII, domainToUnicode } from 'node:url';

const domains = ['mañana.com', 'xn--maana-pta.com', '☃.net', 'a..b'];

export default {
  apis: ['url:url.domainToASCII', 'url:url.domainToUnicode'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'punycode@2.3.1/punycode.js': {
      toASCII: {
        native: () => domains.map(domainToASCII),
        package: ({ default: punycode }) => domains.map((domain) => punycode.toASCII(domain)),
      },
      toUnicode: {
        native: () => domains.map(domainToUnicode),
        package: ({ default: punycode }) => domains.map((domain) => punycode.toUnicode(domain)),
      },
      'toASCII: case': {
        gap: 'domainToASCII lowercases the domain (EXAMPLE.com → example.com); punycode.toASCII keeps the case',
        native: () => domainToASCII('EXAMPLE.com'),
        package: ({ default: punycode }) => punycode.toASCII('EXAMPLE.com'),
      },
      'toASCII: invalid domain': {
        gap: 'domainToASCII returns an empty string for a domain that is not valid ("ex ample.com"); punycode.toASCII returns it unchanged',
        native: () => domainToASCII('ex ample.com'),
        package: ({ default: punycode }) => punycode.toASCII('ex ample.com'),
      },
    },
  },
};
