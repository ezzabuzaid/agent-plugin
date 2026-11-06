// Convert between file paths and file: URLs, percent-encoding what a URL needs.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { outcome } from './support/outcome.mjs';

const paths = ['/tmp/a b/c#d?.txt', '/tmp/ü', '/tmp/100%', 'relative/x'];
const urls = ['file:///tmp/a%20b', 'file://localhost/tmp/x', 'file:///tmp/%C3%BC'];

export default {
  apis: ['url:url.pathToFileURL', 'url:url.fileURLToPath'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'file-url@4.0.0': {
      default: {
        native: () => paths.map((path) => pathToFileURL(path).href),
        package: ({ default: fileUrl }) => paths.map((path) => fileUrl(path)),
      },
      'default: resolve false': {
        gap: 'file-url with { resolve: false } puts a relative path under the root (file:///relative/x); pathToFileURL always resolves it against the working directory',
        native: () => pathToFileURL('relative/x').href,
        package: ({ default: fileUrl }) => fileUrl('relative/x', { resolve: false }),
      },
    },
    'file-uri-to-path@2.0.0': {
      default: {
        native: () => urls.map((url) => fileURLToPath(url)),
        package: ({ default: toPath }) => urls.map((url) => toPath(url)),
      },
      'default: remote host': {
        gap: 'file-uri-to-path turns file://host/share/x into the path //host/share/x; fileURLToPath refuses a host other than localhost on POSIX with TypeError',
        native: () => outcome(() => fileURLToPath('file://host/share/x')),
        package: ({ default: toPath }) => outcome(() => toPath('file://host/share/x')),
      },
      'default: no slashes': {
        improves: 'fileURLToPath reads the valid URL file:/tmp/x as /tmp/x; file-uri-to-path refuses a URI without // with TypeError',
        native: () => outcome(() => fileURLToPath('file:/tmp/x')),
        package: ({ default: toPath }) => outcome(() => toPath('file:/tmp/x')),
      },
    },
  },
};
