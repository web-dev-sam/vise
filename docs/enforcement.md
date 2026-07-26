[← README](../README.md) · [Architecture](architecture.md) · [Constitution](constitution.md) · [Adding a feature](adding-a-feature.md) · [Worked examples](worked-examples.md) · **Enforcement** · [Reading the graph](reading-the-graph.md)

# Enforcement

The architecture is not a style guide — it is checked by machine. Deviation fails
the build. `architecture.config.ts` is the single source of truth; every linter
config is generated from it, and a test fails if they ever drift.

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
| A slice `index.ts` re-exports no _other_ slice (no laundering)      | dependency-cruiser `public-index-no-relaunder`     | `arch:depcruise`                           |
| `core/` never _transitively_ reaches the framework                  | dependency-cruiser `core-stays-framework-free`     | `arch:depcruise`                           |
| `core/` is pure — no clock / `Date.now` / randomness                | Vitest structure test                              | `vp run -r test`                           |
| `import()` uses a static (literal) specifier                        | Vitest structure test                              | `vp run -r test`                           |
| A Pinia `defineStore` lives only in a slice's `data/`               | Vitest structure test                              | `vp run -r test`                           |
| Server shapes (snake_case types) stay in `data/dto.ts`              | Vitest structure test                              | `vp run -r test`                           |
| Baseline only shrinks                                               | `scripts/check-baseline-size.ts`                   | `arch:baseline:check`                      |
| depcruise actually parsed the graph (no false pass)                 | `scripts/check-module-count.ts`                    | `arch:module-count`                        |
| No inline boundary-rule disable comments                            | `scripts/check-no-disable-comments.ts`             | `arch:no-disable`                          |
| Every rule above actually bites                                     | `scripts/verify-enforcement.ts`                    | `verify:enforcement`                       |

`architecture.config.ts` is the single source of truth: the Oxlint overrides
(consumed by `vp lint`) and the dependency-cruiser rules (emitted to
`apps/web/.dependency-cruiser.generated.json` + `.oxlintrc.json`) are both derived
from it, and a Vitest test fails if they ever drift.

## Checking locally

```bash
vp lint                                       # Oxlint — boundary rules + fast inner loop
vp run --filter @vise/web typecheck           # vue-tsc --noEmit (types + deep-alias rejection)
vp run -r test                                # Vitest (unit + structure + config-consistency)
vp run --filter @vise/web arch:depcruise      # dependency-cruiser: allow-list + baseline
vp run --filter @vise/web verify:enforcement  # prove every rule bites
vp run --filter @vise/web arch:generate       # regenerate linter configs from the source of truth
```

When a check goes red, [Adding a feature § "CI is red"](adding-a-feature.md) maps
each message to its cause and fix.

## Anti-loosening

- `CODEOWNERS` covers `architecture.config.ts`, the generated configs,
  `tsconfig.json`, the structure/consistency tests, and the CI workflow. Boundary
  changes require architecture review; feature work never touches these files.
- No `warn` severity anywhere. A warning is debt with no deadline.
- CI greps for disable/ignore comments that name a boundary rule — the escape
  hatch must be a reviewed config change, visible, never silent.

## Scope

This suite validates the ruleset's **self-consistency** — that the rules are
enforceable and internally coherent. It is not a claim that the slicing fits any
particular real domain. Treat Vise as a research/reference starter: study the
pattern, then pilot it on the nastiest slices of a real codebase before trusting it.
