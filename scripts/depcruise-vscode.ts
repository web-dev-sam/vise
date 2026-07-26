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
  const absolutePath = isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
  const relativePath = relative(appDir, absolutePath);
  if (relativePath.startsWith("..") || !relativePath.startsWith("src")) {
    console.log(`skipped: ${arg} is not under apps/web/src`);
    process.exit(0);
  }
  target = relativePath;
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
const jsonStart = raw.indexOf("{");
let report: DepcruiseReport;
try {
  report = JSON.parse(raw.slice(jsonStart));
} catch {
  const trimmed = raw.trim();
  console.error(trimmed === "" ? "dependency-cruiser produced no parseable output" : trimmed);
  process.exit(status && status !== 0 ? status : 1);
}

function severityLabel(severity: string | undefined): string {
  if (severity === "warn") return "warning";
  if (severity === "info") return "info";
  return "error";
}
const violations = report.summary?.violations ?? [];
for (const violation of violations) {
  const from = violation.from;
  const absolutePath = join(appDir, from);
  const rule = violation.rule?.name ?? "violation";
  const severity = severityLabel(violation.rule?.severity);
  const to = violation.to && violation.to !== from ? ` → ${violation.to}` : "";
  console.log(`${absolutePath}:1:1: ${severity} ${rule}: ${from}${to}`);
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
