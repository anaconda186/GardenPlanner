/**
 * Every engine in this package takes its notion of "now" from here.
 *
 * Almost all garden logic is date-dependent — whether a sowing window is open,
 * whether a task is overdue, how many growing degree days have accumulated. A
 * test that calls `new Date()` therefore passes in July and fails in January,
 * and a bug that only appears in one month of the year is close to impossible to
 * find. A lint rule forbids reading the clock directly inside packages/core.
 */
export interface Clock {
  /** The current instant. */
  now(): Date;

  /**
   * The IANA time zone the garden is in, e.g. `America/New_York`.
   *
   * Not the same as the machine's time zone: the gardener may be travelling, and
   * "is this task due today" must answer for the garden, not for wherever the
   * laptop happens to be.
   */
  timeZone(): string;
}

/** A clock frozen at a fixed instant. For tests and for previewing another date. */
export function fixedClock(instant: Date, timeZone = 'UTC'): Clock {
  const frozen = new Date(instant.getTime());
  return {
    now: () => new Date(frozen.getTime()),
    timeZone: () => timeZone,
  };
}
