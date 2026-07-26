// VS Code task helper ("check file" / "check all"): runs dependency-cruiser in
// allow-list mode over one file (path arg, from ${file}) or all of apps/web/src
// (no arg), and prints every violation as
//
//   <absolute-path>:1:1: <severity> <rule>: <from> → <to>
//
// which the "depcruise" problemMatcher in .vscode/tasks.json parses
// (fileLocation: absolute). Boundary rules live in apps/web/.dependency-cruiser.cjs
// (generated from architecture.config.ts — the single source of truth).
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface DepcruiseViolation {
  readonly from: string;
  readonly to?: string;
  readonly rule?: { readonly name?: string; readonly severity?: string };
}

interface DepcruiseReport {
  readonly summary?: {
    readonly violations?: readonly DepcruiseViolation[];
    readonly error?: number;
    readonly warn?: number;
    readonly totalCruised?: number;
  };
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(repoRoot, "apps", "web");

const arg = process.argv.at(2)?.trim();
let target = "src";
if (arg) {
  const abs = isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
  const rel = relative(appDir, abs);
  if (rel.startsWith("..") || !rel.startsWith("src")) {
    console.log(`skipped: ${arg} is not under apps/web/src`);
    process.exit(0);
  }
  target = rel;
}

const { status, stdout, error } = spawnSync(
  "vp",
  ["exec", "depcruise", target, "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
  { cwd: appDir, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
);

if (error) {
  console.error(`failed to run dependency-cruiser: ${error.message}`);
  process.exit(1);
}

const raw = stdout;
const brace = raw.indexOf("{");
let report: DepcruiseReport;
try {
  report = JSON.parse(raw.slice(brace));
} catch {
  const trimmed = raw.trim();
  console.error(trimmed === "" ? "dependency-cruiser produced no parseable output" : trimmed);
  process.exit(status && status !== 0 ? status : 1);
}

function severityLabel(s: string | undefined): string {
  if (s === "warn") return "warning";
  if (s === "info") return "info";
  return "error";
}
const violations = report.summary?.violations ?? [];
for (const v of violations) {
  const from = v.from;
  const abs = join(appDir, from);
  const rule = v.rule?.name ?? "violation";
  const sev = severityLabel(v.rule?.severity);
  const to = v.to && v.to !== from ? ` → ${v.to}` : "";
  console.log(`${abs}:1:1: ${sev} ${rule}: ${from}${to}`);
}

const errors = report.summary?.error ?? 0;
const warnings = report.summary?.warn ?? 0;
const where = target === "src" ? "apps/web/src" : target;
if (violations.length === 0) {
  console.log(
    `✔ no boundary violations in ${where} (${report.summary?.totalCruised ?? 0} modules cruised)`,
  );
} else {
  console.log(`✖ ${errors} error(s), ${warnings} warning(s) in ${where}`);
}
process.exit(errors > 0 ? 1 : 0);
