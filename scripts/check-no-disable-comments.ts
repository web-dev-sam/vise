/**
 * Anti-loosening guard. The escape hatch for a boundary rule must be VISIBLE in
 * review, not silently sprinkled in code. This fails CI when a disable/ignore
 * comment names any boundary rule (oxlint or dependency-cruiser). Removing a
 * boundary is a deliberate architecture change to the CODEOWNERS-protected
 * config — never an inline `// oxlint-disable-next-line …` in a feature file.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { buildForbiddenRules } from "../architecture.config.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(repoRoot, "apps", "web", "src");

const boundaryRuleNames = [
  ...buildForbiddenRules().map((rule) => rule.name),
  "no-restricted-imports",
];
const disableToken = /(oxlint|eslint)-disable|dependency-cruiser-ignore/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const offenders: string[] = [];
for (const file of walk(srcDir)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (!disableToken.test(line)) return;
    const namesBoundary =
      line.includes("dependency-cruiser-ignore") ||
      boundaryRuleNames.some((name) => line.includes(name));
    if (namesBoundary) offenders.push(`${relative(repoRoot, file)}:${index + 1}: ${line.trim()}`);
  });
}

if (offenders.length > 0) {
  console.error(
    "Found disable/ignore comments naming a boundary rule (escape hatches must be a config change, reviewed by CODEOWNERS):",
  );
  for (const offender of offenders) console.error(`  ${offender}`);
  process.exit(1);
}

console.log("No boundary-rule disable comments found.");
