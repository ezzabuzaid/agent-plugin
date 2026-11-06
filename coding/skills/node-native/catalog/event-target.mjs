// DOM-style events: an EventTarget that dispatches Event and CustomEvent objects.

// What listeners see across dispatches: type, detail, target, phase, a once
// listener, removal, an aborted listener's signal and a cancelled event.
const dispatched = (EventTarget, Event, CustomEvent) => {
  const target = new EventTarget();
  const seen = [];
  const listener = (event) => seen.push([event.type, event.detail ?? null, event.target === target, event.eventPhase]);
  const controller = new AbortController();
  target.addEventListener('x', listener);
  target.addEventListener('x', () => seen.push('once'), { once: true });
  target.addEventListener('x', () => seen.push('aborted listener'), { signal: controller.signal });
  controller.abort();
  target.dispatchEvent(new Event('x'));
  target.dispatchEvent(CustomEvent ? new CustomEvent('x', { detail: 1 }) : new Event('x'));
  target.removeEventListener('x', listener);
  target.dispatchEvent(new Event('x'));
  const cancelable = new Event('y', { cancelable: true });
  target.addEventListener('y', (event) => event.preventDefault());
  return [seen, target.dispatchEvent(cancelable), cancelable.defaultPrevented];
};

export default {
  apis: ['globals:EventTarget', 'globals:Event', 'globals:CustomEvent', 'js:EventTarget', 'js:CustomEvent'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'event-target-shim@6.0.2': {
      EventTarget: {
        native: () => dispatched(EventTarget, Event, CustomEvent),
        package: ({ EventTarget }) => dispatched(EventTarget, Event, CustomEvent),
      },
      Event: {
        native: () => dispatched(EventTarget, Event),
        package: ({ EventTarget, Event }) => dispatched(EventTarget, Event),
      },
    },
    '@ungap/event-target@0.2.4': {
      default: {
        native: () => EventTarget,
        package: ({ default: Polyfill }) => Polyfill,
      },
    },
    'custom-event@1.0.1': {
      default: {
        native: () => CustomEvent,
        package: ({ default: Polyfill }) => Polyfill,
      },
    },
  },
};
