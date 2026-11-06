// Dates, times, time zones, durations and calendars.
const scenario = (T) => [
  T.PlainDate.from('2024-01-31').add({ months: 1 }).toString(),
  T.PlainDate.from('2024-03-10').until('2024-12-25', { largestUnit: 'months' }).toString(),
  [T.PlainDate.from('2024-12-30').weekOfYear, T.PlainDate.from('2024-12-30').yearOfWeek],
  T.PlainDateTime.from('2024-03-10T01:30').toZonedDateTime('America/New_York').add({ hours: 1 }).toString(),
  T.ZonedDateTime.from('2024-11-03T01:30-04:00[America/New_York]').add({ hours: 1 }).toString(),
  T.Instant.fromEpochMilliseconds(1e12).toString(),
  T.Instant.from('2020-01-01T00:00:00.123456789Z').epochNanoseconds,
  T.Duration.from({ hours: 25, minutes: 90 }).round({ largestUnit: 'days', relativeTo: '2024-01-01' }).toString(),
  T.Duration.compare({ hours: 24 }, { days: 1 }, { relativeTo: '2024-03-10[America/New_York]' }),
  T.PlainTime.from('23:59:59.999').add({ milliseconds: 2 }).toString(),
  T.PlainYearMonth.from('2024-02').daysInMonth,
  T.PlainMonthDay.from('02-29').toPlainDate({ year: 2023 }).toString(),
  T.PlainDate.from('2024-05-01').withCalendar('hebrew').toString(),
  T.PlainDate.from('2024-05-01').withCalendar('japanese').eraYear,
  T.PlainDate.compare('2024-01-02', '2024-01-01'),
  T.Instant.from('2024-01-01T00:00Z').toZonedDateTimeISO('Asia/Kolkata').toPlainDateTime().toString(),
  T.PlainDate.from('2024-05-01').toLocaleString('en-US', { dateStyle: 'full' }),
  T.Duration.from({ hours: 1, minutes: 5 }).toLocaleString('en'),
  typeof T.Now.instant().epochNanoseconds,
];
const formatted = (T, Intl) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(T.PlainDateTime.from('2024-05-01T13:45'));

// date-fns works on Dates in the local time zone; each row runs the same
// calendar dates through both sides and compares yyyy-MM-dd text or numbers.
const days = ['2024-01-31', '2023-02-28', '2024-12-30', '2021-01-03', '2024-03-31'];
const P = (text) => Temporal.PlainDate.from(text);
const BASE = '2023-06-15';
const dateFns = {
  addDays: [(s) => P(s).add({ days: 40 }).toString(), (d, s) => d.format(d.addDays(d.parseISO(s), 40), 'yyyy-MM-dd')],
  subDays: [(s) => P(s).subtract({ days: 40 }).toString(), (d, s) => d.format(d.subDays(d.parseISO(s), 40), 'yyyy-MM-dd')],
  addWeeks: [(s) => P(s).add({ weeks: 3 }).toString(), (d, s) => d.format(d.addWeeks(d.parseISO(s), 3), 'yyyy-MM-dd')],
  subWeeks: [(s) => P(s).subtract({ weeks: 3 }).toString(), (d, s) => d.format(d.subWeeks(d.parseISO(s), 3), 'yyyy-MM-dd')],
  addMonths: [(s) => P(s).add({ months: 1 }).toString(), (d, s) => d.format(d.addMonths(d.parseISO(s), 1), 'yyyy-MM-dd')],
  subMonths: [(s) => P(s).subtract({ months: 1 }).toString(), (d, s) => d.format(d.subMonths(d.parseISO(s), 1), 'yyyy-MM-dd')],
  addQuarters: [(s) => P(s).add({ months: 3 }).toString(), (d, s) => d.format(d.addQuarters(d.parseISO(s), 1), 'yyyy-MM-dd')],
  addYears: [(s) => P(s).add({ years: 1 }).toString(), (d, s) => d.format(d.addYears(d.parseISO(s), 1), 'yyyy-MM-dd')],
  subYears: [(s) => P(s).subtract({ years: 1 }).toString(), (d, s) => d.format(d.subYears(d.parseISO(s), 1), 'yyyy-MM-dd')],
  startOfMonth: [(s) => P(s).with({ day: 1 }).toString(), (d, s) => d.format(d.startOfMonth(d.parseISO(s)), 'yyyy-MM-dd')],
  endOfMonth: [(s) => P(s).with({ day: P(s).daysInMonth }).toString(), (d, s) => d.format(d.endOfMonth(d.parseISO(s)), 'yyyy-MM-dd')],
  lastDayOfMonth: [(s) => P(s).with({ day: 31 }).toString(), (d, s) => d.format(d.lastDayOfMonth(d.parseISO(s)), 'yyyy-MM-dd')],
  startOfYear: [(s) => P(s).with({ month: 1, day: 1 }).toString(), (d, s) => d.format(d.startOfYear(d.parseISO(s)), 'yyyy-MM-dd')],
  endOfYear: [(s) => P(s).with({ month: 12, day: 31 }).toString(), (d, s) => d.format(d.endOfYear(d.parseISO(s)), 'yyyy-MM-dd')],
  startOfISOWeek: [(s) => P(s).subtract({ days: P(s).dayOfWeek - 1 }).toString(), (d, s) => d.format(d.startOfISOWeek(d.parseISO(s)), 'yyyy-MM-dd')],
  setMonth: [(s) => P(s).with({ month: 2 }).toString(), (d, s) => d.format(d.setMonth(d.parseISO(s), 1), 'yyyy-MM-dd')],
  setYear: [(s) => P(s).with({ year: 2023 }).toString(), (d, s) => d.format(d.setYear(d.parseISO(s), 2023), 'yyyy-MM-dd')],
  getDate: [(s) => P(s).day, (d, s) => d.getDate(d.parseISO(s))],
  getMonth: [(s) => P(s).month - 1, (d, s) => d.getMonth(d.parseISO(s))],
  getYear: [(s) => P(s).year, (d, s) => d.getYear(d.parseISO(s))],
  getDay: [(s) => P(s).dayOfWeek % 7, (d, s) => d.getDay(d.parseISO(s))],
  getISODay: [(s) => P(s).dayOfWeek, (d, s) => d.getISODay(d.parseISO(s))],
  getDayOfYear: [(s) => P(s).dayOfYear, (d, s) => d.getDayOfYear(d.parseISO(s))],
  getDaysInMonth: [(s) => P(s).daysInMonth, (d, s) => d.getDaysInMonth(d.parseISO(s))],
  getDaysInYear: [(s) => P(s).daysInYear, (d, s) => d.getDaysInYear(d.parseISO(s))],
  getISOWeek: [(s) => P(s).weekOfYear, (d, s) => d.getISOWeek(d.parseISO(s))],
  getISOWeekYear: [(s) => P(s).yearOfWeek, (d, s) => d.getISOWeekYear(d.parseISO(s))],
  getQuarter: [(s) => Math.ceil(P(s).month / 3), (d, s) => d.getQuarter(d.parseISO(s))],
  isLeapYear: [(s) => P(s).inLeapYear, (d, s) => d.isLeapYear(d.parseISO(s))],
  isWeekend: [(s) => P(s).dayOfWeek >= 6, (d, s) => d.isWeekend(d.parseISO(s))],
  differenceInDays: [(s) => P(s).since(BASE).days, (d, s) => d.differenceInDays(d.parseISO(s), d.parseISO(BASE))],
  differenceInCalendarDays: [(s) => P(s).since(BASE).days, (d, s) => d.differenceInCalendarDays(d.parseISO(s), d.parseISO(BASE))],
  differenceInWeeks: [(s) => P(s).since(BASE, { largestUnit: 'weeks' }).weeks, (d, s) => d.differenceInWeeks(d.parseISO(s), d.parseISO(BASE))],
  differenceInMonths: [(s) => P(s).since(BASE, { largestUnit: 'months' }).months, (d, s) => d.differenceInMonths(d.parseISO(s), d.parseISO(BASE))],
  differenceInYears: [(s) => P(s).since(BASE, { largestUnit: 'years' }).years, (d, s) => d.differenceInYears(d.parseISO(s), d.parseISO(BASE))],
  compareAsc: [(s) => Temporal.PlainDate.compare(s, BASE), (d, s) => d.compareAsc(d.parseISO(s), d.parseISO(BASE))],
  compareDesc: [(s) => Temporal.PlainDate.compare(BASE, s), (d, s) => d.compareDesc(d.parseISO(s), d.parseISO(BASE))],
  isBefore: [(s) => Temporal.PlainDate.compare(s, '2024-01-01') < 0, (d, s) => d.isBefore(d.parseISO(s), d.parseISO('2024-01-01'))],
  isAfter: [(s) => Temporal.PlainDate.compare(s, '2024-01-01') > 0, (d, s) => d.isAfter(d.parseISO(s), d.parseISO('2024-01-01'))],
  isEqual: [(s) => P(s).equals('2024-01-31'), (d, s) => d.isEqual(d.parseISO(s), d.parseISO('2024-01-31'))],
  isSameDay: [(s) => P(s).equals('2024-01-31'), (d, s) => d.isSameDay(d.parseISO(s), d.parseISO('2024-01-31'))],
  isSameMonth: [(s) => P(s).toPlainYearMonth().equals('2024-01'), (d, s) => d.isSameMonth(d.parseISO(s), d.parseISO('2024-01-15'))],
  parseISO: [(s) => P(s).toString(), (d, s) => d.format(d.parseISO(s), 'yyyy-MM-dd')],
  formatISO: [(s) => P(s).toString(), (d, s) => d.formatISO(d.parseISO(s), { representation: 'date' })],
};
const instants = {
  addHours: [() => Temporal.Instant.from('2024-03-10T06:30:00Z').add({ hours: 3 }).epochMilliseconds, (d) => d.addHours(new Date('2024-03-10T06:30:00Z'), 3).getTime()],
  addMinutes: [() => Temporal.Instant.from('2024-03-10T06:30:00Z').add({ minutes: 90 }).epochMilliseconds, (d) => d.addMinutes(new Date('2024-03-10T06:30:00Z'), 90).getTime()],
  differenceInHours: [() => Temporal.Instant.from('2024-03-10T12:00Z').since('2024-03-09T12:30Z', { largestUnit: 'hours' }).hours, (d) => d.differenceInHours(new Date('2024-03-10T12:00Z'), new Date('2024-03-09T12:30Z'))],
  differenceInMilliseconds: [() => Temporal.Instant.from('2024-03-10T12:00Z').since('2024-03-09T12:30Z').total('milliseconds'), (d) => d.differenceInMilliseconds(new Date('2024-03-10T12:00Z'), new Date('2024-03-09T12:30Z'))],
  fromUnixTime: [() => Temporal.Instant.fromEpochMilliseconds(1700000000 * 1000).epochMilliseconds, (d) => d.fromUnixTime(1700000000).getTime()],
  getUnixTime: [() => Math.floor(Temporal.Instant.from('2023-11-14T22:13:20Z').epochMilliseconds / 1000), (d) => d.getUnixTime(new Date('2023-11-14T22:13:20Z'))],
};

const polyfillRows = {
  Temporal: {
    native: () => scenario(Temporal),
    package: ({ Temporal: Polyfill }) => scenario(Polyfill),
  },
  Intl: {
    native: () => formatted(Temporal, Intl),
    package: ({ Temporal: Polyfill, Intl: PolyfillIntl }) => formatted(Polyfill, PolyfillIntl),
  },
  toTemporalInstant: {
    native: () => new Date(1e12).toTemporalInstant().toString(),
    package: ({ toTemporalInstant }) => toTemporalInstant.call(new Date(1e12)).toString(),
  },
};

export default {
  apis: ['js:Temporal', 'js:Temporal.Now', 'js:Date.prototype.toTemporalInstant', 'js:Intl.DurationFormat'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'temporal-polyfill@1.0.8': polyfillRows,
    '@js-temporal/polyfill@0.5.1': polyfillRows,
    'date-fns@4.4.0': {
      ...Object.fromEntries(
        Object.entries(dateFns).map(([member, [native, theirs]]) => [
          member,
          { native: () => days.map(native), package: (d) => days.map((s) => theirs(d, s)) },
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(instants).map(([member, [native, theirs]]) => [member, { native, package: theirs }]),
      ),
      setDate: {
        gap: 'date-fns setDate(date, 31) rolls over into the next month (2023-02-31 is 2023-03-03); PlainDate#with({ day: 31 }) clamps to the last day',
        native: () => days.map((s) => P(s).with({ day: 31 }).toString()),
        package: (d) => days.map((s) => d.format(d.setDate(d.parseISO(s), 31), 'yyyy-MM-dd')),
      },
      intervalToDuration: {
        gap: 'intervalToDuration balances years, months and days its own way (2020-02-29 to 2023-02-28 is 2y 12m 0d); PlainDate#until gives 2y 11m 30d',
        native: () =>
          days.map((s) => {
            const span = P('2020-02-29').until(s, { largestUnit: 'years' });
            return [span.years, span.months, span.days];
          }),
        package: (d) =>
          days.map((s) => {
            const span = d.intervalToDuration({ start: d.parseISO('2020-02-29'), end: d.parseISO(s) });
            return [span.years ?? 0, span.months ?? 0, span.days ?? 0];
          }),
      },
      formatDuration: {
        gap: 'formatDuration joins units with spaces ("1 hour 5 minutes"); Intl.DurationFormat uses the locale list format ("1 hour, 5 minutes")',
        native: () => new Intl.DurationFormat('en', { style: 'long' }).format({ hours: 1, minutes: 5 }),
        package: (d) => d.formatDuration({ hours: 1, minutes: 5 }),
      },
    },
  },
};
