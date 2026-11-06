// Telling whether a string is an IP address: net.isIP (0, 4 or 6),
// net.isIPv4 and net.isIPv6.
import { isIP, isIPv4, isIPv6 } from 'node:net';

// Well-formed addresses of both families, an IPv6 zone and an IPv4-mapped
// IPv6, and strings that are not addresses.
const WELL_FORMED = ['192.168.0.1', '255.255.255.255', '0.0.0.0', '::1', '1:2:3:4:5:6:7:8', '::ffff:1.2.3.4', 'fe80::1%eth0'];
const NOT_ADDRESSES = ['', 'abc', '1.2.3', '1.2.3.4.5', '1.2.3.4 ', 'localhost', '1::2::3'];
// Dotted quads that are not addresses: an octet past 255, a leading zero.
const OUT_OF_RANGE = ['256.1.1.1', '999.999.999.999', '01.2.3.4'];
// Shorthand IPv4 forms inet_aton accepts: three or two parts, hexadecimal.
const SHORTHAND = ['1.2.3', '127.1', '0x7f.1', '0x7f000001'];
const SAMPLES = [...WELL_FORMED, ...NOT_ADDRESSES];
const over = (samples, check) => samples.map((sample) => [sample, check(sample)]);
const isIPv4Strict = (sample) => isIPv4(sample);

export default {
  apis: ['net:net.isIP', 'net:net.isIPv4', 'net:net.isIPv6'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-ip@5.0.1': {
      isIP: {
        native: () => over([...SAMPLES, ...OUT_OF_RANGE], (sample) => isIP(sample) !== 0),
        package: ({ isIP }) => over([...SAMPLES, ...OUT_OF_RANGE], isIP),
      },
      isIPv4: {
        native: () => over([...SAMPLES, ...OUT_OF_RANGE], isIPv4),
        package: ({ isIPv4 }) => over([...SAMPLES, ...OUT_OF_RANGE], isIPv4),
      },
      isIPv6: {
        native: () => over(SAMPLES, isIPv6),
        package: ({ isIPv6 }) => over(SAMPLES, isIPv6),
      },
      ipVersion: {
        native: () => over(SAMPLES, (sample) => isIP(sample) || undefined),
        package: ({ ipVersion }) => over(SAMPLES, ipVersion),
      },
    },
    'ip-regex@5.0.0': {
      default: {
        native: () => over([...SAMPLES, ...OUT_OF_RANGE], (sample) => isIP(sample) !== 0),
        package: ({ default: ipRegex }) => over([...SAMPLES, ...OUT_OF_RANGE], (sample) => ipRegex({ exact: true }).test(sample)),
      },
      v4: {
        native: () => over([...SAMPLES, ...OUT_OF_RANGE], isIPv4Strict),
        package: ({ default: ipRegex }) => over([...SAMPLES, ...OUT_OF_RANGE], (sample) => ipRegex.v4({ exact: true }).test(sample)),
      },
      v6: {
        native: () => over(SAMPLES, isIPv6),
        package: ({ default: ipRegex }) => over(SAMPLES, (sample) => ipRegex.v6({ exact: true }).test(sample)),
      },
      'default: in text': {
        gap: 'ipRegex() without { exact: true } finds the addresses inside a longer text; net.isIP only judges a whole string',
        native: () => 'host=192.168.0.1;peer=[::1]:80'.split(/[\s;=]/).filter((word) => isIP(word) !== 0),
        package: ({ default: ipRegex }) => 'host=192.168.0.1;peer=[::1]:80'.match(ipRegex()),
      },
    },
    'ip@2.0.1': {
      isV4Format: {
        native: () => over(SAMPLES, isIPv4Strict),
        package: ({ default: ip }) => over(SAMPLES, (sample) => ip.isV4Format(sample)),
      },
      'isV4Format: out of range': {
        improves: 'net.isIPv4 rejects 256.1.1.1 and 01.2.3.4; ip.isV4Format only checks the dotted shape and accepts them',
        native: () => over(OUT_OF_RANGE, isIPv4Strict),
        package: ({ default: ip }) => over(OUT_OF_RANGE, (sample) => ip.isV4Format(sample)),
      },
      isV6Format: {
        native: () => over(['::1', '1:2:3:4:5:6:7:8', '::ffff:1.2.3.4', '1.2.3'], isIPv6),
        package: ({ default: ip }) => over(['::1', '1:2:3:4:5:6:7:8', '::ffff:1.2.3.4', '1.2.3'], (sample) => ip.isV6Format(sample)),
      },
      'isV6Format: not an address': {
        improves: 'net.isIPv6 rejects "", "abc" and dotted quads such as 192.168.0.1; ip.isV6Format accepts them',
        native: () => over(['', 'abc', '192.168.0.1'], isIPv6),
        package: ({ default: ip }) => over(['', 'abc', '192.168.0.1'], (sample) => ip.isV6Format(sample)),
      },
    },
    'ipaddr.js@2.5.0': {
      isValid: {
        native: () => over([...WELL_FORMED, ...NOT_ADDRESSES.filter((sample) => sample !== '1.2.3'), '256.1.1.1'], (sample) => isIP(sample) !== 0),
        package: ({ default: ipaddr }) =>
          over([...WELL_FORMED, ...NOT_ADDRESSES.filter((sample) => sample !== '1.2.3'), '256.1.1.1'], (sample) => ipaddr.isValid(sample)),
      },
      'isValid: shorthand IPv4': {
        gap: 'ipaddr.isValid accepts the inet_aton shorthands 1.2.3, 127.1, 0x7f.1 and 0x7f000001 (and 01.2.3.4 as octal); net.isIP accepts only four decimal parts',
        native: () => over([...SHORTHAND, '01.2.3.4'], (sample) => isIP(sample) !== 0),
        package: ({ default: ipaddr }) => over([...SHORTHAND, '01.2.3.4'], (sample) => ipaddr.isValid(sample)),
      },
      IPv4: {
        native: () => over([...SAMPLES, ...OUT_OF_RANGE, ...SHORTHAND], isIPv4Strict),
        package: ({ default: ipaddr }) =>
          over([...SAMPLES, ...OUT_OF_RANGE, ...SHORTHAND], (sample) => ipaddr.IPv4.isValidFourPartDecimal(sample)),
      },
      IPv6: {
        native: () => over(SAMPLES, isIPv6),
        package: ({ default: ipaddr }) => over(SAMPLES, (sample) => ipaddr.IPv6.isValid(sample)),
      },
    },
    'ip-address@10.7.6': {
      Address4: {
        native: () => over([...SAMPLES, ...OUT_OF_RANGE], isIPv4Strict),
        package: ({ Address4 }) => over([...SAMPLES, ...OUT_OF_RANGE], (sample) => Address4.isValid(sample)),
      },
      Address6: {
        native: () => over(SAMPLES, isIPv6),
        package: ({ Address6 }) => over(SAMPLES, (sample) => Address6.isValid(sample)),
      },
    },
  },
  idioms: {
    ipv4Regex: {
      seed: String.raw`\\d\{1,3\}\\\.(?:\)\{3|\\d\{1,3\}\\\.)`,
      native: () => over(WELL_FORMED.concat(NOT_ADDRESSES), (address) => isIPv4(address)),
      idiom: () => over(WELL_FORMED.concat(NOT_ADDRESSES), (address) => /^(\d{1,3}\.){3}\d{1,3}$/.test(address)),
    },
    'ipv4Regex: out of range': {
      improves: 'net.isIPv4 rejects 256.1.1.1, 999.999.999.999 and 01.2.3.4; a hand-written dotted-quad regex accepts them',
      native: () => over(OUT_OF_RANGE, (address) => isIPv4(address)),
      idiom: () => over(OUT_OF_RANGE, (address) => /^(\d{1,3}\.){3}\d{1,3}$/.test(address)),
    },
  },
};
