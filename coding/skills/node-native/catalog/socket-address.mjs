// Parsing "<ip>:<port>" and "[<ipv6>]:<port>": net.SocketAddress.parse.
import { SocketAddress } from 'node:net';

const parts = (input) => {
  const parsed = SocketAddress.parse(input);
  return parsed && { address: parsed.address, port: parsed.port };
};

export default {
  apis: ['net:SocketAddress.parse', 'net:net.SocketAddress'],
  reviewedAt: 'v26.13.0',
  idioms: {
    splitHostPort: {
      seed: String.raw`\[\s*(?:host|hostname|address|ip)\s*,\s*port\s*\]\s*=\s*[\w.]+\.split\(\s*['"]:['"]`,
      native: () => parts('127.0.0.1:8080'),
      idiom: () => {
        const address = '127.0.0.1:8080';
        const [host, port] = address.split(':');
        return { address: host, port: Number(port) };
      },
    },
    'splitHostPort: IPv6': {
      improves: 'SocketAddress.parse("[::1]:8080") returns ::1 and 8080; split(":") cuts a bracketed IPv6 address apart',
      native: () => parts('[2001:db8::1]:8080'),
      idiom: () => {
        const address = '[2001:db8::1]:8080';
        const [host, port] = address.split(':');
        return { address: host, port: Number(port) };
      },
    },
    'splitHostPort: host name': {
      gap: 'SocketAddress.parse takes IP literals only and returns undefined for localhost:8080; a split keeps the host name',
      native: () => parts('localhost:8080'),
      idiom: () => {
        const address = 'localhost:8080';
        const [host, port] = address.split(':');
        return { address: host, port: Number(port) };
      },
    },
    'splitHostPort: port 80': {
      gap: 'SocketAddress.parse("10.0.0.1:80") reports port 0: it parses through an http: URL, which drops 80 as the default port',
      native: () => parts('10.0.0.1:80'),
      idiom: () => {
        const address = '10.0.0.1:80';
        const [host, port] = address.split(':');
        return { address: host, port: Number(port) };
      },
    },
  },
};
