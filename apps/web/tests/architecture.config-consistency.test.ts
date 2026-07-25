import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildAllowedRules,
  buildForbiddenRules,
  buildOxlintOverrides,
} from "../../../architecture.config.ts";

// The committed linter configs are generated from architecture.config.ts. If
// they drift (someone edited a generated file by hand, or forgot to run
// `arch:generate`), this fails — the two linters can never silently disagree.
const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name: string): unknown => JSON.parse(readFileSync(join(appDir, name), "utf8"));

describe("generated configs match the single source of truth", () => {
  it("dependency-cruiser rules are up to date", () => {
    const committed = readJson(".dependency-cruiser.generated.json");
    expect(committed).toEqual({ forbidden: buildForbiddenRules(), allowed: buildAllowedRules() });
  });

  it("oxlint overrides are up to date", () => {
    const committed = readJson(".oxlintrc.json");
    expect(committed).toEqual({
      $schema: "./node_modules/oxlint/configuration_schema.json",
      overrides: buildOxlintOverrides(""),
    });
  });
});
