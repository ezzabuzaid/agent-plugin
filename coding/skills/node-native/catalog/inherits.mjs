// Prototype inheritance between two constructors. Node marks util.inherits
// legacy and points at ES2015 `class … extends`, so the native side is the
// syntax, not util.inherits.

const chainOf = (Parent, Child) => {
  const child = new Child();
  return [Object.getPrototypeOf(Child.prototype) === Parent.prototype, child instanceof Parent, child.greet()];
};

const withClasses = () => {
  class Parent {
    greet() {
      return 'hi';
    }
  }
  class Child extends Parent {}
  return { Parent, Child };
};

const withInherits = (inherits) => {
  function Parent() {}
  Parent.prototype.greet = () => 'hi';
  function Child() {}
  inherits(Child, Parent);
  return { Parent, Child };
};

export default {
  apis: ['js:syntax:class-extends'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'inherits@2.0.4': {
      default: {
        native: () => {
          const { Parent, Child } = withClasses();
          return chainOf(Parent, Child);
        },
        package: ({ default: inherits }) => {
          const { Parent, Child } = withInherits(inherits);
          return chainOf(Parent, Child);
        },
      },
      'default: super_': {
        gap: 'class … extends sets no `super_` on the child; code that reads Child.super_ must use Object.getPrototypeOf(Child) or super',
        native: () => withClasses().Child.super_ !== undefined,
        package: ({ default: inherits }) => withInherits(inherits).Child.super_ !== undefined,
      },
    },
  },
  lint: {
    banInherits: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'inherits',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import inherits from 'inherits';",
    },
  },
};
