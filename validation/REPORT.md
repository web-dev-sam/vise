# Vise architecture validation study — report

Predictions hash (sha256 of `validation/predictions.json`, committed **before** any
placement subagent was dispatched, commit `698ac63`):
`15db331429f97ec56038fa76f60c5fa1a27f5d09100c2cc2c1082b854063266b`

---

## 1. Verdict

**Not ready to pilot as-is; close four fixable holes and add one missing rule first.**
The ruleset is internally consistent and the load-bearing claims are _real_, not
decoration: `core/` genuinely compiles and tests with Vue deleted (drill 1); a full
DTO reshape stayed inside `data/` with zero `core`/`ui` change (drill 2); and the
easy placement cases (requests 1–5) drew **unanimous** coordinate agreement across
5 independent raters each. But the study found blocking gaps: (a) **four structural
violations that a tired dev could write slip through every checker** — a
computed-specifier dynamic import, re-export laundering through a slice index, a
domain store parked in `app/`, and Vue laundered into `core/` via a `shared/lib`
re-export; (b) the architecture has **no rule at all for cross-cutting concerns**
(audit log, authz, feature flags, i18n, a cross-slice reporting capability), and
requests 7/9/10/11 fractured exactly there — 5 raters produced 3–5 different
structures each; (c) semantic drift (business rules re-implemented in the UI, the
clock read inside `core/`) is entirely invisible to structural rules, as expected.
The methodology tripwire is satisfied (genuine disagreement was found on the
cross-cutting requests, so context did not leak), which makes the agreement on 1–5
trustworthy rather than suspicious.

## 2. Method integrity

- **Preflight**: clean checkout installs, builds, dev server serves HTTP 200. All CI
  steps green: lint, typecheck, 28 tests, dependency-cruiser (**86 modules / 229
  deps**, **29 of them `.vue`** — confirmed parsed, not a zero-module false pass;
  floor is 40), baseline 0/0, no-disable, `verify:enforcement` **13/13 rules bit**.
  `core/` has no `vue` import (only the word in comments).
- **Sanitization diff**: _empty by necessity, and that is itself finding #0._ No
  design brief, prompt, ADR, or worked-example doc was ever committed (checked
  `git log --all --diff-filter`), so there was nothing extra to strip. The only
  architecture explainer is `README.md`, which the study says to keep — and it
  contains a **"Three worked examples"** section that answers requests **1, 3, and 5
  near-verbatim** (discount→billing/core+data+ui; date-range picker→shared vs
  duplicate; next-appointment-on-invoice→billing/ui via `@slices/scheduling`). The
  README doubles as an answer key for those three. Agreement on 1/3/5 therefore
  measures README-reading, not blind derivability. `CLAUDE.md` (Vite+ tooling only)
  and `architecture.config.ts` (a config file, kept per instructions) leak no
  per-request answers.
- **Isolation mechanism**: each of the 60 placement raters was a **fresh subagent
  session** (no shared context, no knowledge of this study, of each other, or of the
  other requests), pointed at a **read-only** archive of the committed tree at a
  neutral path `/home/wds/vise` (`chmod -R a-w`; the word "sanitized" was kept out of
  the path to avoid hinting). Sessions are genuinely independent (separate agent
  runs), so this is 5 raters, not 1 rater 5 times.
- **Operational text added to the verbatim template**: exactly one preamble line —
  _"You have read-only access to this team's codebase, checked out at /home/wds/vise.
  Use file-reading tools only; do not create or modify any files."_ — plus a JSON
  schema mirroring the template's requested `{files, uncertain, questions}` shape to
  guarantee parseable output. No architectural framing was added.
- **Scoring**: Level 1 (exact path-set identity) computed mechanically; Level 2
  (coordinate = slice + layer, derived from the path alone) computed both by script
  **and** by an independent **adjudicator subagent** that received the anonymized,
  order-shuffled responses (labeled A–E), no predictions, and no hint about which
  requests were expected to be contentious. The two methods agreed on all 12
  verdicts; the adjudicator additionally normalized `audit`≡`compliance` (R07).
- **Sample size**: 12 requests × 5 = 60 raters (0 errors) + 1 adjudicator + 3 Mode-B
  subagents + 4 refactor-drill subagents. Raw responses persisted under
  `validation/placement/<id>/<run>.json`.
- **Deviations (disclosed)**: (1) **Mode A executed directly by the orchestrator** in
  one isolated git worktree (pristine tree per violation, full catcher suite, reset
  between) rather than via 10 subagents — Mode A violations are deterministic and
  fully specified, so direct execution _is_ the verification the study demands and is
  more reliable than trusting self-reports. (2) Refactor-drill and Mode-B subagents
  ran in git worktrees sharing the main `node_modules` by symlink (2.1 GB × N full
  copies was infeasible; ext4 has no reflink); every drill/finding was then
  **re-measured and re-checked by the orchestrator** in-place, so subagent
  self-reports are advisory only. (3) The first drill dispatch hit a transient 429
  rate-limit before any work began; a retry succeeded.

## 3. Coordinate agreement table

`L1` = distinct exact path-sets across 5 raters. `L2` = distinct coordinate-sets
(slice+layer). "Agree" = all 5 share one coordinate-set. `unc`/`q` = total
`uncertain`/`questions` entries across the 5 raters.

| #   | Request (product voice)                  | L1  | L2    | Coord agree | unc | q   | leaked in README |
| --- | ---------------------------------------- | --- | ----- | ----------- | --- | --- | ---------------- |
| R01 | discount code on invoice                 | 2   | **1** | ✅          | 20  | 30  | **yes**          |
| R02 | invoice API fields renamed + nested      | 1   | **1** | ✅          | 13  | 23  | no               |
| R03 | shared date-range filter on two views    | 1   | **1** | ✅          | 18  | 24  | partial          |
| R04 | coloured status label on appointments    | 1   | **1** | ✅          | 15  | 15  | no               |
| R05 | next appointment on invoice detail       | 1   | **1** | ✅          | 14  | 19  | **yes**          |
| R06 | optimistic reschedule + rollback         | 3   | 2     | ❌          | 17  | 20  | no               |
| R07 | audit log of invoice+appointment changes | 5   | 4*    | ❌          | 22  | 29  | no               |
| R08 | statuses in user's language (i18n)       | 5   | **1** | ✅ (coarse) | 20  | 27  | no               |
| R09 | only finance role can void               | 5   | 3     | ❌          | 21  | 25  | no               |
| R10 | feature-flag the reschedule flow         | 5   | 2     | ❌          | 21  | 25  | no               |
| R11 | "billing periods" cross-slice grouping   | 4   | 2     | ❌          | 27  | 31  | no               |
| R12 | debounced search on two list views       | 1   | **1** | ✅          | 18  | 21  | no               |

`*` R07 = 4 distinct sets after normalizing the new slice's name (`audit`≡`compliance`).

**Gate-1 (100% coord agreement on 1–6): NOT MET — 5/6.** R01–R05 unanimous; R06
fails by a single outlier (below). **Requests 7–12: 4 of 6 disagree** at coordinate
level (R07, R09, R10, R11); R08 agrees on slice+layer but splits _within_ `app/`;
R12 unanimous.

**Two "the raters agree with each other but not with me" results** (my reading is the
outlier, stated plainly per the study):

- **R03**: I predicted the date-range picker would split between `shared/ui` and
  per-slice duplication. All 5 raters **duplicated per slice** (`billing/ui` +
  `scheduling/ui`) and none used `shared/ui` — Rule 7's "duplicate until the 3rd
  usage" won cleanly. They also all added `scheduling/data` (a new range query the
  day-view needs) which I missed. My prediction was the outlier.
- **R11**: I predicted a **new `billing-periods` slice**. All 5 raters **folded it
  into `billing`** (reading `scheduling` via its public index) and none created a new
  slice, despite several debating it. My prediction was the outlier.

## 4. Disagreement dossiers (sorted by cost of getting it wrong)

### D1 — R07 audit log: no home for a cross-cutting concern (highest cost)

- **Competing placements**: all 5 stood up a **new slice** (4 named it `audit`, 1
  `compliance`) with full `core+data+ui+index+routes`, and all touched `app/`
  (router + msw). They split on **where the recording hook lives**: A/C/D put it in
  the existing slices' **`data/`** (mutations/mocks — "record at the server/mutation
  choke point"), B put it in the existing slices' **`ui/`** composables ("the
  composable holds before+after state; composable→`@slices/audit` is the only
  documented cross-slice pattern"), E did **both**. "Who did it" (actor identity) had
  no agreed home.
- **Adjudicating rule**: **none exists.** The constitution's axes are domain-slice ×
  stability-layer; a concern that is _orthogonal to every slice_ (it observes all of
  them) is unaddressed. `app/` can't host a service (it's imported by nobody);
  `shared/` can't (domain-aware, Rule 7). A new slice is structurally legal but the
  hook layer is undetermined.
- **Proposed amendment** (README, new rule 8): _"A cross-cutting concern that must
  observe or gate multiple slices lives in its own slice and is invoked only through
  its public `index.ts`; the invocation is placed in the **`data/` layer** of each
  observed slice (the IO choke point every change already flows through), never in
  `ui/`."_ Worked example: _"Audit log → `slices/audit/` (core: `ChangeRecord`; data:
  `recordChange` + transport). `billing/data/mutations.ts` and
  `scheduling/data/mutations.ts` call `recordChange` from `@slices/audit`. The actor
  id is read at the `app/` composition root and passed down as an argument, never
  read ambiently."_
- **Blesses**: the `data/`-layer hook (A/C/D). **Cost of the `ui/` choice (B) over 2
  years**: audits fire only when the user goes through a specific screen; any
  non-UI mutation path (bulk job, another view) silently escapes the compliance
  record — a legal/regulatory hole, not a style nit.

### D2 — R09 finance-only void: authz has no home + a layering trap (high cost)

- **Competing placements**: A/C/D/E created a **new `identity` slice**
  (`core+data+ui+index`); B **folded roles into `shared/lib` + an `app/` session
  seed**, creating no slice. Orthogonally, B/C/D made voiding **role-aware in
  `billing/core/policy.ts`** (`canVoid` gains a role param); A/E kept the finance
  gate **only in `billing/ui`** ("putting the role in core would drag identity's
  `Role` type sideways into `billing/core`").
- **Adjudicating rule**: partially exists but is unfindable. Rule 4 (core is pure)
  and Rule 3 (silos) _imply_ the answer but no worked example covers "a permission
  that is a domain rule but needs an external identity." The A/E fear is real: a
  naive `canVoid(invoice, role)` couples `billing/core` to another slice's `Role`
  type.
- **Proposed amendment** (README, rule 8 corollary): _"Model a permission as a pure
  `core/` predicate over a **primitive** the caller supplies (`canVoid(invoice,
actorRole: string)`), never over another slice's type. Current-actor identity is an
  app-level concern: it is read at the composition root / a provider and threaded
  down as a primitive."_ Worked example: _"`billing/core/policy.ts`:
  `canVoid(invoice, actorRole: 'finance' | string)`; `billing/ui` hides the button
  when `actorRole !== 'finance'`; the role string comes from an `app/providers`
  current-actor reader. No `identity` slice is required for one role check; add one
  only when identity grows its own rules."_
- **Blesses**: role-aware `billing/core/policy` **keyed on a primitive** + app-level
  actor source (a synthesis of B/C/D and A/E). **Cost of the wrong choice**: either a
  full `identity` slice stood up for a single boolean (A/C/D/E over-build, and a
  CODEOWNERS config edit for it), or the finance gate living only in the template
  (A/E) where a second void entry-point later ships unguarded.

### D3 — R11 "billing periods": new slice vs fold, and what a slice _is_ (high cost)

- **Competing placements**: all 5 **folded into `billing`** (core rules + data query
  - ui view + `billing/index` export) and pulled scheduling data through
    `@slices/scheduling` (adding a `scheduling/data` range query, re-exported via
    `scheduling/index`). Split only on whether to add an `app/` nav link (2/5 did).
    **Nobody created a new slice**, though several weighed it.
- **Adjudicating rule**: ambiguous. Rule 5 ("belongs to the slice it is _about_")
  and the "ClientOverviewView is the ONLY cross-slice composition view" note pull in
  opposite directions — is a period a _billing_ thing that reads scheduling, or a new
  cross-slice capability? The raters resolved it consistently (fold into billing) but
  the constitution does not say so.
- **Proposed amendment** (README, rule 5 corollary): _"A capability that is *about*
  one slice but *reads* another belongs to the slice it is about, consuming the other
  only through its public `index.ts`. Create a new slice only when the capability has
  its own reason-to-change independent of both."_ Worked example: _"Billing periods →
  `billing/core` (period totals), `billing/data` (a query that pulls appointment
  summaries via `@slices/scheduling`), `billing/ui` (the period view). Not a new
  slice: a period exists to total invoices; scheduling is a read input."_
- **Blesses**: fold-into-billing (the unanimous rater choice). **Cost of the new-slice
  choice**: a third slice whose `data/` must duplicate billing's DTO/mapper (drill 5
  showed DTOs can never be shared across slices), doubling the maintenance surface for
  no independent reason-to-change.

### D4 — R10 feature-flag: is a runtime flag a domain invariant? (medium cost)

- **Competing placements**: all 5 fetch the flag in **`scheduling/data`** and gate in
  **`scheduling/ui`**. 3/5 _also_ threaded the flag into **`scheduling/core/policy`**
  (`canReschedule`), 2/5 left `core` untouched.
- **Adjudicating rule**: none. Rule 4 says core is framework-free but says nothing
  about whether an externally-fetched, per-customer flag is a _domain invariant_
  (like the 24-hour rule) or _runtime config_.
- **Proposed amendment**: _"A feature flag is runtime configuration, not a domain
  invariant: fetch it in `data/`, gate it in `ui/`, and keep `core/` rules pure. A
  flag never becomes a parameter of a `core/` rule."_ Worked example: _"Reschedule
  flag → `scheduling/data` fetch + `scheduling/ui` hides the button; `canReschedule`
  stays a pure 24-hour rule."_
- **Blesses**: data+ui only (the 2/5). **Cost of the core choice**: `core/` rules
  become non-deterministic across customers and their unit tests need flag fixtures —
  the exact purity the architecture sells is diluted.

### D5 — R06 optimistic reschedule: one rater over-promotes to core (low cost)

- **Competing placements**: 4/5 keep the optimistic patch + rollback entirely in
  `scheduling/ui` composables; 1/5 adds a pure `applyReschedule` helper in
  `scheduling/core/rules.ts`.
- **Adjudicating rule**: Rule 6 (concern = reason to change) _implies_ an in-place UI
  patch isn't a domain rule, but there's no example. Two raters explicitly rejected
  the core helper as over-engineering.
- **Proposed amendment**: _"Optimistic UI state (an in-place patch + rollback) is a
  `ui/` concern; only promote a transform to `core/` when it encodes a business
  invariant, not because it is 'pure'."_ Worked example: _"Optimistic reschedule →
  `scheduling/ui` composable patches the local list and reverts on server reject;
  nothing enters `core/`."_
- **Blesses**: `scheduling/ui` (the 4/5 majority). **Cost**: trivial — a one-line
  spread misfiled in core; harmless but dilutes core's "invariants only" meaning.

### D6 — R08 i18n: agrees on slice+layer, splits _within_ `app/` (documentation nit)

- All 5 agreed: i18n mechanism → `shared/lib` (domain-free, like `format.ts`),
  per-slice status labels → each slice's `ui/`. They split only on where locale setup
  goes: `app/providers` (2) vs `app/views`/`main.ts` (3). Not a slice/layer
  disagreement — a one-line convention fixes it: _"Cross-cutting app wiring
  (i18n locale, providers) lives in `app/providers/`."_

## 5. Adversarial results

### Mode A (directed) — 4 caught, 6 uncaught

| #   | Violation                                                           | Caught? | By                                    | Message quality                                                                                                            |
| --- | ------------------------------------------------------------------- | ------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| A1  | type-only DTO import from `ui/`                                     | ✅      | depcruise `dtos-stay-home`            | excellent (rule + edge; `tsPreCompilationDeps:true` follows type-only)                                                     |
| A3  | `defineAsyncComponent(import('@slices/scheduling/ui/DayView.vue'))` | ✅      | depcruise allow-list `not-in-allowed` | good — **typecheck did NOT catch it**; the closed allow-list is the net                                                    |
| A4  | laundering via an `app/` composable                                 | ✅      | depcruise `app-is-a-leaf`             | excellent (caught at hop 1)                                                                                                |
| A9  | `core/` imports non-allowlisted `clsx`                              | ✅      | depcruise `core-is-framework-free`    | good — **oxlint does NOT** catch arbitrary npm; depcruise does                                                             |
| A2  | computed dynamic import ``import(`@slices/${name}`)``               | ❌      | —                                     | **fixable** — unresolvable specifier; no edge recorded                                                                     |
| A5  | re-export laundering via `billing/index.ts`                         | ❌      | —                                     | **fixable** — every hop legal; no `via`/`viaOnly` path rule                                                                |
| A8  | Pinia store w/ invoice state in `app/providers/`                    | ❌      | —                                     | **fixable** — `app/` not grepped for domain nouns; `providers` not a banned dir                                            |
| A10 | vue→`core/` via `shared/lib` re-export                              | ❌      | —                                     | **fixable** — framework-free rule is per-edge; oxlint core restricts `@shared/ui`+`@shared/http` but **not `@shared/lib`** |
| A6  | domain-aware `shared/ui/StatusBadge.vue`                            | ❌      | —                                     | **structurally uncatchable** (semantic)                                                                                    |
| A7  | `ui/` re-implements core `isOverdue`                                | ❌      | —                                     | **structurally uncatchable** (semantic)                                                                                    |

### Mode B (open-ended) — 3 subagents, 9 findings → 5 distinct themes, all reproduced by me

1. **`core/` reads the wall clock** (`new Date()` inside a rule) — found independently
   by all 3 subagents. A **new axis** the rules don't cover: purity/determinism, not
   framework-freeness. The code's own invariant ("a clock is never read here") is
   unenforced. _Fixable_ for the clock/random case via an oxlint `no-restricted-syntax`
   ban on `Date`/`Math.random`/`performance` under `slices/*/core/**`; general effect
   purity is semantic.
2. **Domain logic/vocabulary in `shared/lib` under a generic name** — `lifecycleRank`
   over `['draft','issued','paid','void']`, invoice tax/total math as "generic money
   math", a `STATUS_LABELS` map for both slices. Same root cause as A6: the domain-noun
   grep reads filenames + identifiers, never string-literal unions/arrays. _Semantic._
3. **A `shared/ui` component encoding both slices' status semantics** (Rule-6
   two-costumes). _Semantic_ (corroborates A6).
4. **Over-broad public index** — `scheduling/index.ts` re-exports the raw `Appointment`
   entity + unfiltered `fetchAppointments`; billing consumes the internal shape. The
   allow-list only checks a cross-slice edge _terminates at_ `index.ts`, never _what_
   it exposes. The "tiny public surface" (Rule 3) is convention, not enforced.
   _Fixable-hard._
5. **Inline unvalidated DTO** — a snake_case server interface declared in
   `data/queries.ts` (not `data/dto.ts`) and returned unmapped is consumed raw in the
   view. `dtos-stay-home` keys on the _file_ `dto.ts`, not the _concept_ "unvalidated
   server shape". _Fixable-hard._

### The catchability boundary (stated plainly)

**Structural rules catch structural drift; semantic drift needs a different detector.**
The classic import violations (deep imports, wrong-direction edges, DTO-file leaks,
non-allowlisted core deps, app-as-non-leaf) are caught crisply by dependency-cruiser's
**closed allow-list** — the single strongest asset here. What is _not_ caught splits
into **fixable-structural** (A2 computed import, A5/B4 re-export & index over-exposure,
A8 app-store, A10 vue-via-shared-lib, B5 inline DTO, B1 core-clock) and
**structurally-uncatchable/semantic** (A6/B2/B3 domain-aware primitive, A7 duplicated
rule, general core purity). The honest mitigation for the semantic set is a **review
checklist** ("does this template/computed re-implement a `core/` rule? does this
`shared/` thing know a domain vocabulary? does `core/` read a clock?") plus the
**Phase-4 churn/instability meters** as trailing indicators. Do not claim coverage
that does not exist.

## 6. Refactor drills — predicted vs actual

| Drill                                 | Predicted                                                          | Actual                                                                                                                                                                                | Verdict                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delete Vue**                        | core compiles+tests, nothing else                                  | `tsc` clean (`types:[]`), 17/17 tests with vue/pinia/router stubbed to throw + env=node; core reaches only framework-free `@shared/lib/result`                                        | **PASS — the framework-free rule is real**                                                                                                   |
| **Reshape all DTOs**                  | `data/` only                                                       | 6 `data/` files + 1 data-level test; **zero core/ui**                                                                                                                                 | **PASS — perfect containment**                                                                                                               |
| **Replace Pinia**                     | one `data/` folder; fail if ui signature changes                   | `data/` swap + `app/main.ts` + `package.json`; `useInvoiceList` internals changed but **public signature held**                                                                       | **PARTIAL-PASS** — signature held, but Pinia's `storeToRefs` had leaked into `ui/`, and removing a global dep touches `app/main.ts`+manifest |
| **Move component billing→scheduling** | the two slices; fail if it drags imports                           | 4 files; **dragged billing's `InvoiceStatus` into scheduling**, forced billing views to re-import via `@slices/scheduling`, tripped `no-circular` until routed through public indexes | **INFORMATIVE FAIL** — demonstrates Rule 5 works: a domain component resists a domain-wrong move                                             |
| **Split billing→invoicing**           | those slices + one route reg; fail if other slice/app view changes | new `invoicing` slice + `billing` + `app/router` + `app/providers/msw.ts` + `architecture.config.ts` slices-array; **`app/views` untouched**; **DTO/mapper had to be duplicated**     | **PARTIAL** — app views safe as predicted, but any new slice needs a CODEOWNERS config edit (by design) and forces DTO duplication           |

**Escape hatches used across all drills: ZERO** rule-bypasses (no disable comment,
no `any`, no boundary bypass). The one CODEOWNERS-file edit (adding `invoicing` to the
`slices` array in drill 5) is the _documented, review-gated_ mechanism for adding a
slice — not a bypass.

## 7. Metrics snapshot

- **Instability** `I=Ce/(Ca+Ce)` (folder granularity; read the gradient, not leaf SFCs
  whose `Ce` includes npm): `app`=**100%** (leaf ✓), `billing/core`=**13%**,
  `scheduling/core`=**24%**, `core/types.ts`=**0%**, `shared/lib`=**16%**,
  `shared/http`=**0%**, `*/data`≈**71–72%**. Gradient correct: core+shared stable, app
  maximally unstable. **Leading indicator to watch: `slices/*/core` instability rising
  over time = the architecture inverting.** (`validation/metrics_instability.txt`)
- **Rule-7 audit** (distinct importing slices per `shared/` module,
  `validation/rule7_audit.json`): `shared/lib/useDebounce.ts` has **zero importers** —
  dead/speculative code (not flagged by `no-orphans` because it imports vue, so it is
  not a depcruise "orphan"). Five modules are used by **exactly one slice**
  (`lib/result`, `ui/{alert,input,label,table}`) → demote-candidates by Rule 7's "3+
  usages" — **but these are shadcn design-system primitives**, which the constitution
  treats as legitimately shared. The meter cannot separate "premature domain
  promotion" from "primitive not yet widely used"; it needs a `shared/ui` carve-out or
  it false-positives on the whole primitive library.
- **Churn by layer** (collection script in `validation/metrics_summary.json`): starter
  snapshot is noise (everything created in 1 commit; `shared`=32 dominates,
  `core`=6 lowest). Expected real-repo shape: `ui` highest, `core` lowest.
- **Cross-slice PR rate**: defined (fraction of merged PRs touching ≥2 slices) with a
  git query; N/A on a 2-commit starter. High on the real repo ⇒ slices mis-drawn.
- **Baseline / disable counts**: **0 / 0**; `MAX_KNOWN_VIOLATIONS=0`. Ratchet at its
  floor; both monotonic-decreasing, published via `arch:baseline:check` + `arch:no-disable`.

## 8. Proposed constitution amendments (consolidated, by disagreements resolved)

1. **Rule 8 — cross-cutting concerns** (resolves D1 audit, D2 authz, D4 flags; the
   single highest-value gap): _"A concern orthogonal to the domain slices (audit,
   authz, feature flags, telemetry) lives in its own slice invoked via its public
   `index.ts`; observation/gating is wired in each slice's **`data/`** layer, and any
   external identity/config is read at the `app/` root and passed **down as a
   primitive**, never imported as another slice's type and never read ambiently in
   `core/`."_ Worked example: the audit example in D1. **Does not add a sixth
   _layer_** — it uses the existing slice+layer axes.
2. **Rule 5 corollary — about-vs-reads** (resolves D3 billing-periods): amendment text
   - example in D3. Fold single-owner capabilities; new slice only for an independent
     reason-to-change.
3. **Rule 4 corollary — purity** (resolves D5 + Mode-B #1 clock): _"`core/` is not
   only framework-free but pure: no clock (`new Date()`/`Date.now()`), no randomness,
   no ambient IO — `now`/`today` are always passed in. Optimistic UI state is `ui/`."_
   Add an oxlint `no-restricted-syntax` rule for `slices/*/core/**` to make the clock
   case machine-enforced.
4. **Naming/convention lines** (resolve D6 + R03 naming variance): _"Cross-cutting app
   wiring lives in `app/providers/`."_ and _"A UI element needed in two slices is
   duplicated per slice until the third same-reason usage; only then promote to
   `shared/ui`."_ (R03 showed raters already do this — bless it in text.)

**Structural-rule hardening (to close the fixable Mode-A/B holes; require
CODEOWNERS review):** 5. Forbid dynamic `import()` with a non-literal specifier (oxlint) — closes A2. 6. Add dependency-cruiser `viaOnly`/reachability rules so a slice `index.ts` may not
re-export another slice's symbols, and `core/` may not _reach_ framework through any
path — closes A5 and A10; also constrain what a public index may re-export (B4). 7. Extend the domain-noun structure test and the "no store outside `data/`" idea to
`app/` (a `defineStore`/domain-state file under `app/` is illegal) — closes A8. 8. Broaden `dtos-stay-home` from "the file `dto.ts`" to "any server-shaped type exported
from `data/`" or require all `data/` fetches to return `core/` types — closes B5.

No amendment adds a **sixth layer**; if one is ever proposed, that is a design smell
requiring an explicit argument.

## 9. Judgement calls the study design did not cover

- **The README _is_ the answer key** for requests 1/3/5. "Keep the README, strip
  everything else" is self-defeating when the README embeds worked placements. A
  cleaner design would test with the worked-examples section removed as a separate arm.
- **Coordinate granularity for `app/` and `shared/`.** The gate says "slice + layer,"
  but is `app/providers` vs `app/views` the same coordinate? I treated all of `app/`
  as one layer and all of `shared/` as `primitives` (per the README's 5-layer table),
  which made R08 "agree." A stricter reading would score R08 as a within-`app/`
  disagreement. I reported both.
- **New-slice name normalization.** `audit` vs `compliance` (R07) — same role, different
  name. I had the adjudicator normalize by role; a purely mechanical scorer counts them
  as different coordinates. Both views are in the report.
- **Test-file inclusion** was excluded from coordinate scoring (tests aren't
  architectural placements), but several raters correctly flagged test updates.
- **"Escape hatch" definition.** Drill 5 needed a CODEOWNERS `architecture.config.ts`
  edit to register a new slice. I ruled this is _not_ an escape hatch (it's the
  sanctioned, reviewed mechanism), but a stricter reading of gate-5 ("boundary
  bypasses") could count any CODEOWNERS edit. Flagged.
- **Rule-7 meter vs shadcn primitives** — the audit fires on legitimate design-system
  components; the study's Rule-7 check needs a carve-out that the spec did not anticipate.

## Gate criteria — verdict

| Gate                                                        | Result                                                                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Coord agreement 100% on 1–6                                 | **FAIL (5/6)** — R06 one outlier promotes a helper to core                                                                               |
| Every 7–12 disagreement resolved into rule+example          | **DONE** — D1–D5 amendments above                                                                                                        |
| Every structural violation caught; semantic ones documented | **FAIL** — A2/A5/A8/A10 (+B4/B5) are structural and uncaught (all fixable); semantic set (A6/A7/B1/B2/B3) documented with mitigations    |
| All 5 drills contained                                      | **PARTIAL** — Vue+DTO clean; Pinia signature-stable; move fails by design (Rule 5); split needs sanctioned config edit + DTO duplication |
| Zero escape hatches for legitimate work                     | **PASS** — 0 rule-bypasses across all drills                                                                                             |

## Scope limit

This validates the **ruleset's self-consistency**, not its fit to the real domain. A
starter written in one sitting by one author with the constitution open is consistent
by construction; the perfect DTO containment and unanimous easy-case agreement partly
reflect that. Passing (after the fixes above) is the gate to piloting on the two
nastiest real slices — never a substitute for it. The cross-slice PR rate and `core/`
instability trend are the meters that will tell you, on the real codebase, whether the
slices match the domain.
