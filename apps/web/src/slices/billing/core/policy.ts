import type { Invoice } from "./types";

/** An invoice may be voided only if it is not already paid. */
export function canVoid(invoice: Invoice): boolean {
  return invoice.status !== "paid";
}

/** A draft may be edited freely; an issued invoice's lines are frozen. */
export function canEditLines(invoice: Invoice): boolean {
  return invoice.status === "draft";
}

/** Only a draft can be issued. */
export function canIssue(invoice: Invoice): boolean {
  return invoice.status === "draft" && invoice.lines.length > 0;
}
