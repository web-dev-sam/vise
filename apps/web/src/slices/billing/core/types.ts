/**
 * Billing domain entities and value objects. Framework-free: no vue, no fetch,
 * no router. If you deleted Vue tomorrow this file and its rules still compile.
 *
 * Money is represented as integer MINOR UNITS (e.g. cents) — never a float.
 */

export type InvoiceStatus = "draft" | "issued" | "paid" | "void";

export interface InvoiceLine {
  readonly id: string;
  readonly description: string;
  /** Whole units of the thing being billed. */
  readonly quantity: number;
  /** Price per unit, in integer minor units. */
  readonly unitPriceMinor: number;
  /** Per-line tax rate in basis points (875 = 8.75%). */
  readonly taxRateBps: number;
}

export interface Invoice {
  readonly id: string;
  readonly number: string;
  readonly clientId: string;
  readonly status: InvoiceStatus;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly lines: readonly InvoiceLine[];
  /**
   * The scheduling appointment this invoice was generated from. This is an
   * opaque id: billing knows scheduling has appointments, but nothing about
   * their shape. The join happens through scheduling's public API.
   */
  readonly appointmentId: string;
  readonly currency: string;
}

/**
 * A read model projected from an Invoice for lists/overviews. Carries the
 * computed total so consumers never need billing's core rules to render a row.
 */
export interface InvoiceSummary {
  readonly id: string;
  readonly number: string;
  readonly clientId: string;
  readonly status: InvoiceStatus;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly totalMinor: number;
  readonly currency: string;
  readonly appointmentId: string;
  readonly overdue: boolean;
}
