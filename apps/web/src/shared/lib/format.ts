/**
 * Domain-free presentation helpers. No nouns from any slice appear here — these
 * format primitive values (dates, money as minor units) and nothing more.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const DATE_FULL_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "full" });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export function formatDate(value: Date): string {
  return DATE_FORMAT.format(value);
}

/** Long, weekday-qualified date (e.g. "Tuesday, July 28, 2026"). Good for labels. */
export function formatDateFull(value: Date): string {
  return DATE_FULL_FORMAT.format(value);
}

export function formatDateTime(value: Date): string {
  return DATE_TIME_FORMAT.format(value);
}

/** Month and year, spelled out (e.g. "July 2026"). */
export function formatMonthYear(value: Date): string {
  return MONTH_YEAR_FORMAT.format(value);
}

/** Format an integer amount of minor units (e.g. cents) as a currency string. */
export function formatMoney(minorUnits: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minorUnits / 100);
}
