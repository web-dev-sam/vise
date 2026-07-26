/**
 * Calendar-view layout for the Calendar component: how a month's days are
 * arranged for display. Purely presentational — the padding and the single-letter
 * headers exist to render a rectangular widget, not to describe dates.
 */
import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

const DAYS_PER_WEEK = 7;
const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "narrow" });

/**
 * A month laid out as whole Sunday–Saturday weeks, padded with the trailing days
 * of the previous month and the leading days of the next so every row is full.
 * The row count varies from 4 to 6 depending on how the month falls.
 */
export function monthGrid(month: Date): Date[][] {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += DAYS_PER_WEEK) {
    weeks.push(days.slice(i, i + DAYS_PER_WEEK));
  }
  return weeks;
}

/** Single-letter column headers, Sunday-first. The reference week is arbitrary. */
export const weekdayInitials: readonly string[] = eachDayOfInterval({
  start: startOfWeek(new Date(2021, 0, 3)),
  end: endOfWeek(new Date(2021, 0, 3)),
}).map((day) => WEEKDAY_FORMAT.format(day));
