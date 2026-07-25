/**
 * Domain-free presentation helpers. No nouns from any slice appear here — these
 * format primitive values (dates, money as minor units) and nothing more.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: Date): string {
  return DATE_FORMAT.format(value);
}

export function formatDateTime(value: Date): string {
  return DATE_TIME_FORMAT.format(value);
}

/** Format an integer amount of minor units (e.g. cents) as a currency string. */
export function formatMoney(minorUnits: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minorUnits / 100);
}
