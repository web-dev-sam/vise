# Vise — a machine-enforced frontend architecture starter

A Vite+ monorepo whose one app (`apps/web`) demonstrates and **machine-enforces** a
specific frontend architecture. The point is not the features. The point is that
the structure is **derivable** (two developers independently produce the same
layout) and **enforced by CI** (deviation fails the build).

Stack: Vue 3 `<script setup>` + TypeScript strict, [Vite+](https://viteplus.dev)
(`vp` — Vite, Vitest, Oxlint, Oxfmt, Rolldown, tsdown), Vue Router, Pinia (one
store, on purpose), [shadcn-vue](https://www.shadcn-vue.com) primitives on Reka UI

- Tailwind v4, MSW mock API, dependency-cruiser + Oxlint for boundaries.

![dependency graph](docs/architecture-graph.svg)

## The two axes

Every file has a coordinate on two axes. Because both are derivable from the
code's purpose, its location is derivable — there is never a discussion about
where something goes.

**Axis 1 — domain slice (vertical).** The business capability the code belongs
to. Slices are near-total silos: `billing`, `scheduling`.

**Axis 2 — stability layer (horizontal).** How often the code changes and why.

| Layer         | Contains                                                     | Changes when               | Scope                      |
| ------------- | ------------------------------------------------------------ | -------------------------- | -------------------------- |
| Primitives    | Zero domain knowledge: `Button`, `useDebounce`, `formatDate` | design system evolves      | **Global** (`src/shared/`) |
| Domain core   | Pure logic, entities, rules, invariants. No framework.       | business rules change      | **Per slice** (`core/`)    |
| Data / IO     | Queries, mutations, DTOs, DTO↔core mapping                   | the API changes            | **Per slice** (`data/`)    |
| Feature UI    | Components and views assembling core + data                  | the UX changes             | **Per slice** (`ui/`)      |
| App / routing | Route table, providers, composition root                     | features are added/removed | **Global** (`src/app/`)    |

Two layers are **global singletons** (primitives, app/routing); three are
**replicated once per slice** (core, data, ui). The shape is two horizontal
bands sandwiching vertical domain silos — see the graph above.

**The one rule everything rests on: dependencies only ever point toward
stability.** Feature UI may import domain core. Domain core may never import
data/IO or feature UI. Nothing points sideways between slices except through a
slice's public `index.ts`.

## The constitution (non-negotiable)

1. Everything lives in a slice, or in `shared/`.
2. Dependencies point toward stability, never away, never sideways between
   slices. This is machine-enforced, not a matter of discipline.
3. Slices do not import each other's internals. A slice exposes a tiny public
   API via its `index.ts`; everything else is private.
4. Domain core is framework-free. No `vue`, no `fetch`, no router. If you deleted
   Vue, every `core/` folder must still compile and its tests must still pass.
5. A component belongs to the slice it is _about_, not the slice that first used it.
6. **Concern = reason to change.** Two pieces of code share a concern iff they
   change for the same reason. A "reusable" component that changes for two
   different reasons in two contexts is two components wearing one costume — split it.
7. Promotion to `shared/` is deliberate, not reflexive. Duplication is cheaper
   than the wrong abstraction. A thing must be used in 3+ places _for the same
   reason_ before it moves to `shared/`. Two usages: leave it duplicated.

**Grep-able test for rule 7:** if a filename, component name, or prop name in
`shared/` contains a domain noun (invoice, appointment, client, …), it is in the
wrong place. (This is why the HTTP transport is `httpTransport`, not `httpClient`.)

## Helper questions

Ask these; each maps to a location.

- _What business reason would make this change?_ → picks the slice. Several
  unrelated reasons means split it first.
- _Would this still make sense if I deleted Vue tomorrow?_ → yes: `core/`. No: a
  UI or IO layer.
- _Does this know how to talk to the server?_ → yes: `data/`, and it must map
  to/from `core/` — DTOs never leak upward.
- _Is this component about this domain, or does it merely display domain data?_ →
  about: the slice. Generic (table, modal, field): `shared/`.
- _Am I reusing this because it is genuinely the same concept, or because it
  happens to look the same right now?_ → looks-the-same: duplicate and move on.
- _Should I make a new component?_ → new reason to change: yes. Otherwise add a
  prop or variant.

## Folder layout

```
architecture.config.ts        # SINGLE SOURCE OF TRUTH for the boundary rules
vite.config.ts                # root: staged hooks + generated Oxlint overrides
scripts/                      # config generation + enforcement verification
apps/web/
  src/
    app/                      # GLOBAL: composition root (imported by nobody)
      router/index.ts         #   concatenates slice route definitions ONLY
      providers/              #   msw bootstrap, error boundary
      layouts/DefaultLayout.vue
      views/ClientOverviewView.vue   # the ONLY cross-slice composition view
      main.ts
    slices/
      billing/  scheduling/
        core/                 # PER SLICE: pure entities, rules, policy (no framework)
        data/                 # PER SLICE: dto, mappers, queries, mutations, (one) store, mocks
        ui/                   # PER SLICE: views/, components/, composables/
        routes.ts             # this slice's route definitions
        index.ts              # THE ONLY public surface
    shared/
      ui/                     # GLOBAL: shadcn-vue primitives, zero domain nouns
      lib/                    # GLOBAL: cn, formatDate, Result, useDebounce
      http/                   # GLOBAL: transport only, no endpoints
```

Exactly `core/`, `data/`, `ui/`, `routes.ts`, `index.ts` per slice. Nothing else —
no `utils/`, `helpers/`, `types/` at slice root.

## Commands

```bash
vp install                 # install deps (via pnpm)
vp dev apps/web            # dev server (MSW-mocked API)
vp lint                    # Oxlint — boundary rules + fast inner loop
vp run --filter @vise/web typecheck            # vue-tsc --noEmit
vp run -r test             # Vitest (unit + structure + config-consistency)
vp run --filter @vise/web arch:depcruise       # dependency-cruiser, allow-list + baseline
vp run --filter @vise/web verify:enforcement   # prove every rule bites
node scripts/render-graph.ts                    # regenerate docs/architecture-graph.svg
```

## Three worked examples

These settle team disagreements by precedent. Walk the helper questions.

### 1. "Add a discount code to invoices"

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

### 2. "Show a client's next appointment on the invoice detail page"

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

### 3. "Add a generic date-range picker"

- _About a domain?_ No — a date range is generic UI. _Looks-the-same or same
  concept?_ Genuinely the same concept everywhere.
- _Delete Vue?_ No, it's a component → a UI primitive.
- → `shared/ui/date-range-picker/` (a shadcn-style primitive). Zero domain nouns
  in its name or props. If only one slice used it today, you would **duplicate it
  in that slice's `ui/` first** and only promote to `shared/` at the third
  same-reason usage (rule 7).

Touched: `shared/ui/date-range-picker/`. No slice, no `app/`.

## Migration strategy (the baseline ratchet)

This repo is the template for migrating a large existing codebase where a
big-bang switch to `error` is impossible.

- dependency-cruiser runs in **allow-list mode** (`allowedSeverity: "error"`):
  every intra-`src` edge that matches no `allowed` rule fails. An allow-list has
  no holes by construction — unlike a forbidden-list, which always does.
- Pre-existing violations are frozen in
  `apps/web/.dependency-cruiser-known-violations.json` and the check runs with
  `--ignore-known`. New code is strict from day one; legacy is frozen.
- CI asserts the baseline **only shrinks** (`scripts/check-baseline-size.ts`,
  `MAX_KNOWN_VIOLATIONS`). A refactor is literally "delete N lines from the
  baseline." Lowering the number is a normal PR; raising it means editing a
  CODEOWNERS-protected file and getting architecture review.

## Enforced rules

Every rule, the tool that enforces it, and the command that checks it. All at
`severity: error`; there is no `warn` tier.

| Rule                                                                | Enforced by                                        | Command                                    |
| ------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------ |
| Slices reach each other only via `index.ts`                         | dependency-cruiser `slice-isolation` + allow-list  | `vp run --filter @vise/web arch:depcruise` |
| `core/` never imports `data/`/`ui/`                                 | dependency-cruiser `layers-point-down`             | `arch:depcruise`                           |
| `data/` never imports `ui/`                                         | dependency-cruiser `data-not-to-ui`                | `arch:depcruise`                           |
| `core/` is framework-free (npm allow-list)                          | dependency-cruiser `core-is-framework-free`        | `arch:depcruise`                           |
| `core/` imports no `vue`/`pinia`/relative-down                      | Oxlint `no-restricted-imports`                     | `vp lint`                                  |
| DTOs never escape `data/`                                           | dependency-cruiser `dtos-stay-home`                | `arch:depcruise`                           |
| `shared/` imports no slice/app                                      | dependency-cruiser `shared-knows-nothing` + Oxlint | `arch:depcruise` / `vp lint`               |
| `app/` is imported by nobody                                        | dependency-cruiser `app-is-a-leaf`                 | `arch:depcruise`                           |
| No cycles / no orphans                                              | dependency-cruiser `no-circular` / `no-orphans`    | `arch:depcruise`                           |
| Only legal edges exist (closed set)                                 | dependency-cruiser allow-list                      | `arch:depcruise`                           |
| Deep alias imports don't resolve                                    | tsconfig `paths` + `vue-tsc`                       | `vp run --filter @vise/web typecheck`      |
| Slice folders have exactly the 5 entries                            | Vitest structure test                              | `vp run -r test`                           |
| No `.vue` outside `slices/*/ui`, `app/{layouts,views}`, `shared/ui` | Vitest structure test                              | `vp run -r test`                           |
| No `utils`/`helpers`/`misc`/`common`/`stores` dirs                  | Vitest structure test                              | `vp run -r test`                           |
| No domain noun under `shared/`                                      | Vitest structure test                              | `vp run -r test`                           |
| Every slice `index.ts` re-exports `routes.ts`                       | Vitest structure test                              | `vp run -r test`                           |
| Oxlint & depcruise configs match the source of truth                | Vitest consistency test                            | `vp run -r test`                           |
| Baseline only shrinks                                               | `scripts/check-baseline-size.ts`                   | `arch:baseline:check`                      |
| depcruise actually parsed the graph (no false pass)                 | `scripts/check-module-count.ts`                    | `arch:module-count`                        |
| No inline boundary-rule disable comments                            | `scripts/check-no-disable-comments.ts`             | `arch:no-disable`                          |
| Every rule above actually bites                                     | `scripts/verify-enforcement.ts`                    | `verify:enforcement`                       |

`architecture.config.ts` is the single source of truth: the Oxlint overrides
(consumed by `vp lint`) and the dependency-cruiser rules (emitted to
`apps/web/.dependency-cruiser.generated.json` + `.oxlintrc.json`) are both derived
from it, and a Vitest test fails if they ever drift.

## Anti-loosening

- `CODEOWNERS` covers `architecture.config.ts`, the generated configs,
  `tsconfig.json`, the structure/consistency tests, and the CI workflow. Boundary
  changes require architecture review; feature work never touches these files.
- No `warn` severity anywhere. A warning is debt with no deadline.
- CI greps for disable/ignore comments that name a boundary rule — the escape
  hatch must be a reviewed config change, visible, never silent.
