// Named pub/sub channels for instrumentation, and tracing channels that publish
// the start, end and error of a sync, callback or promise operation.
import { AsyncLocalStorage } from 'node:async_hooks';
import dc from 'node:diagnostics_channel';

// What subscribers of `name` receive while `publish` runs; the subscription
// ends afterwards. `api` is node:diagnostics_channel or a package with its shape.
function received(api, name, publish, { subscribeWith = api } = {}) {
  const messages = [];
  const subscriber = (message, channelName) => messages.push([channelName, message]);
  subscribeWith.channel(name).subscribe(subscriber);
  try {
    publish(api.channel(name));
  } finally {
    subscribeWith.channel(name).unsubscribe(subscriber);
  }
  return messages;
}

const events = ['start', 'end', 'asyncStart', 'asyncEnd', 'error'];

// The tracing events, in order, that `trace` publishes on a tracing channel.
async function traced(api, name, trace) {
  const seen = [];
  const handlers = Object.fromEntries(events.map((event) => [event, (context) => seen.push([event, context.input])]));
  const channel = api.tracingChannel(name);
  channel.subscribe(handlers);
  try {
    await trace(channel);
  } catch {
    // The error is a published event.
  } finally {
    channel.unsubscribe(handlers);
  }
  return seen;
}

const traceRows = {
  'tracingChannel: traceSync': {
    native: () => traced(dc, 'probe:sync', (channel) => channel.traceSync(() => 1, { input: 'a' })),
    package: (api) => traced(api, 'probe:sync', (channel) => channel.traceSync(() => 1, { input: 'a' })),
  },
  'tracingChannel: tracePromise': {
    native: () => traced(dc, 'probe:promise', (channel) => channel.tracePromise(async () => 1, { input: 'a' })),
    package: (api) => traced(api, 'probe:promise', (channel) => channel.tracePromise(async () => 1, { input: 'a' })),
  },
  'tracingChannel: error': {
    native: () =>
      traced(dc, 'probe:error', (channel) =>
        channel.tracePromise(async () => {
          throw new Error('failed');
        }, { input: 'a' }),
      ),
    package: (api) =>
      traced(api, 'probe:error', (channel) =>
        channel.tracePromise(async () => {
          throw new Error('failed');
        }, { input: 'a' }),
      ),
  },
};

export default {
  apis: [
    'diagnostics_channel:diagnostics_channel.channel',
    'diagnostics_channel:channel.publish',
    'diagnostics_channel:channel.subscribe',
    'diagnostics_channel:channel.unsubscribe',
    'diagnostics_channel:diagnostics_channel.subscribe',
    'diagnostics_channel:diagnostics_channel.unsubscribe',
    'diagnostics_channel:diagnostics_channel.hasSubscribers',
    'diagnostics_channel:diagnostics_channel.tracingChannel',
    'diagnostics_channel:tracingChannel.traceSync',
    'diagnostics_channel:tracingChannel.tracePromise',
    'diagnostics_channel:channel.bindStore',
    'diagnostics_channel:channel.runStores',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    // On a Node that ships diagnostics_channel, dc-polyfill exports it.
    'dc-polyfill@0.1.11': {
      channel: {
        native: () => received(dc, 'probe:channel', (channel) => channel.publish({ id: 1 })),
        package: (api) => received(api, 'probe:channel', (channel) => channel.publish({ id: 1 })),
      },
      'channel: shared registry': {
        native: () => received(dc, 'probe:shared', (channel) => channel.publish({ id: 1 })),
        package: (api) => received(api, 'probe:shared', (channel) => channel.publish({ id: 1 }), { subscribeWith: dc }),
      },
      'channel: bindStore': {
        native: () => {
          const storage = new AsyncLocalStorage();
          const channel = dc.channel('probe:store');
          channel.bindStore(storage, (message) => ({ request: message.id }));
          return channel.runStores({ id: 1 }, () => storage.getStore());
        },
        package: (api) => {
          const storage = new AsyncLocalStorage();
          const channel = api.channel('probe:store');
          channel.bindStore(storage, (message) => ({ request: message.id }));
          return channel.runStores({ id: 1 }, () => storage.getStore());
        },
      },
      subscribe: {
        native: () => {
          const messages = [];
          const subscriber = (message) => messages.push(message);
          dc.subscribe('probe:top', subscriber);
          const before = dc.hasSubscribers('probe:top');
          dc.channel('probe:top').publish(1);
          dc.unsubscribe('probe:top', subscriber);
          return [messages, before, dc.hasSubscribers('probe:top')];
        },
        package: (api) => {
          const messages = [];
          const subscriber = (message) => messages.push(message);
          api.subscribe('probe:top', subscriber);
          const before = api.hasSubscribers('probe:top');
          api.channel('probe:top').publish(1);
          api.unsubscribe('probe:top', subscriber);
          return [messages, before, api.hasSubscribers('probe:top')];
        },
      },
      ...traceRows,
    },
    // A reimplementation for Node versions without the module.
    'diagnostics_channel@1.1.0/index.js': {
      channel: {
        native: () => received(dc, 'probe:old-channel', (channel) => channel.publish({ id: 1 })),
        package: ({ default: api }) => received(api, 'probe:old-channel', (channel) => channel.publish({ id: 1 })),
      },
      hasSubscribers: {
        native: () => {
          const subscriber = () => {};
          dc.channel('probe:old-has').subscribe(subscriber);
          const during = dc.hasSubscribers('probe:old-has');
          dc.channel('probe:old-has').unsubscribe(subscriber);
          return [during, dc.hasSubscribers('probe:old-has')];
        },
        package: ({ default: api }) => {
          const subscriber = () => {};
          api.channel('probe:old-has').subscribe(subscriber);
          const during = api.hasSubscribers('probe:old-has');
          api.channel('probe:old-has').unsubscribe(subscriber);
          return [during, api.hasSubscribers('probe:old-has')];
        },
      },
      'channel: shared registry': {
        improves: "node:diagnostics_channel channels are one registry for the process, so every subscriber (an APM agent, undici's) sees a publish; the npm diagnostics_channel package keeps its own channels, and those subscribers never see its messages",
        native: () => received(dc, 'probe:old-shared', (channel) => channel.publish({ id: 1 })),
        package: ({ default: api }) => received(api, 'probe:old-shared', (channel) => channel.publish({ id: 1 }), { subscribeWith: dc }),
      },
    },
  },
};
