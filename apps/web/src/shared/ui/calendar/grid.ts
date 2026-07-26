/**
 * Calendar-view layout for the Calendar component: how a month's days are
 * arranged for display. Purely presentational — the padding and the single-letter
 * headers exist to render a rectangular widget, not to describe dates.
 */

const DAYS_PER_WEEK = 7;
const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "narrow" });

/**
 * A month laid out as whole Sunday–Saturday weeks, padded with the trailing days
 * of the previous month and the leading days of the next so every row is full.
 * The row count varies from 4 to 6 depending on how the month falls.
 */
export function monthGrid(month: Date): Date[][] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leading = new Date(year, monthIndex, 1).getDay(); // Sunday-based offset of the 1st
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weekCount = Math.ceil((leading + daysInMonth) / DAYS_PER_WEEK);
  const weeks: Date[][] = [];
  for (let week = 0; week < weekCount; week += 1) {
    const row: Date[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day += 1) {
      // The Date constructor normalises out-of-range days, rolling cleanly into
      // the neighbouring months and across DST without manual millisecond math.
      row.push(new Date(year, monthIndex, 1 - leading + week * DAYS_PER_WEEK + day));
    }
    weeks.push(row);
  }
  return weeks;
}

/** Single-letter column headers, Sunday-first. 1970-01-04 was a Sunday. */
export const weekdayInitials: readonly string[] = Array.from({ length: DAYS_PER_WEEK }, (_, i) =>
  WEEKDAY_FORMAT.format(new Date(1970, 0, 4 + i)),
);
