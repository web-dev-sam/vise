/**
 * The migration ratchet. The dependency-cruiser baseline
 * (.dependency-cruiser-known-violations.json) freezes pre-existing violations so
 * a legacy codebase can adopt these rules without a big-bang refactor: new code
 * is strict from day one, and the recorded number only ever goes DOWN.
 *
 * Lowering MAX_KNOWN_VIOLATIONS is a normal refactor ("delete N lines from the
 * baseline"). RAISING it means adding new violations — that requires editing
 * this CODEOWNERS-protected file and an architecture review.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_KNOWN_VIOLATIONS = 0;

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(repoRoot, "apps", "web", ".dependency-cruiser-known-violations.json");

const baseline: unknown = JSON.parse(readFileSync(baselinePath, "utf8"));
const count = Array.isArray(baseline) ? baseline.length : 0;

if (count > MAX_KNOWN_VIOLATIONS) {
  console.error(
    `Baseline grew: ${count} known violations exceed the allowed ${MAX_KNOWN_VIOLATIONS}. The number only goes down.`,
  );
  process.exit(1);
}

console.log(`Baseline OK: ${count}/${MAX_KNOWN_VIOLATIONS} known violations.`);
