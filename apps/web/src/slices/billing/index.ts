/**
 * THE ONLY public surface of the billing slice. Everything else under
 * billing/ is private — deep imports like @slices/billing/core/rules do not
 * resolve, by design. Keep this surface tiny and deliberate.
 */
export { billingRoutes } from "./routes";

export type { Invoice, InvoiceLine, InvoiceStatus, InvoiceSummary } from "./core/types";

// Read model + query for the app-level client overview.
export { fetchUnpaidInvoiceSummaries } from "./data/queries";

// Mock API for this slice, composed by the app's MSW bootstrap.
export { billingMockHandlers } from "./data/mocks";
