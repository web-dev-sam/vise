/**
 * Guards against the classic dependency-cruiser false pass: a green run against
 * ZERO parsed modules. If .vue/.ts resolution silently breaks, the module count
 * collapses and this fails, instead of the boundary rules quietly passing.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FLOOR = 40;

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web");
const result = spawnSync(
  "vp",
  ["exec", "depcruise", "src", "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
  { cwd: appDir, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
);

const parsed = JSON.parse(result.stdout) as { modules?: unknown[] };
const count = parsed.modules?.length ?? 0;

if (count < FLOOR) {
  console.error(
    `Module count ${count} is below the floor of ${FLOOR}. dependency-cruiser likely parsed nothing — a green run here would be a false pass.`,
  );
  process.exit(1);
}

console.log(`Module count OK: ${count} modules cruised (floor ${FLOOR}).`);
