/**
 * Emits the linter configs from architecture.config.ts (the single source of
 * truth), so dependency-cruiser and Oxlint can never drift apart:
 *
 *   apps/web/.dependency-cruiser.generated.json  (required by .dependency-cruiser.cjs)
 *   apps/web/.oxlintrc.json                      (IDE parity with `vp lint`)
 *
 * Run via `pnpm --filter @vise/web run arch:generate` (or the CI step). A test
 * re-runs this and fails if the committed artifacts are stale.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_DIR,
  buildAllowedRules,
  buildForbiddenRules,
  buildOxlintBaseConfig,
  buildOxlintOverrides,
} from "../architecture.config.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(repoRoot, APP_DIR);

const depcruise = {
  forbidden: buildForbiddenRules(),
  allowed: buildAllowedRules(),
};

const oxlint = {
  $schema: "./node_modules/oxlint/configuration_schema.json",
  // Specifier resolved from apps/web (where .oxlintrc.json lives).
  ...buildOxlintBaseConfig("../../architecture.oxlint-plugin.ts"),
  overrides: buildOxlintOverrides(),
};

const write = (name: string, value: unknown): void => {
  writeFileSync(join(appDir, name), `${JSON.stringify(value, null, 2)}\n`);
  console.log(`wrote ${join(APP_DIR, name)}`);
};

write(".dependency-cruiser.generated.json", depcruise);
write(".oxlintrc.json", oxlint);
