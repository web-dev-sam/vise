import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bannedDirectoryNames, coreImpurityTokens, domainNouns, slices } from "../../../architecture.config.ts";

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

describe("core/ is pure", () => {
  it("no slices/*/core file reads a clock or randomness", () => {
    // Purity is what makes a core rule deterministic and testable: `now`/`today`
    // are passed in, never read ambiently (constitution rule 4, purity corollary).
    const offenders: string[] = [];
    for (const file of files) {
      const path = rel(file);
      if (!/^slices\/[^/]+\/core\//.test(path)) continue;
      const source = readFileSync(file, "utf8");
      for (const token of coreImpurityTokens) {
        if (source.includes(token)) offenders.push(`${path}: ${token}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("dynamic imports are statically analysable", () => {
  it("no import() uses a non-literal specifier", () => {
    // A computed `import(`@slices/${x}`)` evades every static boundary check.
    // Lazy routes use a literal specifier, which stays analysable.
    const computed = /\bimport\s*\(\s*(?!["'])/;
    const offenders = files
      .filter((f) => /\.(ts|vue)$/.test(f))
      .filter((f) => computed.test(readFileSync(f, "utf8")))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});

describe("stores live only in a slice's data/", () => {
  it("no defineStore() call outside slices/*/data/", () => {
    // A Pinia store is cached reactive IO state — it belongs in data/, never in
    // app/, ui/, core/, or shared/ (where domain state would hide from review).
    const offenders = files
      .filter((f) => /\.(ts|vue)$/.test(f))
      .filter((f) => /\bdefineStore\s*\(/.test(readFileSync(f, "utf8")))
      .map(rel)
      .filter((p) => !/^slices\/[^/]+\/data\//.test(p));
    expect(offenders).toEqual([]);
  });
});

describe("server shapes stay in data/dto.ts", () => {
  // A type/interface DECLARATION with a snake_case member is an unvalidated
  // server shape; those live only in the two data/ files that legitimately speak
  // server-shape — dto.ts (the schema) and mocks.ts (the mock server) — and are
  // mapped to core entities before anything else sees them (DTOs never leak
  // upward). This catches an inline DTO smuggled into data/queries.ts et al.
  const serverShapeMembers = (source: string): string[] => {
    const out: string[] = [];
    const opensType = /(?:^|\s)(?:export\s+)?(?:interface\s+\w+|type\s+\w+\s*=)/;
    const member = /[{;,]\s*(?:readonly\s+)?([a-z][a-zA-Z0-9]*_[a-zA-Z0-9_]*)\s*\??\s*:/g;
    let inType = false;
    let depth = 0;
    let buf = "";
    for (const line of source.split("\n")) {
      if (!inType) {
        if (!(opensType.test(line) && line.includes("{"))) continue;
        inType = true;
        depth = 0;
        buf = "";
      }
      buf += `${line}\n`;
      for (const ch of line) depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
      if (depth > 0) continue;
      inType = false;
      for (let m = member.exec(buf); m; m = member.exec(buf)) out.push(m[1] as string);
      buf = "";
    }
    return out;
  };

  it("no snake_case type member is declared outside data/dto.ts", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const path = rel(file);
      if (!/\.(ts|vue)$/.test(path) || /\/data\/(dto|mocks)\.ts$/.test(path)) continue;
      for (const name of serverShapeMembers(readFileSync(file, "utf8"))) {
        offenders.push(`${path}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
