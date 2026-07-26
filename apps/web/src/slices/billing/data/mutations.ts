import { httpTransport } from "@shared/http/transport";
import type { Invoice } from "../core/types";
import { invoiceDtoSchema } from "./dto";
import { toInvoice } from "./mappers";

export async function voidInvoice(id: string): Promise<Invoice> {
  const raw = await httpTransport.patch(`/api/invoices/${id}/void`, {});
  return toInvoice(invoiceDtoSchema.parse(raw));
}
