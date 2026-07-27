import { describe, expect, it } from "vitest";
import {
  classifyImport,
  NOT_IN_ALLOWED,
  type ModuleDescriptor,
} from "../../../architecture.config.ts";

// classifyImport is the ONE decision procedure the Oxlint plugin
// (architecture.oxlint-plugin.ts) uses in place of running dependency-cruiser.
// It reads the same forbidden + allowed rule objects dependency-cruiser does, so
// this test pins its verdicts to the rule set: if the two ever diverge, the fast
// inner loop and the load-bearing CI pass would disagree.
//
// Descriptors are what the plugin's resolver produces: a repo-relative (to
// apps/web) module path plus dependency-cruiser dependencyTypes. npm imports use
// a synthetic "node_modules/<pkg>/" path.
const local = (path: string): ModuleDescriptor => ({ path, dependencyTypes: ["local"] });
const npm = (pkg: string): ModuleDescriptor => ({
  path: `node_modules/${pkg}/`,
  dependencyTypes: ["npm"],
});
const builtin = (name: string): ModuleDescriptor => ({ path: name, dependencyTypes: ["core"] });

interface Edge {
  readonly title: string;
  readonly from: ModuleDescriptor;
  readonly to: ModuleDescriptor;
  /** Expected verdict rule for an illegal edge; omit for a legal one. */
  readonly rule?: string;
}

const illegal: readonly Edge[] = [
  {
    title: "core/ may not reach down to data/",
    from: local("src/slices/billing/core/rules.ts"),
    to: local("src/slices/billing/data/queries.ts"),
    rule: "layers-point-down",
  },
  {
    title: "data/ may not reach into ui/",
    from: local("src/slices/billing/data/queries.ts"),
    to: local("src/slices/billing/ui/composables/useInvoiceList.ts"),
    rule: "data-not-to-ui",
  },
  {
    title: "a slice may not reach another slice's internals directly",
    from: local("src/slices/billing/ui/composables/useInvoiceList.ts"),
    to: local("src/slices/scheduling/core/rules.ts"),
    rule: "slice-isolation",
  },
  {
    title: "DTOs never escape data/",
    from: local("src/slices/billing/ui/InvoiceView.vue"),
    to: local("src/slices/billing/data/dto.ts"),
    rule: "dtos-stay-home",
  },
  {
    title: "shared/ knows about no slice",
    from: local("src/shared/lib/format.ts"),
    to: local("src/slices/billing/index.ts"),
    rule: "shared-knows-nothing",
  },
  {
    title: "the app is a leaf — nobody imports it",
    from: local("src/slices/billing/ui/composables/useInvoiceList.ts"),
    to: local("src/app/router/index.ts"),
    rule: "app-is-a-leaf",
  },
  {
    title: "core/ is framework-free (a non-allowlisted npm package)",
    from: local("src/slices/billing/core/rules.ts"),
    to: npm("vue"),
    rule: "core-is-framework-free",
  },
  {
    title: "core/ is framework-free (scoped framework package)",
    from: local("src/slices/scheduling/core/policy.ts"),
    to: npm("@vue/runtime-core"),
    rule: "core-is-framework-free",
  },
  {
    title: "a public index may not re-export another slice's index",
    from: local("src/slices/billing/index.ts"),
    to: local("src/slices/scheduling/index.ts"),
    rule: "public-index-no-relaunder",
  },
  {
    title: "the app may not deep-import a slice (only its index)",
    from: local("src/app/providers/msw.ts"),
    to: local("src/slices/billing/data/mocks.ts"),
    rule: NOT_IN_ALLOWED,
  },
  {
    title: "core/ may use shared/lib only, not shared/ui",
    from: local("src/slices/billing/core/rules.ts"),
    to: local("src/shared/ui/button/index.ts"),
    rule: NOT_IN_ALLOWED,
  },
];

const legal: readonly Edge[] = [
  {
    title: "within a single slice, any file may import any file",
    from: local("src/slices/billing/ui/views/InvoiceListView.vue"),
    to: local("src/slices/billing/core/rules.ts"),
  },
  {
    title: "a slice may reach another slice through its public index",
    from: local("src/slices/billing/ui/composables/useInvoiceList.ts"),
    to: local("src/slices/scheduling/index.ts"),
  },
  {
    title: "the app may compose a slice through its public index",
    from: local("src/app/views/ClientOverviewView.vue"),
    to: local("src/slices/billing/index.ts"),
  },
  {
    title: "core/ may build on pure shared/lib primitives",
    from: local("src/slices/scheduling/core/policy.ts"),
    to: local("src/shared/lib/date.ts"),
  },
  {
    title: "core/ may import the npm allowlist (zod)",
    from: local("src/slices/billing/data/dto.ts"),
    to: npm("zod"),
  },
  {
    title: "core/ importing zod is fine even from core itself",
    from: local("src/slices/billing/core/rules.ts"),
    to: npm("zod"),
  },
  {
    title: "data/ may use any shared primitive",
    from: local("src/slices/billing/data/mutations.ts"),
    to: local("src/shared/http/transport.ts"),
  },
  {
    title: "ui/ may use any shared primitive",
    from: local("src/slices/billing/ui/components/InvoiceLinesTable.vue"),
    to: local("src/shared/ui/table/index.ts"),
  },
  {
    title: "the app may use shared primitives",
    from: local("src/app/layouts/DefaultLayout.vue"),
    to: local("src/shared/ui/button/index.ts"),
  },
  {
    title: "shared/ may build on itself",
    from: local("src/shared/ui/alert/Alert.vue"),
    to: local("src/shared/lib/utils.ts"),
  },
  {
    title: "any layer may import external npm packages",
    from: local("src/slices/billing/ui/views/InvoiceListView.vue"),
    to: npm("lucide-vue-next"),
  },
  {
    title: "any layer may import node builtins",
    from: local("src/app/providers/msw.ts"),
    to: builtin("node:url"),
  },
  {
    title: "local assets (css) are always importable",
    from: local("src/app/main.ts"),
    to: local("src/app/styles.css"),
  },
];

describe("classifyImport mirrors the dependency-cruiser rule set", () => {
  it.each(illegal)("rejects: $title", ({ from, to, rule }) => {
    const verdict = classifyImport(from, to);
    expect(verdict.ok).toBe(false);
    expect(verdict.rule).toBe(rule);
    expect(verdict.comment).toBeTruthy();
  });

  it.each(legal)("allows: $title", ({ from, to }) => {
    expect(classifyImport(from, to)).toEqual({ ok: true });
  });

  it("reports the offending forbidden rule's comment as the rationale", () => {
    const verdict = classifyImport(
      local("src/slices/billing/core/rules.ts"),
      local("src/slices/billing/data/queries.ts"),
    );
    expect(verdict).toMatchObject({ ok: false, rule: "layers-point-down" });
    expect(verdict.comment).toContain("core may not know about data or ui");
  });
});
