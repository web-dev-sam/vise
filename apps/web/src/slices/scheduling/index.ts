/**
 * THE ONLY public surface of the scheduling slice. Billing and the app reach
 * scheduling exclusively through these exports; core/ and data/ are private.
 */
export { schedulingRoutes } from "./routes";

export type { AppointmentStatus, AppointmentSummary } from "./core/types";

// Read models for cross-slice + app-level use.
export { fetchUpcomingAppointments, fetchAppointmentSummaries } from "./data/queries";

// Mock API for this slice, composed by the app's MSW bootstrap.
export { schedulingMockHandlers } from "./data/mocks";
