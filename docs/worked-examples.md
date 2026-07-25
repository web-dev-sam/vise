[← README](../README.md) · [Architecture](architecture.md) · [Constitution](constitution.md) · [Adding a feature](adding-a-feature.md) · **Worked examples** · [Enforcement](enforcement.md) · [Reading the graph](reading-the-graph.md)

# Worked examples

These settle team disagreements by precedent. Walk the [helper
questions](constitution.md#helper-questions).

## 1. "Add a discount code to invoices"

- _What business reason?_ Billing pricing rules → the **billing** slice.
- _Delete Vue and it still makes sense?_ Yes — a discount changes line/total math.
  → `slices/billing/core/`: add `discountBps` to `InvoiceLine`/`Invoice` in
  `core/types.ts` and fold it into `core/rules.ts` (`invoiceTotalMinor`).
- _Talks to the server?_ The API now returns a discount field → `core/data/dto.ts`
  gains `discount` (string), and `data/mappers.ts` maps it. DTO stays in `data/`.
- _A new component?_ The detail view shows a discount row → extend
  `ui/components/InvoiceLinesTable.vue` (same reason to change, add a column), not
  a new component.

Touched: `billing/core/{types,rules}.ts`, `billing/data/{dto,mappers}.ts`,
`billing/ui/components/InvoiceLinesTable.vue`. No other slice, nothing in `shared/`.

## 2. "Show a client's next appointment on the invoice detail page"

- _What business reason?_ It's an invoice-page feature → **billing** owns the view.
- _But the data is scheduling's._ Billing must not reach into scheduling internals
  (rule 3). Scheduling already exposes `fetchUpcomingAppointments` +
  `AppointmentSummary` from its `index.ts`. Billing's UI composable
  (`billing/ui/composables/useInvoiceDetail.ts`) imports **`@slices/scheduling`**
  — the public alias — exactly like `useInvoiceList.ts` already does. This is the
  canonical cross-slice pattern; a deep import (`@slices/scheduling/core/...`)
  does not resolve, by design.
- _A new component?_ A small "next appointment" panel that is _about_ scheduling
  display but lives on a billing page: render it in the billing view from the
  summary; if it grows, it belongs to `scheduling/ui` and is exposed via the
  public surface — never copied into billing.

Touched: `billing/ui/composables/useInvoiceDetail.ts`,
`billing/ui/views/InvoiceDetailView.vue`. Possibly `scheduling/index.ts` if a new
read-model field is needed. Never `scheduling/core` or `scheduling/data` from billing.

## 3. "Add a generic date-range picker"

- _About a domain?_ No — a date range is generic UI. _Looks-the-same or same
  concept?_ Genuinely the same concept everywhere.
- _Delete Vue?_ No, it's a component → a UI primitive.
- → `shared/ui/date-range-picker/` (a shadcn-style primitive). Zero domain nouns
  in its name or props. If only one slice used it today, you would **duplicate it
  in that slice's `ui/` first** and only promote to `shared/` at the third
  same-reason usage (rule 7).

Touched: `shared/ui/date-range-picker/`. No slice, no `app/`.

## 4. "Keep an audit log of every change to invoices and appointments"

- _What business reason?_ Compliance — it changes for _its own_ reason, not
  billing's or scheduling's, and it observes _both_. A concern orthogonal to the
  slices is its **own slice** (rule 8), never `shared/` (it knows domain shapes) or
  `app/` (imported by nobody). → `slices/audit/core/` (`ChangeRecord`),
  `slices/audit/data/` (`recordChange` + transport), `slices/audit/index.ts`.
- _Where does the recording fire?_ At the IO choke point every change already flows
  through: each observed slice's **`data/`** mutations. `billing/data/mutations.ts`
  and `scheduling/data/mutations.ts` call `recordChange` from `@slices/audit`. Never
  in `ui/` — a non-UI mutation path would silently escape the record.
- _Who did it?_ Actor identity is read at the `app/` composition root and passed
  **down as a primitive** (a string), never imported as another slice's type.

Touched: `slices/audit/**`, `billing/data/mutations.ts`,
`scheduling/data/mutations.ts`, `app/` (register the audit route + mock, provide
the actor id). No `shared/`.

## 5. "Only users with the finance role can void an invoice"

- _What business reason?_ Voiding is a billing rule → **billing**; the role gate is
  authorization, a cross-cutting concern.
- _Does the rule belong in core?_ Yes, but keyed on a **primitive**, never another
  slice's type: `billing/core/policy.ts` → `canVoid(invoice, actorRole: string)`.
  Putting an identity slice's `Role` type into `billing/core` would couple the silo
  sideways (rule 4).
- _Where does the role come from?_ The current actor is app-level: read it at an
  `app/providers` reader and pass the string down. `billing/ui` hides the Void
  button when `actorRole !== "finance"`.
- _A new `identity` slice?_ Not for one role check — add one only when identity
  grows its own rules (rule 5 corollary).

Touched: `billing/core/policy.ts`, `billing/ui/...` (button visibility),
`app/providers` (actor source). No new slice.

## 6. "Add 'billing periods' that group a period's appointments and invoices"

- _What is it about?_ Totalling invoices over a date range → **billing**. It
  _reads_ scheduling but is not _about_ scheduling (rule 5 corollary).
- → `billing/core/` (period totals), `billing/data/` (a query that pulls appointment
  summaries via `@slices/scheduling`), `billing/ui/` (the period view). Scheduling
  adds a range query to its `data/` and exposes it from `scheduling/index.ts`.
- _A new `billing-periods` slice?_ No — a period exists to total invoices;
  scheduling is a read input, not an independent reason to change. A new slice would
  have to duplicate billing's DTO/mapper (DTOs never cross slices).

Touched: `billing/{core,data,ui}`, `scheduling/{data,index.ts}`. No new slice, no
`shared/`.
