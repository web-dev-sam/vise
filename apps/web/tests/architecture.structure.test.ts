import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bannedDirectoryNames, domainNouns, slices } from "../../../architecture.config.ts";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(full, ...walk(full));
    else out.push(full);
  }
  return out;
}

const allPaths = walk(srcDir);
const dirs = allPaths.filter((p) => statSync(p).isDirectory());
const files = allPaths.filter((p) => statSync(p).isFile());
const rel = (p: string) => relative(srcDir, p).split("\\").join("/");

describe("slice shape", () => {
  it("every slice contains exactly core, data, ui, routes.ts, index.ts", () => {
    const sliceRoot = join(srcDir, "slices");
    const present = readdirSync(sliceRoot).sort();
    expect(present).toEqual([...slices].sort());
    for (const slice of present) {
      const entries = readdirSync(join(sliceRoot, slice)).sort();
      expect(entries).toEqual(["core", "data", "index.ts", "routes.ts", "ui"]);
    }
  });

  it("every slice index.ts re-exports its routes.ts", () => {
    for (const slice of slices) {
      const index = readFileSync(join(srcDir, "slices", slice, "index.ts"), "utf8");
      expect(index).toMatch(/from\s+["']\.\/routes["']/);
    }
  });
});

describe("SFC placement", () => {
  it("no .vue file lives outside slices/*/ui, app/layouts, app/views, shared/ui", () => {
    const allowed = (path: string): boolean =>
      /^slices\/[^/]+\/ui\//.test(path) ||
      path.startsWith("app/layouts/") ||
      path.startsWith("app/views/") ||
      path.startsWith("shared/ui/");
    const stray = files
      .filter((f) => f.endsWith(".vue"))
      .map(rel)
      .filter((p) => !allowed(p));
    expect(stray).toEqual([]);
  });
});

describe("no junk-drawer directories", () => {
  it("no directory is named utils, helpers, misc, common, or stores", () => {
    const offenders = dirs
      .map((d) => d.split("/").at(-1))
      .filter((name): name is string =>
        bannedDirectoryNames.includes(name as (typeof bannedDirectoryNames)[number]),
      );
    expect(offenders).toEqual([]);
  });
});

describe("shared/ is domain-free", () => {
  const sharedFiles = files.filter((f) => rel(f).startsWith("shared/"));
  const nounPattern = new RegExp(`(${domainNouns.join("|")})`, "i");

  it("no filename under shared/ contains a domain noun", () => {
    const offenders = sharedFiles
      .map(rel)
      .filter((p) => nounPattern.test(p.split("/").at(-1) ?? ""));
    expect(offenders).toEqual([]);
  });

  it("no exported symbol under shared/ contains a domain noun", () => {
    const offenders: string[] = [];
    for (const file of sharedFiles) {
      const source = readFileSync(file, "utf8");
      const exportMatches = source.matchAll(
        /export\s+(?:const|function|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g,
      );
      for (const match of exportMatches) {
        if (nounPattern.test(match[1] ?? "")) offenders.push(`${rel(file)}: ${match[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
