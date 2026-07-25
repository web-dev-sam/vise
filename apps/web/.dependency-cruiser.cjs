// @ts-check
// The forbidden + allowed rule SETS are generated from ../../architecture.config.ts
// (the single source of truth). Do not edit rules here — edit architecture.config.ts
// and run `pnpm --filter @vise/web run arch:generate`. This wrapper only wires the
// resolver so .vue SFCs and the @slices/@shared/@app aliases resolve correctly.
const generated = require("./.dependency-cruiser.generated.json");

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: generated.forbidden,
  allowed: generated.allowed,
  // Allow-list mode: anything matching no `allowed` rule is an error.
  allowedSeverity: "error",
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs", ".json"],
      mainFields: ["module", "main", "types", "typings"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
    tsPreCompilationDeps: true,
    moduleSystems: ["es6", "cjs"],
  },
};
