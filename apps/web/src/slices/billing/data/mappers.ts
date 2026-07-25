import Decimal from "decimal.js";
import type { Invoice, InvoiceLine, InvoiceStatus } from "../core/types";
import type { InvoiceDto, InvoiceLineDto } from "./dto";

const STATUS_BY_CODE: Record<number, InvoiceStatus> = {
  0: "draft",
  1: "issued",
  2: "paid",
  3: "void",
};
const CODE_BY_STATUS: Record<InvoiceStatus, number> = { draft: 0, issued: 1, paid: 2, void: 3 };

// Money crosses the boundary as a decimal string; parse it with Decimal so we
// never introduce float error on the way to integer minor units.
const dollarsToMinor = (value: string): number => new Decimal(value).mul(100).toNumber();
const minorToDollars = (minor: number): string => new Decimal(minor).div(100).toFixed(2);
const percentToBps = (value: string): number => new Decimal(value).mul(100).toNumber();
const bpsToPercent = (bps: number): string => new Decimal(bps).div(100).toFixed(2);

export function toInvoiceLine(dto: InvoiceLineDto): InvoiceLine {
  return {
    id: dto.id,
    description: dto.description,
    quantity: dto.quantity,
    unitPriceMinor: dollarsToMinor(dto.unit_price),
    taxRateBps: percentToBps(dto.tax_rate),
  };
}

export function toInvoiceLineDto(line: InvoiceLine): InvoiceLineDto {
  return {
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unit_price: minorToDollars(line.unitPriceMinor),
    tax_rate: bpsToPercent(line.taxRateBps),
  };
}

export function toInvoice(dto: InvoiceDto): Invoice {
  const status = STATUS_BY_CODE[dto.status];
  if (status === undefined) {
    throw new Error(`Unknown invoice status code: ${dto.status}`);
  }
  return {
    id: dto.id,
    number: dto.number,
    clientId: dto.client_id,
    status,
    issueDate: new Date(dto.issue_date),
    dueDate: new Date(dto.due_date),
    appointmentId: dto.appointment_id,
    currency: dto.currency,
    lines: dto.lines.map(toInvoiceLine),
  };
}

export function toInvoiceDto(invoice: Invoice): InvoiceDto {
  return {
    id: invoice.id,
    number: invoice.number,
    client_id: invoice.clientId,
    status: CODE_BY_STATUS[invoice.status],
    issue_date: invoice.issueDate.toISOString(),
    due_date: invoice.dueDate.toISOString(),
    appointment_id: invoice.appointmentId,
    currency: invoice.currency,
    lines: invoice.lines.map(toInvoiceLineDto),
  };
}
