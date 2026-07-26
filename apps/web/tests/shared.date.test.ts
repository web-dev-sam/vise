import { describe, expect, it } from "vitest";
import { withDate, withTime } from "../src/shared/lib/date";
import { formatDateFull, formatMonthYear } from "../src/shared/lib/format";

const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0): Date =>
  new Date(y, m, d, h, min, s, ms);

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
