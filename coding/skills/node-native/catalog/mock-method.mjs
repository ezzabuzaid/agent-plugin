// Test doubles on an existing object: spy on or replace a method, a getter, a
// setter or a property value, and put the original back.
import { mock } from 'node:test';

// A fresh object for every probe: a method that reads `this`, an accessor pair
// and a plain value.
const subject = () => ({
  base: 10,
  add(a) {
    return this.base + a;
  },
  get doubled() {
    return this.base * 2;
  },
  set doubled(value) {
    this.base = value / 2;
  },
  label: 'real',
});
// What a spied method reports after two calls, and what the object does once
// it is restored.
const spied = (object, readCalls, restore) => {
  const results = [object.add(1), object.add(2)];
  const recorded = readCalls();
  restore();
  return { results, recorded, restored: object.add(1) };
};
const nativeSpy = (implementation) => {
  const object = subject();
  const tracker = mock.method(object, 'add', ...(implementation ? [implementation] : []));
  return spied(
    object,
    () => tracker.mock.calls.map((call) => ({ args: call.arguments, result: call.result, self: call.this === object })),
    () => tracker.mock.restore(),
  );
};
const nativeGetter = () => {
  const object = subject();
  const getter = mock.getter(object, 'doubled', () => 0);
  const read = [object.doubled, getter.mock.callCount()];
  getter.mock.restore();
  return [...read, object.doubled];
};
const nativeProperty = () => {
  const object = subject();
  const property = mock.property(object, 'label', 'fake');
  const read = object.label;
  property.mock.restore();
  return [read, object.label];
};
const nativeRestoreAll = () => {
  const object = subject();
  mock.method(object, 'add', () => 0);
  mock.getter(object, 'doubled', () => 0);
  const replaced = [object.add(1), object.doubled];
  mock.restoreAll();
  return [...replaced, object.add(1), object.doubled];
};

export default {
  apis: [
    'test:mock.method',
    'test:mock.getter',
    'test:mock.setter',
    'test:mock.property',
    'test:MockPropertyContext',
    'test:ctx.accessCount',
    'test:ctx.restore',
    'test:mock.restoreAll',
    'test:MockTracker',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'sinon@22.1.0': {
      spy: {
        native: () => nativeSpy(),
        package: ({ default: sinon }) => {
          const object = subject();
          const spy = sinon.spy(object, 'add');
          return spied(
            object,
            () => spy.getCalls().map((call) => ({ args: call.args, result: call.returnValue, self: call.thisValue === object })),
            () => spy.restore(),
          );
        },
      },
      stub: {
        native: () => nativeSpy(() => 0),
        package: ({ default: sinon }) => {
          const object = subject();
          const stub = sinon.stub(object, 'add').returns(0);
          return spied(
            object,
            () => stub.getCalls().map((call) => ({ args: call.args, result: call.returnValue, self: call.thisValue === object })),
            () => stub.restore(),
          );
        },
      },
      replaceGetter: {
        native: nativeGetter,
        package: ({ default: sinon }) => {
          const sandbox = sinon.createSandbox();
          const object = subject();
          const getter = sinon.fake.returns(0);
          sandbox.replaceGetter(object, 'doubled', getter);
          const read = [object.doubled, getter.callCount];
          sandbox.restore();
          return [...read, object.doubled];
        },
      },
      replaceSetter: {
        native: () => {
          const object = subject();
          const setter = mock.setter(object, 'doubled', function (value) {
            this.base = value;
          });
          object.doubled = 4;
          const replaced = object.base;
          setter.mock.restore();
          object.doubled = 4;
          return [replaced, object.base];
        },
        package: ({ default: sinon }) => {
          const sandbox = sinon.createSandbox();
          const object = subject();
          sandbox.replaceSetter(object, 'doubled', function (value) {
            this.base = value;
          });
          object.doubled = 4;
          const replaced = object.base;
          sandbox.restore();
          object.doubled = 4;
          return [replaced, object.base];
        },
      },
      replace: {
        native: nativeProperty,
        package: ({ default: sinon }) => {
          const sandbox = sinon.createSandbox();
          const object = subject();
          sandbox.replace(object, 'label', 'fake');
          const read = object.label;
          sandbox.restore();
          return [read, object.label];
        },
      },
      restore: {
        native: nativeRestoreAll,
        package: ({ default: sinon }) => {
          const sandbox = sinon.createSandbox();
          const object = subject();
          sandbox.stub(object, 'add').returns(0);
          sandbox.replaceGetter(object, 'doubled', () => 0);
          const replaced = [object.add(1), object.doubled];
          sandbox.restore();
          return [...replaced, object.add(1), object.doubled];
        },
      },
    },
    'jest-mock@30.5.2': {
      spyOn: {
        native: () => nativeSpy(),
        package: ({ spyOn }) => {
          const object = subject();
          const spy = spyOn(object, 'add');
          return spied(
            object,
            () => spy.mock.calls.map((args, index) => ({ args, result: spy.mock.results[index].value, self: spy.mock.contexts[index] === object })),
            () => spy.mockRestore(),
          );
        },
      },
      'spyOn: mockImplementation': {
        native: () => nativeSpy(() => 0),
        package: ({ spyOn }) => {
          const object = subject();
          const spy = spyOn(object, 'add').mockImplementation(() => 0);
          return spied(
            object,
            () => spy.mock.calls.map((args, index) => ({ args, result: spy.mock.results[index].value, self: spy.mock.contexts[index] === object })),
            () => spy.mockRestore(),
          );
        },
      },
      'spyOn: getter': {
        native: nativeGetter,
        package: ({ spyOn }) => {
          const object = subject();
          const spy = spyOn(object, 'doubled', 'get').mockImplementation(() => 0);
          const read = [object.doubled, spy.mock.calls.length];
          spy.mockRestore();
          return [...read, object.doubled];
        },
      },
      replaceProperty: {
        native: nativeProperty,
        package: ({ replaceProperty }) => {
          const object = subject();
          const replaced = replaceProperty(object, 'label', 'fake');
          const read = object.label;
          replaced.restore();
          return [read, object.label];
        },
      },
      'replaceProperty: access count': {
        gap: 'jest-mock records nothing about a replaced property; mock.property counts every read and write',
        native: () => {
          const object = subject();
          const property = mock.property(object, 'label', 'fake');
          void object.label;
          object.label = 'set';
          return property.mock.accessCount();
        },
        package: ({ replaceProperty }) => {
          const object = subject();
          const replaced = replaceProperty(object, 'label', 'fake');
          void object.label;
          object.label = 'set';
          return replaced.accessCount?.() ?? 'no access record';
        },
      },
      restoreAllMocks: {
        native: nativeRestoreAll,
        package: ({ ModuleMocker }) => {
          const mocker = new ModuleMocker(globalThis);
          const object = subject();
          mocker.spyOn(object, 'add').mockImplementation(() => 0);
          mocker.spyOn(object, 'doubled', 'get').mockImplementation(() => 0);
          const replaced = [object.add(1), object.doubled];
          mocker.restoreAllMocks();
          return [...replaced, object.add(1), object.doubled];
        },
      },
    },
    'tinyspy@4.0.6': {
      spyOn: {
        native: () => {
          // tinyspy records no `this`
          const { recorded, ...rest } = nativeSpy();
          return { ...rest, recorded: recorded.map(({ args, result }) => ({ args, result })) };
        },
        package: ({ spyOn }) => {
          const object = subject();
          const spy = spyOn(object, 'add');
          return spied(
            object,
            () => spy.calls.map((args, index) => ({ args, result: spy.results[index][1] })),
            () => spy.restore(),
          );
        },
      },
      'spyOn: getter': {
        native: nativeGetter,
        package: ({ spyOn }) => {
          const object = subject();
          const spy = spyOn(object, { getter: 'doubled' }, () => 0);
          const read = [object.doubled, spy.callCount];
          spy.restore();
          return [...read, object.doubled];
        },
      },
    },
    'testdouble@4.0.0': {
      replace: {
        native: () => {
          const object = subject();
          mock.method(object, 'add', () => undefined);
          const replaced = object.add(1);
          mock.restoreAll();
          return [replaced, object.add(1)];
        },
        package: ({ replace, reset }) => {
          const object = subject();
          replace(object, 'add');
          const replaced = object.add(1);
          reset();
          return [replaced, object.add(1)];
        },
      },
    },
  },
};
