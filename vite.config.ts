import { defineConfig } from "vite-plus";
import { buildOxlintBaseConfig, buildOxlintOverrides } from "./architecture.config";

// Oxlint config is built from architecture.config.ts (the single source of
// truth). The import boundaries are enforced by the `architecture/no-invalid-import`
// plugin rule (architecture.oxlint-plugin.ts), which reads the SAME forbidden +
// allowed rule set dependency-cruiser does — so `vp lint` and dependency-cruiser
// can never disagree. The specifier below is resolved from the repo root, where
// `vp lint` runs.
//
// Type-aware lint is ON so the enforced `vp lint` (CI + the staged pre-commit
// hook) fails on exactly what the editor's type-aware Oxlint flags — no error
// visible in VS Code can slip past CI. tsgo resolves this app's `*.vue` imports
// fine in practice; `vue-tsc --noEmit` still owns full type checking.
export default defineConfig({
  staged: {
    "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue}": "vp lint --fix",
  },
  lint: {
    ...buildOxlintBaseConfig("./architecture.oxlint-plugin.ts"),
    options: { typeAware: true, typeCheck: false },
    overrides: buildOxlintOverrides(),
  },
  fmt: {
    tabWidth: 2,
    endOfLine: "lf",
  },
});
