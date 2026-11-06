// Build multipart/form-data bodies: fields and files under one boundary.
import { PassThrough, Readable } from 'node:stream';
import { text } from 'node:stream/consumers';

// A multipart body with its random boundary replaced, so two encoders compare.
const unbounded = (type, body) => {
  const boundary = type.split('boundary=')[1];
  return [type.replace(boundary, 'BOUNDARY'), body.replaceAll(boundary, 'BOUNDARY')];
};
// What native FormData sends: the content type and the body a fetch would carry.
const encoded = async (form) => {
  const response = new Response(form);
  return unbounded(response.headers.get('content-type'), await response.text());
};
const formData = (append) => {
  const form = new FormData();
  append(form);
  return encoded(form);
};
// What the form-data package sends for the same parts.
const packaged = (FormDataPackage, append) => {
  const form = new FormDataPackage();
  append(form);
  return unbounded(form.getHeaders()['content-type'], form.getBuffer().toString());
};
// Each entry as [name, value], a file as [name, [filename, type, text]].
const entries = async (form) =>
  Promise.all(
    [...form].map(async ([name, value]) => [
      name,
      typeof value === 'string' ? value : [value.name, value.type, await value.text()],
    ]),
  );
const filled = (FormData, File) => {
  const form = new FormData();
  form.append('a', '1');
  form.append('a', '2');
  form.set('b', '3');
  form.append('file', new File(['hi'], 'a.txt', { type: 'text/plain' }));
  form.delete('b');
  return entries(form);
};

export default {
  apis: ['globals:FormData', 'js:FormData'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'form-data@4.0.6': {
      default: {
        native: () =>
          formData((form) => {
            form.append('a', '1');
            form.append('file', new File(['hi'], 'a.txt', { type: 'text/plain' }));
            form.append('raw', new File(['x'], 'b.bin'));
          }),
        package: ({ default: FormDataPackage }) =>
          packaged(FormDataPackage, (form) => {
            form.append('a', '1');
            form.append('file', Buffer.from('hi'), { filename: 'a.txt', contentType: 'text/plain' });
            form.append('raw', Buffer.from('x'), { filename: 'b.bin' });
          }),
      },
      'default: number value': {
        native: () => formData((form) => form.append('n', 1)),
        package: ({ default: FormDataPackage }) => packaged(FormDataPackage, (form) => form.append('n', 1)),
      },
      'default: content type from the file name': {
        gap: 'form-data guesses a file part\'s Content-Type from its filename (a.json → application/json); FormData sends a File without a type as application/octet-stream',
        native: () => formData((form) => form.append('file', new File(['{}'], 'a.json'))),
        package: ({ default: FormDataPackage }) =>
          packaged(FormDataPackage, (form) => form.append('file', Buffer.from('{}'), { filename: 'a.json' })),
      },
      'default: stream value': {
        gap: 'form-data streams a Readable as a part; FormData takes only strings and Blobs and sends a stream as the text "[object Object]"',
        native: () => formData((form) => form.append('s', Readable.from(['x']))),
        package: async ({ default: FormDataPackage }) => {
          const form = new FormDataPackage();
          form.append('s', Readable.from(['x']));
          const body = new PassThrough();
          form.pipe(body);
          return unbounded(form.getHeaders()['content-type'], await text(body));
        },
      },
    },
    'formdata-node@6.0.3': {
      FormData: {
        native: () => filled(FormData, File),
        package: ({ FormData, File }) => filled(FormData, File),
      },
      'FormData: as a fetch body': {
        improves: 'fetch and Response encode a native FormData as multipart; a formdata-node FormData goes out as the text "[object FormData]", so a migration swaps every FormData at once',
        native: () =>
          formData((form) => {
            form.append('a', '1');
            form.append('file', new File(['hi'], 'a.txt', { type: 'text/plain' }));
          }),
        package: ({ FormData, File }) => {
          const form = new FormData();
          form.append('a', '1');
          form.append('file', new File(['hi'], 'a.txt', { type: 'text/plain' }));
          return encoded(form);
        },
      },
    },
    'node-fetch@3.3.2': {
      FormData: {
        native: () => filled(FormData, File),
        package: ({ FormData, File }) => filled(FormData, File),
      },
    },
  },
};
