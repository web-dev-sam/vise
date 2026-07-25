import { z } from "zod";

/**
 * SERVER SHAPES. These deliberately differ from core entities so the mapper
 * earns its keep: snake_case keys, amounts as decimal STRINGS, dates as ISO
 * strings, status as an integer enum. Nothing in this file may escape data/.
 */

export const invoiceLineDtoSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unit_price: z.string(), // e.g. "125.00"
  tax_rate: z.string(), // percent, e.g. "8.75"
});

export const invoiceDtoSchema = z.object({
  id: z.string(),
  number: z.string(),
  client_id: z.string(),
  status: z.number().int().min(0).max(3), // 0 draft, 1 issued, 2 paid, 3 void
  issue_date: z.string(),
  due_date: z.string(),
  appointment_id: z.string(),
  currency: z.string(),
  lines: z.array(invoiceLineDtoSchema),
});

export type InvoiceLineDto = z.infer<typeof invoiceLineDtoSchema>;
export type InvoiceDto = z.infer<typeof invoiceDtoSchema>;
