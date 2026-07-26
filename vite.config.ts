import { defineConfig } from "vite-plus";
import { APP_DIR, buildOxlintBaseConfig, buildOxlintOverrides } from "./architecture.config";

// Oxlint boundary rules are generated from architecture.config.ts (the single
// source of truth) so `vp lint` and dependency-cruiser can never disagree.
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
    ...buildOxlintBaseConfig(),
    options: { typeAware: true, typeCheck: false },
    overrides: buildOxlintOverrides(`${APP_DIR}/`),
  },
  fmt: {
    tabWidth: 2,
    endOfLine: "lf",
  },
});
