import { differenceInHours, differenceInMinutes } from "date-fns";
import { err, ok } from "@shared/lib/result";
import type { Result } from "@shared/lib/result";
import type { Appointment } from "./types";

/** An appointment may not be rescheduled within 24 hours of its start. */
export function canReschedule(appointment: Appointment, now: Date): boolean {
  if (appointment.status !== "scheduled") return false;
  return differenceInHours(appointment.start, now) >= 24;
}

export interface ProposedSlot {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Validate a proposed reschedule against every rule, returning a Result so the
 * UI can surface the exact violation. Pure: `now` is passed in.
 */
export function validateReschedule(
  appointment: Appointment,
  next: ProposedSlot,
  now: Date,
): Result<ProposedSlot> {
  if (appointment.status !== "scheduled") {
    return err("Only scheduled appointments can be rescheduled.");
  }
  if (differenceInHours(appointment.start, now) < 24) {
    return err("This appointment starts within 24 hours and can no longer be rescheduled.");
  }
  const minutes = differenceInMinutes(next.end, next.start);
  if (minutes <= 0 || minutes % 15 !== 0) {
    return err("Duration must be a positive multiple of 15 minutes.");
  }
  return ok(next);
}
