// Masking and unmasking WebSocket frame payloads (RFC 6455 section 5.3):
// http.websocketMask writes the masked bytes into an output buffer,
// http.websocketUnmask unmasks a buffer in place.
import { websocketMask, websocketUnmask } from 'node:http';

const MASK = Buffer.from([0x37, 0xfa, 0x21, 0x3d]);
// A payload long enough for word-at-a-time code paths, and not a multiple of 4.
const payload = () => Buffer.from('Hello, WebSocket frame payload!'.repeat(3));
// Masks the payload into an output buffer at offset 2, as a frame header would leave it.
const masked = (mask) => {
  const source = payload();
  const output = Buffer.alloc(source.length + 2);
  mask(source, MASK, output, 2, source.length);
  return output.toString('hex');
};
const unmasked = (unmask) => {
  const buffer = Buffer.from(masked(websocketMask), 'hex').subarray(2);
  unmask(buffer, MASK);
  return buffer.toString();
};

export default {
  apis: ['http:http.websocketMask', 'http:http.websocketUnmask'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'bufferutil@4.1.0': {
      mask: {
        native: () => masked(websocketMask),
        package: ({ mask }) => masked(mask),
      },
      unmask: {
        native: () => unmasked(websocketUnmask),
        package: ({ unmask }) => unmasked(unmask),
      },
    },
  },
};
