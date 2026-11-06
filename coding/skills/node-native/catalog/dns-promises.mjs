// Promise-returning DNS lookups: node:dns/promises (dnsPromises.lookup and
// the rest) instead of promisifying the callback API.
import dns from 'node:dns';
import { lookup } from 'node:dns/promises';
import { promisify } from 'node:util';

// Lookups of IP literals answer without asking any resolver.
const ADDRESSES = ['127.0.0.1', '::1'];

export default {
  apis: ['dns:dnsPromises.lookup'],
  reviewedAt: 'v26.13.0',
  idioms: {
    promisifiedLookup: {
      seed: String.raw`promisify\(\s*dns\.(?:lookup|resolve\w*|reverse)\b`,
      native: async () => Promise.all(ADDRESSES.map(async (address) => lookup(address))),
      idiom: async () => {
        const lookupAsync = promisify(dns.lookup);
        return Promise.all(ADDRESSES.map(async (address) => lookupAsync(address)));
      },
    },
    'promisifiedLookup: all': {
      native: async () => lookup('127.0.0.1', { all: true }),
      idiom: async () => promisify(dns.lookup)('127.0.0.1', { all: true }),
    },
  },
};
