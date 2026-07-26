/**
 * architecture.config.ts — THE SINGLE SOURCE OF TRUTH for the enforced architecture.
 *
 * Two things read this file so the two linters can never disagree:
 *   1. The root `vite.config.ts` imports `buildOxlintOverrides()` to build the
 *      `lint.overrides` that `vp lint` (Oxlint) enforces — the fast inner loop.
 *   2. `scripts/generate-configs.ts` imports the builders to emit
 *      `apps/web/.dependency-cruiser.generated.json` (rules for the load-bearing
 *      dependency-cruiser pass) and `apps/web/.oxlintrc.json` (IDE/parity copy).
 *
 * A Vitest test (`tests/architecture.config-consistency.test.ts`) re-runs the
 * generators and fails if the committed artifacts drift from this file.
 *
 * CHANGING THIS FILE CHANGES THE ARCHITECTURE. See CODEOWNERS.
 */

/** The app that hosts the sliced architecture, relative to the workspace root. */
export const APP_DIR = "apps/web" as const;

/**
 * Domain nouns. If any of these appears in a filename or exported symbol under
 * `src/shared/`, the thing is in the wrong place (constitution rule 7). The
 * structure test greps for these.
 */
export const domainNouns = [
  "invoice",
  "billing",
  "appointment",
  "scheduling",
  "schedule",
  "reschedule",
  "client",
  "resource",
  "staff",
  "room",
  "payment",
] as const;

/** The demo slices. Add a slice name here and the whole toolchain follows. */
export const slices = ["billing", "scheduling"] as const;

/**
 * The ONLY npm packages `core/` may import. Everything else (framework, IO) is
 * a reason to move the code down a layer. Enforced by dependency-cruiser.
 */
export const coreNpmAllowlist = ["zod", "date-fns", "decimal.js"] as const;

/** Directory names that mean "nobody knew where this goes". */
export const bannedDirectoryNames = ["utils", "helpers", "misc", "common", "stores"] as const;

/**
 * Expressions core/ may never contain. A clock or randomness makes a domain
 * rule non-deterministic and untestable — pass `now`/`today` in as an argument
 * instead (constitution rule 4, purity corollary). The structure test greps
 * every core file in every slice for these.
 */
export const coreImpurityTokens = [
  "new Date(",
  "Date.now(",
  "Math.random(",
  "performance.now(",
] as const;

/* -------------------------------------------------------------------------- */
/* Helper-question messages — every restriction explains WHY, as a question.  */
/* -------------------------------------------------------------------------- */

export const MSG = {
  coreFrameworkFree:
    "Would this still make sense if you deleted Vue tomorrow? core/ is framework-free: reactivity is a UI concern and fetch is a data concern. Move this to ui/ or data/.",
  coreReachDown:
    "Dependencies point toward stability. core/ may not import data/ or ui/ — put the pure rule in core/ and let the outer layers call it.",
  coreCrossSlice:
    "What business reason would make this change? core/ is a silo: it never reaches another slice. Cross-slice access is an app-level or ui-level concern via @slices/<slice>.",
  sharedNoDomain:
    "Does this know about a specific domain? Then it is not shared. shared/ holds zero domain knowledge and never imports a slice or the app (rule 7).",
  climbOutOfSlice:
    "Are you reaching sideways? Cross-slice access goes through the slice's public index.ts via the @slices/<slice> alias, never a relative path that climbs out of the slice.",
  appIsLeaf:
    "The app is the composition root: it is imported by nobody. Move shared code down into a slice or shared/.",
} as const;

/* -------------------------------------------------------------------------- */
/* Oxlint: per-folder no-restricted-imports overrides.                        */
/* Oxlint does NOT merge `no-restricted-imports` across overrides — each       */
/* override restates its full list. Generating them removes that footgun.      */
/* -------------------------------------------------------------------------- */

export interface OxlintOverride {
  files: string[];
  rules: Record<string, unknown>;
}

const FRAMEWORK_SPECIFIERS = ["vue", "vue-router", "pinia"];
const FRAMEWORK_PATTERNS = ["@vue/*", "**/*.vue", "*.vue"];

/**
 * @param base a workspace-relative prefix, e.g. "apps/web/" for the root
 *   vite.config, or "" for a `.oxlintrc.json` that lives inside the app.
 */
export function buildOxlintOverrides(base = ""): OxlintOverride[] {
  const p = (glob: string) => `${base}${glob}`;
  const climbOut = {
    group: ["**/slices/*/core/**", "**/slices/*/data/**", "**/slices/*/ui/**"],
    message: MSG.climbOutOfSlice,
  };
  // Oxlint does NOT merge no-restricted-imports across overrides: the LAST
  // matching override wins and replaces the rule wholesale. So overrides are
  // ordered least → most specific, and each one RESTATES every pattern it needs.
  return [
    // Repo-wide: never reach into a slice's internals via a relative path.
    {
      files: [p("src/**/*")],
      rules: {
        "no-restricted-imports": ["error", { patterns: [climbOut] }],
      },
    },
    // shared/: zero domain knowledge, never imports a slice or the app.
    {
      files: [p("src/shared/**/*")],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/slices/**", "**/app/**", "@slices/*", "@app/*"],
                message: MSG.sharedNoDomain,
              },
            ],
          },
        ],
      },
    },
    // core/: framework-free AND may not reach down or sideways. Most specific,
    // so it comes last and wins for files under slices/*/core.
    {
      files: [p("src/slices/*/core/**/*")],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: FRAMEWORK_SPECIFIERS.map((name) => ({ name, message: MSG.coreFrameworkFree })),
            patterns: [
              { group: FRAMEWORK_PATTERNS, message: MSG.coreFrameworkFree },
              {
                group: ["**/data/**", "**/ui/**", "../data/*", "../ui/*"],
                message: MSG.coreReachDown,
              },
              { group: ["@slices/*", "@app/*"], message: MSG.coreCrossSlice },
              { group: ["@shared/ui/*", "@shared/http/*"], message: MSG.coreFrameworkFree },
              climbOut,
            ],
          },
        ],
      },
    },
    // Tooling & generated files: exempt the source-oriented rules that are
    // inherently incompatible with each file TYPE. Unprefixed **/ globs so they
    // match at either root (repo root for `vp lint`, apps/web for .oxlintrc.json)
    // and never touch the boundary rules above (a different, merged rule set).
    {
      // Build/config entrypoints must default-export their config object.
      files: ["**/*.config.*", "**/plopfile.ts"],
      rules: { "import/no-default-export": "off" },
    },
    {
      // CommonJS modules (.cjs) legitimately use require()/module.exports.
      files: ["**/*.cjs"],
      rules: {
        "import/no-commonjs": "off",
        "import/no-dynamic-require": "off",
        "import/extensions": "off",
        "typescript/no-require-imports": "off",
        "typescript/no-var-requires": "off",
      },
    },
    {
      // Node-run tooling & tests import sibling .ts files WITH the extension
      // (Node's ESM resolver / type-stripping needs it); `never` can't apply.
      files: ["**/scripts/**", "**/tests/**"],
      rules: { "import/extensions": "off" },
    },
    {
      // Generated MSW worker: vendored, keeps its blanket eslint-disable header.
      files: ["**/mockServiceWorker.js"],
      rules: { "unicorn/no-abusive-eslint-disable": "off" },
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Oxlint: the shared rule baseline applied to EVERY js/ts/vue file, layered   */
/* on top of the architecture-boundary overrides above. Lives here (the single */
/* source of truth) so `.oxlintrc.json` (IDE) and vite.config.ts (`vp lint`)   */
/* can never drift.                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Local mirrors of Oxlint's config value types — the `oxlint` package is a
 * transitive dependency, not resolvable as a bare import here. Kept loose on
 * purpose: these objects are validated by Oxlint itself, not by TypeScript.
 */
type OxlintSeverity = "allow" | "off" | "warn" | "error" | "deny";
type OxlintRuleEntry = OxlintSeverity | [OxlintSeverity, ...unknown[]];
type OxlintRuleMap = Record<string, OxlintRuleEntry>;

/**
 * Built-in Oxlint plugins to enable. Setting `plugins` REPLACES Oxlint's
 * default set, so every plugin our rules reference is restated: `import` and
 * `vue` are off by default; `eslint`/`typescript`/`unicorn`/`oxc` back the core
 * and category rules.
 */
export const oxlintPlugins: string[] = ["eslint", "typescript", "unicorn", "oxc", "import", "vue"];

/** Category baselines. Every rule in the category fires at this severity unless
 *  a specific rule below sets its own. */
export const oxlintCategories: Record<string, OxlintSeverity> = {
  correctness: "error",
  suspicious: "error",
  perf: "warn",
};

/**
 * The shared rule set. Rules needing type information (e.g. `no-unsafe-*`,
 * `no-misused-promises`, `no-unnecessary-condition`, `prefer-nullish-coalescing`)
 * only run where Oxlint is type-aware; `vp lint`/CI is syntactic
 * (typeAware:false, see vite.config.ts), so those are enforced by editors or a
 * `vp lint --type-aware` pass, not the fast inner loop. A few high-churn rules
 * are intentionally left off (noted inline).
 */
export const oxlintRules: OxlintRuleMap = {
  // vue
  "vue/no-import-compiler-macros": "error",
  "vue/define-props-declaration": ["error", "type-based"],
  "vue/define-emits-declaration": ["error", "type-literal"],
  "vue/no-multiple-slot-args": "error",
  // "vue/define-props-destructuring": "error", // high-churn — off for now

  // typescript
  "typescript/use-unknown-in-catch-callback-variable": "error",
  "typescript/strict-void-return": "error",
  "typescript/return-await": "error",
  "typescript/restrict-plus-operands": "error",
  "typescript/require-await": "error",
  "typescript/promise-function-async": "error",
  "typescript/prefer-ts-expect-error": "error",
  "typescript/prefer-regexp-exec": "error",
  "typescript/prefer-reduce-type-parameter": "error",
  "typescript/prefer-optional-chain": "error",
  "typescript/prefer-nullish-coalescing": "error",
  "typescript/prefer-includes": "error",
  "typescript/prefer-function-type": "error",
  "typescript/prefer-for-of": "error",
  "typescript/prefer-find": "error",
  "typescript/only-throw-error": "error",
  "typescript/non-nullable-type-assertion-style": "error",
  "typescript/no-var-requires": "error",
  "typescript/no-unsafe-return": "error",
  "typescript/no-unsafe-function-type": "error",
  "typescript/no-unnecessary-qualifier": "error",
  "typescript/no-unnecessary-condition": "error",
  "typescript/no-restricted-types": [
    "error",
    {
      types: {
        Object: { message: "Avoid using Object as it is too general." },
        object: { message: "Avoid using object as it is too general." },
        "{}": {
          message:
            "Avoid using {} as it is too general. If you want to type an object that is always empty use EmptyObject instead.",
        },
      },
    },
  ],
  "typescript/no-require-imports": "error",
  "typescript/no-non-null-assertion": "error",
  "typescript/no-misused-promises": "error",
  "typescript/no-invalid-void-type": "error",
  "typescript/no-import-type-side-effects": "error",
  "typescript/no-empty-interface": "error",
  "typescript/no-dynamic-delete": "error",
  "typescript/explicit-module-boundary-types": "error",
  "typescript/dot-notation": "error",
  "typescript/consistent-type-imports": "error",
  "typescript/consistent-type-exports": "error",
  "typescript/consistent-type-assertions": "error",
  "typescript/consistent-indexed-object-style": "error",
  "typescript/consistent-generic-constructors": "error",
  "typescript/ban-tslint-comment": "error",
  "typescript/ban-ts-comment": [
    "error",
    {
      "ts-ignore": false,
      "ts-check": false,
      "ts-expect-error": "allow-with-description",
      "ts-nocheck": "allow-with-description",
      minimumDescriptionLength: 32,
    },
  ],
  "typescript/array-type": "error",
  "typescript/adjacent-overload-signatures": "error",

  // import
  // "import/no-relative-parent-imports": "error", // conflicts with the slice
  //   architecture: intra-slice relative imports (../core, ../components) are the
  //   sanctioned pattern, and climbing OUT of a slice is already blocked by the
  //   per-folder no-restricted-imports overrides above.
  "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
  "import/no-mutable-exports": "error",
  "import/no-dynamic-require": "error",
  "import/no-duplicates": "error",
  "import/no-default-export": "error",
  "import/no-cycle": "error",
  "import/no-commonjs": "error",
  "import/named": "error",
  "import/export": "error",
  "import/newline-after-import": ["error", { count: 1 }],
  "import/max-dependencies": ["error", { max: 10 }],
  "import/first": ["error", "absolute-first"],
  "import/extensions": ["error", "never", { vue: "always", css: "always", ignorePackages: true }],

  // oxc
  "oxc/bad-bitwise-operator": "error",
  "oxc/no-barrel-file": "error",

  // eslint core
  "max-lines": ["error", { max: 1000 }],

  // unicorn
  "unicorn/text-encoding-identifier-case": "error",
  "unicorn/no-abusive-eslint-disable": "error",
  // "unicorn/no-array-for-each": "error", // medium-churn — off for now
  "unicorn/no-document-cookie": "error",
  "unicorn/no-length-as-slice-end": "error",
  "unicorn/no-magic-array-flat-depth": "error",
  "unicorn/prefer-modern-math-apis": "error",
  // "unicorn/prefer-number-properties": "error", // medium-churn — off for now
  "unicorn/catch-error-name": "error",
  "unicorn/consistent-date-clone": "error",
  "unicorn/consistent-existence-index-check": "error",
  "unicorn/consistent-template-literal-escape": "error",
  // "unicorn/filename-case": ["error", { case: "camelCase" }], // needs testing — off for now
  "unicorn/no-nested-ternary": "error",
  "unicorn/error-message": "error",
  "unicorn/number-literal-case": "error",
  "unicorn/numeric-separators-style": "error",
  "unicorn/prefer-array-index-of": "error",
  "unicorn/prefer-bigint-literals": "error",
  // "unicorn/prefer-dom-node-text-content": "error", // low-churn — off for now
  "unicorn/prefer-keyboard-event-key": "error",
  "unicorn/prefer-negative-index": "error",
  "unicorn/prefer-string-trim-start-end": "error",
  "unicorn/require-array-join-separator": "error",
};

export interface OxlintBaseConfig {
  plugins: string[];
  categories: Record<string, OxlintSeverity>;
  rules: OxlintRuleMap;
}

/** A fresh copy of the shared Oxlint baseline for each consumer. */
export function buildOxlintBaseConfig(): OxlintBaseConfig {
  return {
    plugins: [...oxlintPlugins],
    categories: { ...oxlintCategories },
    rules: { ...oxlintRules },
  };
}

/* -------------------------------------------------------------------------- */
/* dependency-cruiser: forbidden rules (verbatim from the spec) + a closed     */
/* allow-list of every legal intra-src edge.                                   */
/* -------------------------------------------------------------------------- */

export interface DepcruiseRule {
  name: string;
  comment?: string;
  severity: "error";
  from: Record<string, unknown>;
  to: Record<string, unknown>;
}

export function buildForbiddenRules(): DepcruiseRule[] {
  const allowlist = coreNpmAllowlist.map((p) => p.replace(".", "\\.")).join("|");
  return [
    {
      name: "slice-isolation",
      comment: "A slice may only reach another slice through its index.ts.",
      severity: "error",
      from: { path: "(^src/slices/)([^/]+)/" },
      to: { path: "^$1", pathNot: "($1$2/|^src/slices/[^/]+/index\\.(ts|js)$)" },
    },
    {
      name: "layers-point-down",
      comment: "core may not know about data or ui.",
      severity: "error",
      from: { path: "^src/slices/[^/]+/core/" },
      to: { path: "^src/slices/[^/]+/(data|ui)/" },
    },
    {
      name: "data-not-to-ui",
      comment: "data is IO + mapping; it never reaches into the UI.",
      severity: "error",
      from: { path: "^src/slices/[^/]+/data/" },
      to: { path: "^src/slices/[^/]+/ui/" },
    },
    {
      name: "core-is-framework-free",
      comment: "core/ may only use the npm allowlist (zod, date-fns, decimal.js).",
      severity: "error",
      from: { path: "^src/slices/[^/]+/core/" },
      to: {
        dependencyTypes: ["npm", "npm-dev", "npm-peer", "npm-optional"],
        pathNot: `node_modules/(${allowlist})/`,
      },
    },
    {
      name: "dtos-stay-home",
      comment: "server shapes never escape data/.",
      severity: "error",
      from: { pathNot: "^src/slices/[^/]+/data/" },
      to: { path: "^src/slices/[^/]+/data/dto\\." },
    },
    {
      name: "shared-knows-nothing",
      comment: "shared/ is a global primitive layer; it imports no slice and no app code.",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(slices|app)/" },
    },
    {
      name: "app-is-a-leaf",
      comment: "the composition root is imported by nobody.",
      severity: "error",
      from: { pathNot: "^src/app/" },
      to: { path: "^src/app/" },
    },
    {
      name: "no-circular",
      comment: "circular dependencies make the graph un-reasoned-about.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      comment: "every module is reachable from a slice, shared, or the app root.",
      severity: "error",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.",
          "\\.(json|css|svg|png)$",
          "^src/app/main\\.ts$",
        ],
      },
      to: {},
    },
    {
      name: "public-index-no-relaunder",
      comment:
        "A slice's public index.ts may not re-export another slice — that launders a sideways dependency through your public surface. Import the other slice where you use it, via @slices/<slice>, so the coupling is visible at the use-site.",
      severity: "error",
      from: { path: "^src/slices/([^/]+)/index\\.ts$" },
      to: { path: "^src/slices/[^/]+/index\\.ts$", pathNot: "^src/slices/$1/" },
    },
    {
      name: "core-stays-framework-free",
      comment:
        "core/ must not even TRANSITIVELY reach the framework (e.g. via a shared/lib module that itself imports vue). Framework-freeness is a reachability property, not a direct-edge one.",
      severity: "error",
      from: { path: "^src/slices/[^/]+/core/" },
      to: { path: "node_modules/(vue|vue-router|pinia|@vue)/", reachable: true },
    },
  ];
}

/**
 * The closed allow-list. dependency-cruiser flags any intra-`src` edge that
 * matches no rule here, so the graph is legal by construction, not by omission.
 * `$1` is the capturing group from each rule's `from.path` (the slice name).
 */
export function buildAllowedRules(): (Pick<DepcruiseRule, "from" | "to"> & { comment?: string })[] {
  return [
    // Anything may depend on external packages, node builtins and local assets.
    {
      comment: "external packages",
      from: {},
      to: { dependencyTypes: ["npm", "npm-dev", "npm-peer", "npm-optional", "core", "type-only"] },
    },
    {
      comment: "local non-source assets (css, images)",
      from: {},
      to: { path: "\\.(css|svg|png|json)$" },
    },
    // Within a single slice, any file may import any file. Illegal layer edges
    // (core->data/ui, data->ui) are carved back out by the forbidden rules.
    {
      comment: "intra-slice",
      from: { path: "^src/slices/([^/]+)/" },
      to: { path: "^src/slices/$1/" },
    },
    // Cross-slice, but ONLY through the target slice's public index.ts.
    {
      comment: "cross-slice via public index",
      from: { path: "^src/(slices/[^/]+|app)/" },
      to: { path: "^src/slices/[^/]+/index\\.ts$" },
    },
    // core/ may use pure shared primitives only (shared/lib).
    {
      comment: "core -> shared/lib",
      from: { path: "^src/slices/[^/]+/core/" },
      to: { path: "^src/shared/lib/" },
    },
    // data/ + ui/ + the slice root files may use any shared primitive.
    {
      comment: "slice (non-core) -> shared",
      from: { path: "^src/slices/[^/]+/(data|ui)/" },
      to: { path: "^src/shared/" },
    },
    {
      comment: "slice root files -> shared",
      from: { path: "^src/slices/[^/]+/(index|routes)\\.ts$" },
      to: { path: "^src/shared/" },
    },
    // The app composition root may use shared and any slice's public index.
    { comment: "app -> shared", from: { path: "^src/app/" }, to: { path: "^src/shared/" } },
    { comment: "app -> app", from: { path: "^src/app/" }, to: { path: "^src/app/" } },
    // shared may only build on itself.
    { comment: "shared -> shared", from: { path: "^src/shared/" }, to: { path: "^src/shared/" } },
  ];
}
