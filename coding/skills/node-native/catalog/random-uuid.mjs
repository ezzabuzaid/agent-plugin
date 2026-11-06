// Generate a random (version 4) or time-ordered (version 7) UUID.
import { randomUUID, randomUUIDv7 } from 'node:crypto';

const FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// What a UUID's text says about it, without its random bits.
const shape = (uuid) => ({ format: FORMAT.test(uuid), version: uuid[14], variant: '89ab'.includes(uuid[19]) });
// A version 7 UUID also carries its creation time in its first 48 bits.
const shapeV7 = (uuid) => ({ ...shape(uuid), recent: Math.abs(Number.parseInt(uuid.slice(0, 8) + uuid.slice(9, 13), 16) - Date.now()) < 60_000 });
const ascending = (uuids) => uuids.every((uuid, index) => index === 0 || uuids[index - 1] < uuid);
const many = (generate) => Array.from({ length: 2000 }, () => generate());

export default {
  apis: ['crypto:crypto.randomUUID', 'crypto:crypto.randomUUIDv7', 'webcrypto:crypto.randomUUID'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'uuid@14.0.3': {
      v4: {
        native: () => shape(randomUUID()),
        package: ({ v4 }) => shape(v4()),
      },
      v7: {
        native: () => shapeV7(randomUUIDv7()),
        package: ({ v7 }) => shapeV7(v7()),
      },
      'v7: monotonic within a millisecond': {
        gap: 'uuid v7 keeps a sequence counter, so UUIDs made in one millisecond sort in creation order; crypto.randomUUIDv7 fills those bits at random and is not guaranteed to increase',
        native: () => ascending(many(randomUUIDv7)),
        package: ({ v7 }) => ascending(many(v7)),
      },
      'v7: msecs option': {
        gap: 'uuid v7 takes { msecs } to set the timestamp; crypto.randomUUIDv7 has no option for it and always uses the current time',
        native: () => randomUUIDv7({ msecs: 0 }).slice(0, 13),
        package: ({ v7 }) => v7({ msecs: 0 }).slice(0, 13),
      },
      'v1: time-based': {
        gap: 'no version 1 (Gregorian time + node id) UUID; the time-ordered native UUID is crypto.randomUUIDv7, version 7',
        native: () => randomUUIDv7()[14],
        package: ({ v1 }) => v1()[14],
      },
      'v6: time-based': {
        gap: 'no version 6 (reordered Gregorian time) UUID; the time-ordered native UUID is crypto.randomUUIDv7, version 7',
        native: () => randomUUIDv7()[14],
        package: ({ v6 }) => v6()[14],
      },
    },
  },
  idioms: {
    mathRandomUuid: {
      seed: "['\"`]xxxxxxxx-xxxx-4xxx-[yx]xxx-xxxxxxxxxxxx['\"`]",
      native: () => shape(crypto.randomUUID()),
      idiom: () =>
        shape(
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
            const random = Math.trunc(Math.random() * 16);
            return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
          }),
        ),
    },
  },
};
