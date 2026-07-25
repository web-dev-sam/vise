import { describe, expect, it } from "vitest";
import { findConflicts, hasValidDuration, overlaps } from "../src/slices/scheduling/core/rules";
import { canReschedule, validateReschedule } from "../src/slices/scheduling/core/policy";
import type { Appointment } from "../src/slices/scheduling/core/types";

const appt = (over: Partial<Appointment> = {}): Appointment => ({
  id: "a1",
  clientId: "c1",
  resourceId: "room-1",
  status: "scheduled",
  start: new Date("2026-07-25T09:00:00Z"),
  end: new Date("2026-07-25T10:00:00Z"),
  ...over,
});

describe("scheduling conflict detection", () => {
  it("overlaps only when intervals intersect", () => {
    const a = appt();
    const b = appt({
      id: "a2",
      start: new Date("2026-07-25T09:30:00Z"),
      end: new Date("2026-07-25T10:30:00Z"),
    });
    const c = appt({
      id: "a3",
      start: new Date("2026-07-25T10:00:00Z"),
      end: new Date("2026-07-25T11:00:00Z"),
    });
    expect(overlaps(a, b)).toBe(true);
    expect(overlaps(a, c)).toBe(false); // touching edges do not overlap
  });

  it("flags same-resource overlaps and ignores other resources", () => {
    const a = appt();
    const sameRoom = appt({
      id: "a2",
      start: new Date("2026-07-25T09:30:00Z"),
      end: new Date("2026-07-25T10:30:00Z"),
    });
    const otherRoom = appt({
      id: "a3",
      resourceId: "room-2",
      start: new Date("2026-07-25T09:30:00Z"),
      end: new Date("2026-07-25T10:30:00Z"),
    });
    const conflicts = findConflicts([a, sameRoom, otherRoom]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ firstId: "a1", secondId: "a2", resourceId: "room-1" });
  });

  it("never conflicts with a cancelled appointment", () => {
    const a = appt();
    const cancelled = appt({
      id: "a2",
      status: "cancelled",
      start: new Date("2026-07-25T09:30:00Z"),
      end: new Date("2026-07-25T10:30:00Z"),
    });
    expect(findConflicts([a, cancelled])).toHaveLength(0);
  });
});

describe("scheduling duration rule", () => {
  it("accepts positive multiples of 15 minutes", () => {
    expect(hasValidDuration(appt())).toBe(true); // 60 min
    expect(hasValidDuration(appt({ end: new Date("2026-07-25T09:15:00Z") }))).toBe(true);
  });

  it("rejects zero, negative, and non-15 durations", () => {
    expect(hasValidDuration(appt({ end: new Date("2026-07-25T09:00:00Z") }))).toBe(false);
    expect(hasValidDuration(appt({ end: new Date("2026-07-25T09:10:00Z") }))).toBe(false);
    expect(hasValidDuration(appt({ end: new Date("2026-07-25T08:00:00Z") }))).toBe(false);
  });
});

describe("scheduling reschedule policy (now passed in)", () => {
  it("blocks reschedule within 24h of start", () => {
    const start = new Date("2026-07-25T09:00:00Z");
    expect(canReschedule(appt({ start }), new Date("2026-07-24T20:00:00Z"))).toBe(false);
    expect(canReschedule(appt({ start }), new Date("2026-07-23T08:00:00Z"))).toBe(true);
  });

  it("only reschedules scheduled appointments", () => {
    const now = new Date("2026-07-20T09:00:00Z");
    expect(canReschedule(appt({ status: "completed" }), now)).toBe(false);
    expect(canReschedule(appt({ status: "cancelled" }), now)).toBe(false);
  });

  it("validateReschedule surfaces the specific violation", () => {
    const now = new Date("2026-07-20T09:00:00Z");
    // now is 7h before the appointment start (2026-07-25T09:00Z) → inside 24h.
    const soon = validateReschedule(
      appt(),
      { start: new Date("2026-07-24T20:00:00Z"), end: new Date("2026-07-24T21:00:00Z") },
      new Date("2026-07-25T02:00:00Z"),
    );
    expect(soon).toEqual({ ok: false, error: expect.stringContaining("24 hours") });

    const badDuration = validateReschedule(
      appt(),
      { start: new Date("2026-08-01T09:00:00Z"), end: new Date("2026-08-01T09:10:00Z") },
      now,
    );
    expect(badDuration).toEqual({ ok: false, error: expect.stringContaining("15 minutes") });

    const good = validateReschedule(
      appt(),
      { start: new Date("2026-08-01T09:00:00Z"), end: new Date("2026-08-01T10:00:00Z") },
      now,
    );
    expect(good.ok).toBe(true);
  });
});
