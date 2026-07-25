import { http, HttpResponse } from "msw";
import type { InvoiceDto } from "./dto";

// Seed data in SERVER shape (snake_case, string money, ISO dates, int status).
// appointment_id / client_id values line up with the scheduling seed so the
// cross-slice join and the client overview have real data to show.
const invoices: InvoiceDto[] = [
  {
    id: "inv-1001",
    number: "INV-1001",
    client_id: "c-ana",
    status: 1,
    issue_date: "2026-06-01T09:00:00.000Z",
    due_date: "2026-06-15T09:00:00.000Z",
    appointment_id: "appt-1",
    currency: "USD",
    lines: [
      {
        id: "il-1",
        description: "Initial consultation",
        quantity: 1,
        unit_price: "150.00",
        tax_rate: "8.75",
      },
      {
        id: "il-2",
        description: "Follow-up (per hour)",
        quantity: 2,
        unit_price: "90.00",
        tax_rate: "8.75",
      },
    ],
  },
  {
    id: "inv-1002",
    number: "INV-1002",
    client_id: "c-ana",
    status: 0,
    issue_date: "2026-07-10T09:00:00.000Z",
    due_date: "2026-07-24T09:00:00.000Z",
    appointment_id: "appt-2",
    currency: "USD",
    lines: [
      {
        id: "il-3",
        description: "Design review",
        quantity: 3,
        unit_price: "125.00",
        tax_rate: "8.75",
      },
    ],
  },
  {
    id: "inv-1003",
    number: "INV-1003",
    client_id: "c-ben",
    status: 2,
    issue_date: "2026-05-02T09:00:00.000Z",
    due_date: "2026-05-16T09:00:00.000Z",
    appointment_id: "appt-3",
    currency: "USD",
    lines: [
      {
        id: "il-4",
        description: "Onboarding package",
        quantity: 1,
        unit_price: "1200.00",
        tax_rate: "0",
      },
    ],
  },
  {
    id: "inv-1004",
    number: "INV-1004",
    client_id: "c-ana",
    status: 1,
    issue_date: "2026-07-20T09:00:00.000Z",
    due_date: "2026-08-20T09:00:00.000Z",
    appointment_id: "appt-4",
    currency: "USD",
    lines: [
      {
        id: "il-5",
        description: "Quarterly retainer",
        quantity: 1,
        unit_price: "3000.00",
        tax_rate: "8.75",
      },
    ],
  },
];

export const billingMockHandlers = [
  http.get("/api/invoices", () => HttpResponse.json(invoices)),
  http.get("/api/invoices/:id", ({ params }) => {
    const found = invoices.find((invoice) => invoice.id === params.id);
    return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 });
  }),
  http.patch("/api/invoices/:id/void", ({ params }) => {
    const found = invoices.find((invoice) => invoice.id === params.id);
    if (!found) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...found, status: 3 } satisfies InvoiceDto);
  }),
];
