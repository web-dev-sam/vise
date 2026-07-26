// VS Code task helper ("graph"): renders a dependency graph focused on the
// current file (path arg, from ${file}) and opens it. Uses dependency-cruiser
// (--focus) piped through a wasm graphviz (@viz-js/viz), so no system graphviz
// is required. The SVG is written to the OS temp dir and opened best-effort in
// the default viewer; the task never fails just because auto-open didn't work.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { instance } from "@viz-js/viz";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(repoRoot, "apps", "web");

const arg = process.argv.at(2)?.trim();
if (!arg) {
  console.error("graph: no file given — open a file under apps/web/src and run the task again.");
  process.exit(1);
}
const absolutePath = isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
const relativePath = relative(appDir, absolutePath);
if (relativePath.startsWith("..") || !relativePath.startsWith("src")) {
  console.error(`graph: ${arg} is not under apps/web/src`);
  process.exit(1);
}

// Focus is a regex matched against module paths; escape the file path literally.
const focus = relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const { status, stdout } = spawnSync(
  "vp",
  [
    "exec",
    "depcruise",
    "src",
    "--config",
    ".dependency-cruiser.cjs",
    "--output-type",
    "dot",
    "--focus",
    focus,
    "--exclude",
    "node_modules",
  ],
  { cwd: appDir, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
);

const raw = stdout;
const digraphStart = raw.search(/(strict\s+)?digraph/);
if (digraphStart < 0) {
  console.error("graph: dependency-cruiser did not emit a DOT graph.");
  process.exit(status && status !== 0 ? status : 1);
}

const viz = await instance();
const svg = viz.renderString(raw.slice(digraphStart), { format: "svg" });

const slug = relativePath.replace(/[\\/]/g, "-").replace(/\.[^.]+$/, "");
const outFile = join(tmpdir(), `vise-focus-${slug}.svg`);
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, svg);
console.log(`graph: focused on ${relativePath}`);
console.log(`graph: wrote ${outFile}`);

// Best-effort open in the default viewer (renders the SVG); never fatal.
let opener = "xdg-open";
let openArgs = [outFile];
if (process.platform === "darwin") {
  opener = "open";
} else if (process.platform === "win32") {
  opener = "cmd";
  openArgs = ["/c", "start", "", outFile];
}
try {
  const child = spawn(opener, openArgs, { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
} catch {
  // The path is printed above; opening is a convenience only.
}
