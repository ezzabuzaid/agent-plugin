// Decoding a byte stream to text without splitting a multi-byte character across chunks.
import { StringDecoder } from 'node:string_decoder';

const bytes = Buffer.from('€ ok 😀 ü', 'utf8');
const chunks = [bytes.subarray(0, 1), bytes.subarray(1, 5), bytes.subarray(5, 9), bytes.subarray(9, 12)];
const rest = bytes.subarray(12);
const decode = (Decoder, encoding) => {
  const decoder = new Decoder(encoding);
  return [...chunks.map((chunk) => decoder.write(chunk)), decoder.end(rest)];
};
const encodings = ['utf8', 'utf16le', 'base64', 'hex', 'latin1'];

export default {
  apis: ['string_decoder:StringDecoder', 'string_decoder:stringDecoder.write', 'string_decoder:stringDecoder.end'],
  reviewedAt: 'v26.13.0',
  replaces: {
    // The bare name resolves to node:string_decoder, so the package is keyed by its file.
    'string_decoder@1.3.0/lib/string_decoder.js': {
      StringDecoder: {
        native: () => encodings.map((encoding) => decode(StringDecoder, encoding)),
        package: ({ StringDecoder: Userland }) => encodings.map((encoding) => decode(Userland, encoding)),
      },
      'StringDecoder: truncated character at end': {
        native: () => {
          const decoder = new StringDecoder('utf8');
          return [decoder.write(Buffer.from([0xe2, 0x82])), decoder.end()];
        },
        package: ({ StringDecoder: Userland }) => {
          const decoder = new Userland('utf8');
          return [decoder.write(Buffer.from([0xe2, 0x82])), decoder.end()];
        },
      },
    },
  },
};
