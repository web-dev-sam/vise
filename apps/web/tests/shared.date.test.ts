import { describe, expect, it } from "vitest";
import {
  addMonths,
  differenceInHours,
  differenceInMinutes,
  isSameDay,
  isSameMonth,
  startOfMonth,
  withDate,
  withTime,
} from "../src/shared/lib/date";
import { formatDateFull, formatMonthYear } from "../src/shared/lib/format";

const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0): Date =>
  new Date(y, m, d, h, min, s, ms);

describe("date comparisons", () => {
  it("isSameDay ignores the time of day but not the date", () => {
    expect(isSameDay(at(2026, 6, 28, 9), at(2026, 6, 28, 23))).toBe(true);
    expect(isSameDay(at(2026, 6, 28), at(2026, 6, 29))).toBe(false);
    expect(isSameDay(at(2026, 6, 28), at(2025, 6, 28))).toBe(false);
  });

  it("isSameMonth ignores the day but not the month or year", () => {
    expect(isSameMonth(at(2026, 6, 1), at(2026, 6, 31))).toBe(true);
    expect(isSameMonth(at(2026, 6, 28), at(2026, 7, 1))).toBe(false);
    expect(isSameMonth(at(2026, 6, 28), at(2025, 6, 28))).toBe(false);
  });
});

describe("month math", () => {
  it("startOfMonth returns the first midnight of the month", () => {
    expect(startOfMonth(at(2026, 6, 28, 9, 30))).toEqual(at(2026, 6, 1));
  });

  it("addMonths shifts the month and preserves the time", () => {
    expect(addMonths(at(2026, 6, 15, 9, 30), 1)).toEqual(at(2026, 7, 15, 9, 30));
    expect(addMonths(at(2026, 0, 15), -1)).toEqual(at(2025, 11, 15));
  });

  it("addMonths clamps the day to the target month's length", () => {
    // Jan 31 + 1 month -> Feb 28 (2026 is not a leap year), never March 3.
    expect(addMonths(at(2026, 0, 31), 1)).toEqual(at(2026, 1, 28));
  });
});

describe("elapsed differences (truncated toward zero)", () => {
  it("differenceInMinutes is a − b in whole minutes", () => {
    expect(differenceInMinutes(at(2026, 6, 28, 10, 0), at(2026, 6, 28, 9, 0))).toBe(60);
    expect(differenceInMinutes(at(2026, 6, 28, 9, 0), at(2026, 6, 28, 10, 0))).toBe(-60);
    expect(differenceInMinutes(at(2026, 6, 28, 9, 0, 59), at(2026, 6, 28, 9, 0))).toBe(0);
  });

  it("differenceInHours is a − b in whole hours", () => {
    expect(differenceInHours(at(2026, 6, 28, 9), at(2026, 6, 27, 8))).toBe(25);
    expect(differenceInHours(at(2026, 6, 28, 9, 59), at(2026, 6, 28, 8))).toBe(1);
  });
});

describe("withDate", () => {
  it("moves the calendar day while preserving the time of day", () => {
    expect(withDate(at(2026, 6, 28, 9, 30, 15, 250), at(2026, 2, 5))).toEqual(
      at(2026, 2, 5, 9, 30, 15, 250),
    );
  });

  it("does not overflow when the source day exceeds the base month's length", () => {
    // Base is Jan 31; naively setting the month first would spill into March.
    expect(withDate(at(2026, 0, 31, 8, 0), at(2026, 1, 15))).toEqual(at(2026, 1, 15, 8, 0));
  });
});

describe("withTime", () => {
  it("applies an HH:mm string while preserving the date", () => {
    expect(withTime(at(2026, 6, 28, 9, 0), "13:45")).toEqual(at(2026, 6, 28, 13, 45, 0, 0));
  });

  it("returns null for an unparseable or cleared value", () => {
    expect(withTime(at(2026, 6, 28), "")).toBeNull();
    expect(withTime(at(2026, 6, 28), "nope")).toBeNull();
    expect(withTime(at(2026, 6, 28), "12:")).toBeNull();
  });

  it("returns null for an out-of-range time", () => {
    expect(withTime(at(2026, 6, 28), "24:00")).toBeNull();
    expect(withTime(at(2026, 6, 28), "10:60")).toBeNull();
  });
});

describe("date presentation", () => {
  it("formats a month and year", () => {
    expect(formatMonthYear(at(2026, 6, 1))).toBe("July 2026");
  });

  it("formats a full, weekday-qualified date", () => {
    expect(formatDateFull(at(2026, 6, 28))).toBe("Tuesday, July 28, 2026");
  });
});
