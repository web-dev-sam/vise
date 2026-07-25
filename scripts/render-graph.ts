/**
 * Renders the intra-src dependency graph to docs/architecture-graph.svg so the
 * two-band-plus-silos shape is visible (shared + app bands sandwiching the
 * vertical domain silos). Uses a wasm graphviz so no system graphviz is needed.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { instance } from "@viz-js/viz";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(repoRoot, "apps", "web");
const outDir = join(repoRoot, "docs");

const result = spawnSync(
  "vp",
  ["exec", "depcruise", "src", "--config", ".dependency-cruiser.cjs", "--output-type", "ddot"],
  { cwd: appDir, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
);

const raw = result.stdout ?? "";
const start = raw.search(/(strict\s+)?digraph/);
if (start < 0) {
  console.error("depcruise did not emit a DOT graph.");
  process.exit(1);
}
const dot = raw.slice(start);

const viz = await instance();
const svg = viz.renderString(dot, { format: "svg" });

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "architecture-graph.dot"), dot);
writeFileSync(join(outDir, "architecture-graph.svg"), svg);
console.log("wrote docs/architecture-graph.dot and docs/architecture-graph.svg");
