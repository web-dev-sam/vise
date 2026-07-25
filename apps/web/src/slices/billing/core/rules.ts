import Decimal from "decimal.js";
import { isBefore } from "date-fns";
import type { Invoice, InvoiceLine, InvoiceSummary } from "./types";

/** Line subtotal = quantity × unit price, in minor units. */
export function lineSubtotalMinor(line: InvoiceLine): number {
  return line.quantity * line.unitPriceMinor;
}

/** Per-line tax, half-up rounded to whole minor units. Decimal, never float. */
export function lineTaxMinor(line: InvoiceLine): number {
  return new Decimal(lineSubtotalMinor(line))
    .mul(line.taxRateBps)
    .div(10_000)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function lineTotalMinor(line: InvoiceLine): number {
  return lineSubtotalMinor(line) + lineTaxMinor(line);
}

export function invoiceSubtotalMinor(invoice: Invoice): number {
  return invoice.lines.reduce((sum, line) => sum + lineSubtotalMinor(line), 0);
}

export function invoiceTaxMinor(invoice: Invoice): number {
  return invoice.lines.reduce((sum, line) => sum + lineTaxMinor(line), 0);
}

export function invoiceTotalMinor(invoice: Invoice): number {
  return invoice.lines.reduce((sum, line) => sum + lineTotalMinor(line), 0);
}

/**
 * An invoice is overdue if it is `issued` and its due date is in the past.
 * `today` is passed IN so this stays pure and testable — never read a clock here.
 */
export function isOverdue(invoice: Invoice, today: Date): boolean {
  return invoice.status === "issued" && isBefore(invoice.dueDate, today);
}

/** Project an Invoice down to its list/overview read model. */
export function summarize(invoice: Invoice, today: Date): InvoiceSummary {
  return {
    id: invoice.id,
    number: invoice.number,
    clientId: invoice.clientId,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    totalMinor: invoiceTotalMinor(invoice),
    currency: invoice.currency,
    appointmentId: invoice.appointmentId,
    overdue: isOverdue(invoice, today),
  };
}
