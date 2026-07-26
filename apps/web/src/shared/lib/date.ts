/**
 * Domain-free date-part arithmetic: the two halves — day and time — of a single
 * Date. Pure and framework-agnostic; nothing here knows about any UI.
 */
import { set } from "date-fns";

/** Move `base`'s calendar day to `day`, keeping `base`'s time of day. */
export function withDate(base: Date, day: Date): Date {
  return set(base, { year: day.getFullYear(), month: day.getMonth(), date: day.getDate() });
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
  return set(base, { hours, minutes, seconds: 0, milliseconds: 0 });
}
