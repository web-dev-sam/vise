import { defineConfig } from "vite-plus";
import { APP_DIR, buildOxlintOverrides } from "./architecture.config";

// Oxlint boundary rules are generated from architecture.config.ts (the single
// source of truth) so `vp lint` and dependency-cruiser can never disagree.
//
// Type-aware lint is OFF on purpose: Vite+'s type-aware path uses tsgo, which is
// not Vue-SFC-aware and cannot resolve `*.vue` named exports. Type checking for
// this Vue app is owned by `vue-tsc --noEmit` (see apps/web `typecheck` script /
// CI). Oxlint stays the fast, syntactic inner loop — exactly as the spec frames
// it ("not type-aware").
export default defineConfig({
  staged: {
    "*": "vp lint --fix",
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    overrides: buildOxlintOverrides(`${APP_DIR}/`),
  },
  fmt: {
    tabWidth: 2,
    endOfLine: "lf",
  },
});
