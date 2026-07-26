import { describe, expect, it } from "vitest";
import { monthGrid, weekdayInitials } from "../src/shared/ui/calendar/grid";

const at = (y: number, m: number, d: number): Date => new Date(y, m, d);

describe("monthGrid", () => {
  it("lays out July 2026 as five full Sun–Sat weeks", () => {
    const weeks = monthGrid(at(2026, 6, 1));
    expect(weeks).toHaveLength(5);
    for (const week of weeks) expect(week).toHaveLength(7);
    // Padded with the tail of June and the head of August.
    expect(weeks[0][0]).toEqual(at(2026, 5, 28));
    expect(weeks[4][6]).toEqual(at(2026, 7, 1));
  });

  it("includes every day of the target month exactly once, in order", () => {
    const inMonth = monthGrid(at(2026, 6, 1))
      .flat()
      .filter((d) => d.getMonth() === 6)
      .map((d) => d.getDate());
    expect(inMonth).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it("always begins on Sunday and ends on Saturday", () => {
    for (let month = 0; month < 12; month += 1) {
      const weeks = monthGrid(at(2026, month, 1));
      expect(weeks[0][0].getDay()).toBe(0);
      expect(weeks[weeks.length - 1][6].getDay()).toBe(6);
    }
  });
});

describe("weekdayInitials", () => {
  it("is seven Sunday-first single-letter headers", () => {
    expect(weekdayInitials).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
  });
});
