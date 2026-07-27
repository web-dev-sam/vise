/**
 * architecture.oxlint-plugin.ts — the fast inner-loop enforcer of the import
 * boundaries. It does NOT run dependency-cruiser (too slow per keystroke).
 * Instead, for every import/export/dynamic-import in an `apps/web/src` file it
 * resolves the specifier to a module path and asks classifyImport() — the shared
 * evaluator in architecture.config.ts that re-implements dependency-cruiser's
 * matching over the SAME forbidden + allowed rule objects. One rule set, two
 * enforcers, no drift.
 *
 * Loaded by `vp lint` / the IDE via `jsPlugins` (see buildOxlintBaseConfig).
 * Rule id: `architecture/no-invalid-import`.
 *
 * Graph-global rules (cycles, orphans, transitive framework reach) are not
 * decidable from a single import and remain dependency-cruiser's job; cycles are
 * additionally covered by Oxlint's `import/no-cycle`.
 */
import { statSync } from "node:fs";
import { isBuiltin } from "node:module";
import { join, sep } from "node:path";
import {
  APP_DIR,
  ARCH_IMPORT_RULE_ID,
  ARCH_PLUGIN_NAME,
  classifyImport,
  type ModuleDescriptor,
} from "./architecture.config.ts";

/* -------------------------------------------------------------------------- */
/* Locate the importing file within the app.                                   */
/* -------------------------------------------------------------------------- */

const APP_MARKER = `/${APP_DIR}/`;

interface FileLocation {
  /** Absolute path to the app root (…/apps/web), forward slashes. */
  appRoot: string;
  /** Importing file relative to the app root, e.g. "src/slices/billing/core/rules.ts". */
  fromRel: string;
}

function appContext(filename: string): FileLocation | null {
  const posix = filename.split(sep).join("/");
  const index = posix.lastIndexOf(APP_MARKER);
  if (index === -1) return null;
  return {
    appRoot: `${posix.slice(0, index)}/${APP_DIR}`,
    fromRel: posix.slice(index + APP_MARKER.length),
  };
}

/* -------------------------------------------------------------------------- */
/* Resolve an import specifier to the module it points at.                     */
/* Enough of the tsconfig `paths` + extension resolution to reproduce the path  */
/* dependency-cruiser would cruise; npm/builtin edges get a synthetic path.     */
/* -------------------------------------------------------------------------- */

// Extensionless imports are the house style (Oxlint `import/extensions: never`),
// so probe the on-disk candidates the way the bundler/tsc would.
const PROBE_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".vue",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  "/index.ts",
  "/index.tsx",
  "/index.vue",
  "/index.js",
  "/index.mjs",
  "/index.cjs",
];

// existsSync is true for directories too, which would let a bare specifier like
// `@slices/billing` "resolve" to the folder instead of its index.ts — so require
// an actual FILE at the candidate path.
const isFileCache = new Map<string, boolean>();
function isFileAbs(absolutePath: string): boolean {
  let hit = isFileCache.get(absolutePath);
  if (hit === undefined) {
    try {
      hit = statSync(absolutePath).isFile();
    } catch {
      hit = false;
    }
    isFileCache.set(absolutePath, hit);
  }
  return hit;
}

function probe(appRoot: string, baseRel: string): string {
  for (const suffix of PROBE_SUFFIXES) {
    const candidate = baseRel + suffix;
    if (isFileAbs(join(appRoot, candidate))) return candidate;
  }
  // Nothing on disk (e.g. a deep alias that intentionally does not resolve): the
  // prefix is still what the boundary rules key on.
  return baseRel;
}

function npmPackageName(specifier: string): string {
  const segments = specifier.split("/");
  if (specifier.startsWith("@")) {
    return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : segments[0];
  }
  return segments[0];
}

function posixDirname(pathname: string): string {
  const index = pathname.lastIndexOf("/");
  return index === -1 ? "" : pathname.slice(0, index);
}

function posixJoin(base: string, relative: string): string {
  const parts = base.length > 0 ? base.split("/") : [];
  for (const segment of relative.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return parts.join("/");
}

function toDescriptor(
  appRoot: string,
  fromRel: string,
  specifier: string,
): ModuleDescriptor | null {
  if (isBuiltin(specifier)) return { path: specifier, dependencyTypes: ["core"] };

  let baseRel: string | null = null;
  if (specifier === "@slices") baseRel = "src/slices";
  else if (specifier.startsWith("@slices/"))
    baseRel = `src/slices/${specifier.slice("@slices/".length)}`;
  else if (specifier.startsWith("@shared/"))
    baseRel = `src/shared/${specifier.slice("@shared/".length)}`;
  else if (specifier.startsWith("@app/")) baseRel = `src/app/${specifier.slice("@app/".length)}`;
  else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const joined = posixJoin(posixDirname(fromRel), specifier);
    // A relative import that escapes src/ is outside what the boundary rules
    // describe; leave it to typecheck/dependency-cruiser.
    if (!joined.startsWith("src/")) return null;
    baseRel = joined;
  }

  if (baseRel !== null) return { path: probe(appRoot, baseRel), dependencyTypes: ["local"] };

  // A bare specifier that is neither a builtin nor an alias is an npm package.
  // dependency-cruiser tags even type-only npm imports as npm edges, so we do too.
  return { path: `node_modules/${npmPackageName(specifier)}/`, dependencyTypes: ["npm"] };
}

/* -------------------------------------------------------------------------- */
/* The rule.                                                                   */
/* -------------------------------------------------------------------------- */

interface LiteralNode {
  value?: unknown;
}

interface SourcedNode {
  source?: LiteralNode | null;
}

interface RuleContext {
  filename: string;
  report(descriptor: { node: unknown; messageId: string; data?: Record<string, string> }): void;
}

type Visitor = (node: SourcedNode) => void;
type Visitors = Record<string, Visitor>;

const plugin = {
  meta: { name: ARCH_PLUGIN_NAME },
  rules: {
    [ARCH_IMPORT_RULE_ID]: {
      meta: {
        type: "problem",
        docs: {
          description:
            "Forbid imports the sliced-architecture rule set disallows (the dependency-cruiser boundaries), checked per-file without running dependency-cruiser.",
        },
        messages: {
          invalidImport: "{{ detail }} (rule: {{ rule }}; {{ from }} -> {{ to }})",
        },
      },
      create(context: RuleContext): Visitors {
        const location = appContext(context.filename);
        // Only files dependency-cruiser cruises (apps/web/src) carry boundaries.
        if (location === null || !location.fromRel.startsWith("src/")) return {};
        const from: ModuleDescriptor = { path: location.fromRel, dependencyTypes: ["local"] };

        const check = (node: SourcedNode): void => {
          const source = node.source;
          if (!source || typeof source.value !== "string") return;
          const to = toDescriptor(location.appRoot, location.fromRel, source.value);
          if (to === null) return;
          const verdict = classifyImport(from, to);
          if (verdict.ok) return;
          context.report({
            node: source,
            messageId: "invalidImport",
            data: {
              detail: verdict.comment ?? "",
              rule: verdict.rule ?? "",
              from: from.path,
              to: to.path,
            },
          });
        };

        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
          TSImportType: check,
        };
      },
    },
  },
};

export default plugin;
