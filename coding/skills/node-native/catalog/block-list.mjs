// Checking an address against subnets, ranges and single addresses:
// net.BlockList (addCIDR, addSubnet, addRange, addAddress, check).
import { BlockList, isIPv6 } from 'node:net';

const family = (address) => (isIPv6(address) ? 'ipv6' : 'ipv4');
// Whether each address is in the list built from `cidrs`.
const inCIDRs = (cidrs, addresses) => {
  const list = new BlockList();
  list.addCIDRs(cidrs);
  return addresses.map((address) => [address, list.check(address, family(address))]);
};
const over = (addresses, check) => addresses.map((address) => [address, check(address)]);

const V4 = ['10.0.0.0', '10.1.2.3', '10.255.255.255', '11.0.0.0', '9.255.255.255', '192.168.1.1'];
// The ranges ip.isPrivate treats as private: loopback, RFC 1918,
// link-local, unique local, IPv6 loopback and the unspecified address.
const PRIVATE = ['127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16', 'fc00::/7', 'fe80::/10', '::1/128', '::/128'];
const MIXED = ['127.0.0.1', '10.0.0.1', '172.16.5.4', '172.32.0.1', '192.168.0.1', '169.254.1.1', '8.8.8.8', 'fd00::1', 'fe80::1', '::1', '2001:db8::1'];

export default {
  apis: [
    'net:net.BlockList',
    'net:blockList.addCIDR',
    'net:blockList.addCIDRs',
    'net:blockList.addSubnet',
    'net:blockList.addRange',
    'net:blockList.addAddress',
    'net:blockList.check',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'ip@2.0.1': {
      cidrSubnet: {
        native: () => inCIDRs(['10.0.0.0/8'], V4),
        package: ({ default: ip }) => over(V4, (address) => ip.cidrSubnet('10.0.0.0/8').contains(address)),
      },
      isPrivate: {
        native: () => inCIDRs(PRIVATE, MIXED),
        package: ({ default: ip }) => over(MIXED, (address) => ip.isPrivate(address)),
      },
      isEqual: {
        native: () => {
          const list = new BlockList();
          list.addAddress('::ffff:127.0.0.1', 'ipv6');
          return list.check('127.0.0.1');
        },
        package: ({ default: ip }) => ip.isEqual('::ffff:127.0.0.1', '127.0.0.1'),
      },
    },
    'ipaddr.js@2.5.0': {
      parseCIDR: {
        native: () => inCIDRs(['10.0.0.0/8', '2001:db8::/32'], [...V4, '2001:db8::1', '2001:db9::1']),
        package: ({ default: ipaddr }) =>
          over([...V4, '2001:db8::1', '2001:db9::1'], (address) => {
            const parsed = ipaddr.parse(address);
            const cidr = ipaddr.parseCIDR(parsed.kind() === 'ipv6' ? '2001:db8::/32' : '10.0.0.0/8');
            return parsed.match(cidr);
          }),
      },
      'parseCIDR: IPv4-mapped IPv6': {
        gap: 'a BlockList matches ::ffff:10.1.2.3 against an IPv4 subnet; ipaddr.js match() throws on mixed families unless the caller converts with process()',
        native: () => inCIDRs(['10.0.0.0/8'], ['::ffff:10.1.2.3']),
        package: ({ default: ipaddr }) => {
          try {
            return [['::ffff:10.1.2.3', ipaddr.parse('::ffff:10.1.2.3').match(ipaddr.parseCIDR('10.0.0.0/8'))]];
          } catch (error) {
            return `threw ${error.name}`;
          }
        },
      },
    },
    'netmask@2.1.1': {
      Netmask: {
        native: () => inCIDRs(['10.0.0.0/8'], V4),
        package: ({ Netmask }) => over(V4, (address) => new Netmask('10.0.0.0/8').contains(address)),
      },
      'Netmask: mask form': {
        native: () => {
          const list = new BlockList();
          list.addSubnet('192.168.0.0', 16);
          return over(V4, (address) => list.check(address));
        },
        package: ({ Netmask }) => over(V4, (address) => new Netmask('192.168.0.0', '255.255.0.0').contains(address)),
      },
    },
    'ip-address@10.7.6': {
      Address4: {
        native: () => inCIDRs(['10.0.0.0/8'], V4),
        package: ({ Address4 }) => over(V4, (address) => new Address4(address).isInSubnet(new Address4('10.0.0.0/8'))),
      },
      Address6: {
        native: () => inCIDRs(['2001:db8::/32'], ['2001:db8::1', '2001:db8:ffff::1', '2001:db9::1']),
        package: ({ Address6 }) =>
          over(['2001:db8::1', '2001:db8:ffff::1', '2001:db9::1'], (address) =>
            new Address6(address).isInSubnet(new Address6('2001:db8::/32')),
          ),
      },
    },
  },
  idioms: {
    ipToLongRange: {
      seed: String.raw`\.split\(\s*['"]\.['"]\s*\)\s*\.reduce\(`,
      native: () => {
        const list = new BlockList();
        list.addRange('10.0.0.5', '10.0.0.9');
        return ['10.0.0.4', '10.0.0.5', '10.0.0.7', '10.0.0.9', '10.0.0.10'].map((address) => list.check(address));
      },
      idiom: () => {
        const toLong = (address) => address.split('.').reduce((long, octet) => long * 256 + Number(octet), 0);
        const [start, end] = [toLong('10.0.0.5'), toLong('10.0.0.9')];
        return ['10.0.0.4', '10.0.0.5', '10.0.0.7', '10.0.0.9', '10.0.0.10'].map((address) => {
          const long = toLong(address);
          return long >= start && long <= end;
        });
      },
    },
  },
};
