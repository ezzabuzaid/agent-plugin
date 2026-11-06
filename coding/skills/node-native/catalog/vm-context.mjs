// Running code in a separate global context. Neither side is a security
// boundary for untrusted code: vm2 is unmaintained with known escapes, and
// node:vm says outright that it is not a security mechanism.
import vm from 'node:vm';
import { outcome } from './support/outcome.mjs';

const described = (error) => `${error.name}: ${error.message}`;
export default {
  apis: ['vm:vm.runInNewContext'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'vm2@3.12.2': {
      VM: {
        native: () => vm.runInNewContext('a + b', { a: 1, b: 2 }),
        package: ({ VM }) => new VM({ sandbox: { a: 1, b: 2 } }).run('a + b'),
      },
      'VM: timeout': {
        native: () => outcome(() => vm.runInNewContext('while (true) {}', {}, { timeout: 50 }), described),
        package: ({ VM }) => outcome(() => new VM({ timeout: 50 }).run('while (true) {}'), described),
      },
      'VM: eval': {
        native: () => outcome(() => vm.runInNewContext('eval("1 + 1")', {}, { contextCodeGeneration: { strings: false } }), described),
        package: ({ VM }) => outcome(() => new VM({ eval: false }).run('eval("1 + 1")'), described),
      },
      'VM: no host globals': {
        native: () => vm.runInNewContext('[typeof process, typeof require].join()', {}),
        package: ({ VM }) => new VM().run('[typeof process, typeof require].join()'),
      },
      'VM: escape through constructors': {
        gap: "not a sandbox: code reaches the host's process through this.constructor.constructor",
        native: () => vm.runInNewContext("this.constructor.constructor('return typeof process')()", {}),
        package: ({ VM }) => new VM().run("this.constructor.constructor('return typeof process')()"),
      },
    },
  },
};
