// Asking the user one question on the terminal and reading the answer.
import { createInterface } from 'node:readline/promises';
import { PassThrough } from 'node:stream';

// The user types each line on a stream after the question is asked, one line
// at a time, as a person would: given two lines in one write, inquirer
// rejects with ExitPromptError instead of asking again.
const typed = (text) => {
  const input = new PassThrough();
  text.split(/(?<=\n)/).forEach((line, index) => setTimeout(() => input.write(line), 20 * (index + 1)));
  return input;
};
const discarded = () => new PassThrough().resume();

async function ask(text) {
  using rl = createInterface({ input: typed(text), output: discarded() });
  return await rl.question('Name? ');
}

const prompt = (input, text, options = {}) =>
  input({ message: 'Name?', ...options }, { input: typed(text), output: discarded() });

export default {
  apis: ['readline:readlinePromises.createInterface', 'readline:rl.question'],
  reviewedAt: 'v26.13.0',
  replaces: {
    '@inquirer/input@5.1.9': {
      default: {
        native: () => ask('Ada\n'),
        package: ({ default: input }) => prompt(input, 'Ada\n'),
      },
      'default: spaces kept': {
        native: () => ask('  Ada  \n'),
        package: ({ default: input }) => prompt(input, '  Ada  \n'),
      },
      'default: default answer': {
        gap: 'no default answer: an empty line resolves to an empty string',
        native: () => ask('\n'),
        package: ({ default: input }) => prompt(input, '\n', { default: 'Bob' }),
      },
      'default: validate': {
        gap: 'no validation: the first line is the answer, even an empty one',
        native: () => ask('\nAda\n'),
        package: ({ default: input }) => prompt(input, '\nAda\n', { validate: (value) => value.length > 0 || 'Required' }),
      },
    },
  },
};
