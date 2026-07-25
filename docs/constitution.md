[← README](../README.md) · [Architecture](architecture.md) · **Constitution** · [Adding a feature](adding-a-feature.md) · [Worked examples](worked-examples.md) · [Enforcement](enforcement.md) · [Reading the graph](reading-the-graph.md)

# The constitution (non-negotiable)

These are the rules the structure is derived from. Most are machine-enforced (see
[Enforcement](enforcement.md)); the rest are settled by [worked
example](worked-examples.md).

1. Everything lives in a slice, or in `shared/`.
2. Dependencies point toward stability, never away, never sideways between
   slices. This is machine-enforced, not a matter of discipline.
3. Slices do not import each other's internals. A slice exposes a tiny public
   API via its `index.ts`; everything else is private.
4. Domain core is framework-free. No `vue`, no `fetch`, no router. If you deleted
   Vue, every `core/` folder must still compile and its tests must still pass.

   **Corollary — purity.** Core is not only framework-free but _pure_: no clock
   (`new Date()`, `Date.now()`), no randomness, no ambient IO — `now`/`today` are
   passed in, so every rule is deterministic and testable. Framework-freeness is
   _transitive_: a `core/` file may not reach the framework even through a
   `shared/lib` re-export. Optimistic UI state (an in-place patch + rollback) is a
   `ui/` concern; promote a transform to `core/` only when it encodes a business
   invariant, not because it happens to be pure.
5. A component belongs to the slice it is _about_, not the slice that first used it.

   **Corollary — about vs. reads.** A capability that is _about_ one slice but
   _reads_ another belongs to the slice it is about, consuming the other only
   through its public `index.ts`. Create a new slice only when the capability has
   its own reason to change, independent of both.
6. **Concern = reason to change.** Two pieces of code share a concern iff they
   change for the same reason. A "reusable" component that changes for two
   different reasons in two contexts is two components wearing one costume — split it.
7. Promotion to `shared/` is deliberate, not reflexive. Duplication is cheaper
   than the wrong abstraction. A thing must be used in 3+ places _for the same
   reason_ before it moves to `shared/`. Two usages: leave it duplicated.
8. Cross-cutting concerns get their own slice. A concern orthogonal to the domain
   slices (audit, authz, feature flags, telemetry) is not a new layer: it does not
   belong in `shared/` (which is domain-free) or `app/` (imported by nobody). It is
   its own slice, invoked through its public `index.ts`. Wire the observation or
   gating in each observed slice's **`data/`** layer — the IO choke point every
   change already flows through — never in `ui/`. Any external identity or config it
   needs is read at the `app/` root and passed **down as a primitive**, never
   imported as another slice's type and never read ambiently in `core/`. A feature
   flag in particular is runtime config: fetch it in `data/`, gate it in `ui/`, and
   keep `core/` rules pure — a flag never becomes a parameter of a `core/` rule.

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
