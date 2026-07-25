import { differenceInMinutes } from "date-fns";
import type { Appointment, AppointmentConflict, AppointmentSummary } from "./types";

export function durationMinutes(appointment: Appointment): number {
  return differenceInMinutes(appointment.end, appointment.start);
}

/** Duration must be a positive multiple of 15 minutes. */
export function hasValidDuration(appointment: Appointment): boolean {
  const minutes = durationMinutes(appointment);
  return minutes > 0 && minutes % 15 === 0;
}

/** Two intervals overlap when each starts before the other ends. */
export function overlaps(a: Appointment, b: Appointment): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

/**
 * Every pair that shares a resource and overlaps in time. Cancelled
 * appointments never conflict. O(n²) is fine for a day's worth of appointments.
 */
export function findConflicts(appointments: readonly Appointment[]): AppointmentConflict[] {
  const active = appointments.filter((appointment) => appointment.status !== "cancelled");
  const conflicts: AppointmentConflict[] = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      if (a.resourceId === b.resourceId && overlaps(a, b)) {
        conflicts.push({ firstId: a.id, secondId: b.id, resourceId: a.resourceId });
      }
    }
  }
  return conflicts;
}

/** Project an Appointment to its cross-boundary read model. */
export function summarizeAppointment(appointment: Appointment): AppointmentSummary {
  return {
    id: appointment.id,
    clientId: appointment.clientId,
    resourceId: appointment.resourceId,
    status: appointment.status,
    start: appointment.start,
    end: appointment.end,
    durationMinutes: durationMinutes(appointment),
  };
}
