import { z } from "zod";
import { httpTransport } from "@shared/http/transport";
import { summarize } from "../core/rules";
import type { Invoice, InvoiceSummary } from "../core/types";
import { invoiceDtoSchema } from "./dto";
import { toInvoice } from "./mappers";

// Real fetch → real zod validation → real mapper. The data layer is not
// decorative: DTOs are validated and mapped to core entities before returning.
export async function fetchInvoices(): Promise<Invoice[]> {
  const raw = await httpTransport.get<unknown>("/api/invoices");
  return z.array(invoiceDtoSchema).parse(raw).map(toInvoice);
}

export async function fetchInvoiceById(id: string): Promise<Invoice> {
  const raw = await httpTransport.get<unknown>(`/api/invoices/${id}`);
  return toInvoice(invoiceDtoSchema.parse(raw));
}

/**
 * Public read model for the app's client overview. `today` is supplied by the
 * caller (composition root) so overdue detection stays deterministic.
 */
export async function fetchUnpaidInvoiceSummaries(
  clientId: string,
  today: Date,
): Promise<InvoiceSummary[]> {
  const invoices = await fetchInvoices();
  return invoices
    .filter(
      (invoice) =>
        invoice.clientId === clientId && invoice.status !== "paid" && invoice.status !== "void",
    )
    .map((invoice) => summarize(invoice, today));
}
