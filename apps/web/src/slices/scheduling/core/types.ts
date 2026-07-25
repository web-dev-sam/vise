/**
 * Scheduling domain entities. Framework-free: no vue, no fetch, no router.
 * "now"/"today" are always passed into rules — a clock is never read here.
 */

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  readonly id: string;
  readonly clientId: string;
  /** Room or staff member the appointment occupies. */
  readonly resourceId: string;
  readonly status: AppointmentStatus;
  readonly start: Date;
  readonly end: Date;
}

/** A pair of appointments that share a resource and overlap in time. */
export interface AppointmentConflict {
  readonly firstId: string;
  readonly secondId: string;
  readonly resourceId: string;
}

/**
 * Read model exported from the slice's public surface. Billing consumes this to
 * show the appointment each invoice was generated from; the app overview uses it
 * for a client's upcoming appointments. `durationMinutes` is precomputed so
 * consumers never need scheduling's core rules.
 */
export interface AppointmentSummary {
  readonly id: string;
  readonly clientId: string;
  readonly resourceId: string;
  readonly status: AppointmentStatus;
  readonly start: Date;
  readonly end: Date;
  readonly durationMinutes: number;
}
