import { describe, expect, it } from "vitest";
// Core is private: tests reach it by relative path, never the @slices alias
// (the alias resolves only to the public index.ts, by design).
import {
  invoiceSubtotalMinor,
  invoiceTaxMinor,
  invoiceTotalMinor,
  isOverdue,
  lineTaxMinor,
  lineTotalMinor,
  summarize,
} from "../src/slices/billing/core/rules";
import { canEditLines, canIssue, canVoid } from "../src/slices/billing/core/policy";
import type { Invoice, InvoiceLine } from "../src/slices/billing/core/types";

const line = (over: Partial<InvoiceLine> = {}): InvoiceLine => ({
  id: "l1",
  description: "Consultation",
  quantity: 3,
  unitPriceMinor: 12_500,
  taxRateBps: 875,
  ...over,
});

const invoice = (over: Partial<Invoice> = {}): Invoice => ({
  id: "inv1",
  number: "INV-001",
  clientId: "c1",
  status: "issued",
  issueDate: new Date("2026-01-01T00:00:00Z"),
  dueDate: new Date("2026-01-31T00:00:00Z"),
  lines: [line()],
  appointmentId: "appt1",
  currency: "USD",
  ...over,
});

describe("billing money rules", () => {
  it("computes per-line tax with half-up rounding, never floats", () => {
    // 3 × 12500 = 37500; 8.75% = 3281.25 → 3281
    expect(lineTaxMinor(line())).toBe(3281);
    expect(lineTotalMinor(line())).toBe(40_781);
  });

  it("sums line subtotals, tax and totals across the invoice", () => {
    const inv = invoice({
      lines: [line(), line({ id: "l2", quantity: 1, unitPriceMinor: 5_000, taxRateBps: 0 })],
    });
    expect(invoiceSubtotalMinor(inv)).toBe(37_500 + 5_000);
    expect(invoiceTaxMinor(inv)).toBe(3281 + 0);
    expect(invoiceTotalMinor(inv)).toBe(40_781 + 5_000);
  });
});

describe("billing overdue rule", () => {
  const today = new Date("2026-02-15T00:00:00Z");

  it("is overdue when issued and past due (today passed in)", () => {
    expect(isOverdue(invoice({ status: "issued" }), today)).toBe(true);
  });

  it("is not overdue before the due date", () => {
    expect(isOverdue(invoice({ status: "issued" }), new Date("2026-01-15T00:00:00Z"))).toBe(false);
  });

  it("is never overdue unless issued", () => {
    expect(isOverdue(invoice({ status: "draft" }), today)).toBe(false);
    expect(isOverdue(invoice({ status: "paid" }), today)).toBe(false);
    expect(isOverdue(invoice({ status: "void" }), today)).toBe(false);
  });
});

describe("billing policy", () => {
  it("voids anything that is not paid", () => {
    expect(canVoid(invoice({ status: "issued" }))).toBe(true);
    expect(canVoid(invoice({ status: "draft" }))).toBe(true);
    expect(canVoid(invoice({ status: "void" }))).toBe(true);
    expect(canVoid(invoice({ status: "paid" }))).toBe(false);
  });

  it("edits lines only on a draft", () => {
    expect(canEditLines(invoice({ status: "draft" }))).toBe(true);
    expect(canEditLines(invoice({ status: "issued" }))).toBe(false);
  });

  it("issues only a non-empty draft", () => {
    expect(canIssue(invoice({ status: "draft" }))).toBe(true);
    expect(canIssue(invoice({ status: "draft", lines: [] }))).toBe(false);
    expect(canIssue(invoice({ status: "issued" }))).toBe(false);
  });
});

describe("billing summary projection", () => {
  it("carries the computed total and overdue flag", () => {
    const summary = summarize(invoice({ status: "issued" }), new Date("2026-03-01T00:00:00Z"));
    expect(summary.totalMinor).toBe(40_781);
    expect(summary.overdue).toBe(true);
    expect(summary.appointmentId).toBe("appt1");
  });
});
