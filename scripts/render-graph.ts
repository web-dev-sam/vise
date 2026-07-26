/**
 * Renders the intra-src dependency graph to docs/architecture-graph.svg so the
 * two-band-plus-silos shape is visible (shared + app bands sandwiching the
 * vertical domain silos). Uses a wasm graphviz so no system graphviz is needed.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { instance } from "@viz-js/viz";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(repoRoot, "apps", "web");
const outDir = join(repoRoot, "docs");

const result = spawnSync(
  "vp",
  // node_modules is filtered out of the RENDER via reporterOptions.ddot.filters in
  // .dependency-cruiser.cjs (report-time, so cruise analysis still sees the real
  // graph — a CLI --exclude would strip node_modules from analysis too and, e.g.,
  // make a shared/lib module that only imports vue look like an orphan).
  ["exec", "depcruise", "src", "--config", ".dependency-cruiser.cjs", "--output-type", "ddot"],
  { cwd: appDir, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
);

const raw = result.stdout;
const start = raw.search(/(strict\s+)?digraph/);
if (start < 0) {
  console.error("depcruise did not emit a DOT graph.");
  process.exit(1);
}
const rawDot = raw.slice(start);

/** Source extensions dependency-cruiser resolves (mirrors the .cjs resolver). */
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".vue", ".js", ".mjs", ".cjs"];

/**
 * The file a folder exposes as its entry: an `index.*` barrel (a slice's public
 * door) or a top-level `main.*` (the app composition root). Returns null when the
 * folder has no single obvious entry, so the caller keeps the plain folder label.
 */
function ownEntryFile(pFolderAbs: string): string | null {
  let sources: string[];
  try {
    sources = readdirSync(pFolderAbs, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => SOURCE_EXTENSIONS.some((ext) => name.endsWith(ext)));
  } catch {
    return null;
  }
  // Prefer an index barrel (a slice's public door) over a top-level main entry.
  for (const stem of ["index", "main"]) {
    const entry = sources.find((name) => SOURCE_EXTENSIONS.some((ext) => name === `${stem}${ext}`));
    if (entry) return entry;
  }
  return null;
}

/**
 * A ddot folder that is BOTH an importable module (has an index.ts barrel) AND a
 * parent of sub-folders is emitted twice under one id: once as a visible box3d node
 * (its own root files) and again as the invisible `[shape=point style=invis]` anchor
 * of its sub-cluster. Graphviz merges duplicate declarations, so the invisible anchor
 * wins and the node vanishes — edges into the slice then point at empty space.
 *
 * For each such colliding id: drop the anchor so the visible node survives, and
 * relabel it from the bare folder name (which collides with the cluster's own label)
 * to `<folder>/<entry>` — e.g. `billing/index.ts` — so it reads unambiguously as the
 * slice's public door rather than a nameless twin of the surrounding cluster.
 */
function resolveBarrelCollisions(pDot: string): string {
  const boxRe = /"([^"]+)" \[label=<[^>]*> tooltip="[^"]*" URL="[^"]*" shape="box3d"\]/g;
  const box3dIds = new Set<string>();
  for (const match of pDot.matchAll(boxRe)) box3dIds.add(match[1]);

  let out = pDot;
  for (const id of box3dIds) {
    const anchor = `"${id}" [width="0.05" shape="point" style="invis"] `;
    if (!out.includes(anchor)) continue; // pure leaf folder — no cluster twin, leave it

    out = out.split(anchor).join("");

    const entry = ownEntryFile(join(appDir, id));
    if (entry) {
      const base = id.slice(id.lastIndexOf("/") + 1);
      const idPattern = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`("${idPattern}" \\[label=)<[^>]*>`), `$1<${base}/${entry}>`);
    }
  }
  return out;
}

const dot = resolveBarrelCollisions(rawDot);

const viz = await instance();
const svg = viz.renderString(dot, { format: "svg" });

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "architecture-graph.dot"), dot);
writeFileSync(join(outDir, "architecture-graph.svg"), svg);
console.log("wrote docs/architecture-graph.dot and docs/architecture-graph.svg");
