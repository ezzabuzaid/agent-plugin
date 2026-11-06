// One error that carries several errors.
const errors = () => [new Error('one'), new TypeError('two')];
const summary = (error) => [error.name, error instanceof Error, Error.isError(error), error.errors.map((item) => [item.name, item.message])];

export default {
  apis: ['js:AggregateError', 'js:AggregateError.prototype.message'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'aggregate-error@5.1.0': {
      default: {
        native: () => summary(new AggregateError(errors())),
        package: ({ default: AggregateErrorPackage }) => summary(new AggregateErrorPackage(errors())),
      },
      'default: message': {
        gap: 'aggregate-error builds its message from the stacks of the errors it holds; the native message is the second argument, or empty',
        native: () => new AggregateError(errors()).message.includes('one'),
        package: ({ default: AggregateErrorPackage }) => new AggregateErrorPackage(errors()).message.includes('one'),
      },
      'default: non-Error items': {
        gap: 'aggregate-error wraps a string or plain object into an Error; native AggregateError keeps each item as it is',
        native: () => new AggregateError(['two', { message: 'three' }]).errors.map((item) => item instanceof Error),
        package: ({ default: AggregateErrorPackage }) =>
          new AggregateErrorPackage(['two', { message: 'three' }]).errors.map((item) => item instanceof Error),
      },
      'default: any iterable': {
        improves: 'native AggregateError takes any iterable (a Set); aggregate-error throws TypeError unless it gets an array',
        native: () => new AggregateError(new Set(errors())).errors.length,
        package: ({ default: AggregateErrorPackage }) => {
          try {
            return new AggregateErrorPackage(new Set(errors())).errors.length;
          } catch (error) {
            return error.name;
          }
        },
      },
    },
  },
};
