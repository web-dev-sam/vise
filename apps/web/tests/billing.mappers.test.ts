import { describe, expect, it } from "vitest";
import { toInvoice, toInvoiceDto } from "../src/slices/billing/data/mappers";
import { invoiceDtoSchema } from "../src/slices/billing/data/dto";
import type { InvoiceDto } from "../src/slices/billing/data/dto";

const dto: InvoiceDto = {
  id: "inv-1",
  number: "INV-1",
  client_id: "c-1",
  status: 1,
  issue_date: "2026-06-01T09:00:00.000Z",
  due_date: "2026-06-15T09:00:00.000Z",
  appointment_id: "appt-1",
  currency: "USD",
  lines: [{ id: "l1", description: "Work", quantity: 2, unit_price: "125.00", tax_rate: "8.75" }],
};

describe("billing dto <-> core mapping", () => {
  it("maps server shapes to core: money to minor units, status code to union", () => {
    const invoice = toInvoice(dto);
    expect(invoice.status).toBe("issued");
    expect(invoice.clientId).toBe("c-1");
    expect(invoice.issueDate).toBeInstanceOf(Date);
    expect(invoice.lines[0]?.unitPriceMinor).toBe(12_500);
    expect(invoice.lines[0]?.taxRateBps).toBe(875);
  });

  it("round-trips core back to an equivalent, schema-valid DTO", () => {
    const roundTripped = toInvoiceDto(toInvoice(dto));
    expect(() => invoiceDtoSchema.parse(roundTripped)).not.toThrow();
    expect(roundTripped).toEqual(dto);
  });

  it("rejects an unknown status code rather than silently mismapping", () => {
    expect(() => toInvoice({ ...dto, status: 9 as InvoiceDto["status"] })).toThrow(/status code/);
  });
});
