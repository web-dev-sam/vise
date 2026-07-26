/**
 * Domain-free date arithmetic on native `Date`: comparisons, elapsed differences,
 * month math, and the two halves — day and time — of a single Date. Pure and
 * framework-free; nothing here reads a clock or knows about any UI.
 */

/** True when both dates fall on the same calendar day (local time). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True when both dates fall in the same calendar month (local time). */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** First midnight of `date`'s month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** `date` shifted by `amount` months, clamping the day to the target month's length. */
export function addMonths(date: Date, amount: number): Date {
  const targetMonth = date.getMonth() + amount;
  const lastDayOfTarget = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
  return new Date(
    date.getFullYear(),
    targetMonth,
    Math.min(date.getDate(), lastDayOfTarget),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

/** Whole minutes between `a` and `b` (`a − b`), truncated toward zero. */
export function differenceInMinutes(a: Date, b: Date): number {
  return Math.trunc((a.getTime() - b.getTime()) / 60_000);
}

/** Whole hours between `a` and `b` (`a − b`), truncated toward zero. */
export function differenceInHours(a: Date, b: Date): number {
  return Math.trunc((a.getTime() - b.getTime()) / 3_600_000);
}

/** Move `base`'s calendar day to `day`, keeping `base`'s time of day. */
export function withDate(base: Date, day: Date): Date {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  );
}

/**
 * Move `base`'s time of day to the `"HH:mm"` string `value`, keeping its date.
 * Returns null when the string is not a valid time (e.g. a cleared field).
 */
export function withTime(base: Date, value: string): Date | null {
  const [rawHours, rawMinutes] = value.split(":");
  // Number("") is 0, so guard the empty halves before coercing.
  if (rawHours === "" || rawMinutes === "") return null;
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return null;
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0);
}
