/**
 * Proves the architecture rules actually BITE. For each rule it writes a file
 * that violates exactly that rule, runs the relevant checker, and asserts a
 * non-zero exit whose output names the expected rule — then removes the file.
 *
 * A config that looks strict but silently passes is worse than no config; this
 * script is the only thing that distinguishes the two. Run: `npm run
 * verify:enforcement` (or `pnpm --filter @vise/web run verify:enforcement`).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(repoRoot, "apps", "web");
const srcDir = join(appDir, "src");

interface CheckResult {
  readonly code: number;
  readonly output: string;
}

function runIn(cwd: string, cmd: string, args: string[]): CheckResult {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  return { code: result.status ?? 1, output: `${result.stdout}${result.stderr}` };
}

const checkers = {
  depcruise: (): CheckResult =>
    runIn(appDir, "vp", ["exec", "depcruise", "src", "--config", ".dependency-cruiser.cjs"]),
  oxlint: (): CheckResult => runIn(repoRoot, "vp", ["lint"]),
  typecheck: (): CheckResult => runIn(appDir, "vp", ["exec", "vue-tsc", "--noEmit"]),
  structure: (): CheckResult =>
    runIn(appDir, "vp", ["exec", "vitest", "run", "tests/architecture.structure.test.ts"]),
} as const;

interface PlantedFile {
  readonly path: string; // relative to src/
  readonly content: string;
}

interface EnforcementCase {
  readonly rule: string;
  readonly checker: keyof typeof checkers;
  readonly expect: RegExp;
  readonly files: readonly PlantedFile[];
  readonly cleanupDirs?: readonly string[];
}

const cases: readonly EnforcementCase[] = [
  {
    rule: "core-is-framework-free (core/ importing vue)",
    checker: "depcruise",
    expect: /core-is-framework-free/,
    files: [
      {
        path: "slices/billing/core/__violation.ts",
        content: `import { ref } from "vue";\nexport const x = ref(0);\n`,
      },
    ],
  },
  {
    rule: "layers-point-down (core/ importing ../data)",
    checker: "depcruise",
    expect: /layers-point-down/,
    files: [
      {
        path: "slices/billing/core/__violation.ts",
        content: `import { fetchInvoices } from "../data/queries";\nexport const x = fetchInvoices;\n`,
      },
    ],
  },
  {
    rule: "data-not-to-ui (data/ importing ../ui)",
    checker: "depcruise",
    expect: /data-not-to-ui/,
    files: [
      {
        path: "slices/billing/data/__violation.ts",
        content: `import { useInvoiceList } from "../ui/composables/useInvoiceList";\nexport const x = useInvoiceList;\n`,
      },
    ],
  },
  {
    rule: "slice-isolation (billing/ui importing scheduling/core directly)",
    checker: "depcruise",
    expect: /slice-isolation/,
    files: [
      {
        path: "slices/billing/ui/__violation.ts",
        content: `import { findConflicts } from "../../scheduling/core/rules";\nexport const x = findConflicts;\n`,
      },
    ],
  },
  {
    rule: "dtos-stay-home (a DTO type imported from ui/)",
    checker: "depcruise",
    expect: /dtos-stay-home/,
    files: [
      {
        path: "slices/billing/ui/__violation.ts",
        content: `import type { InvoiceDto } from "../data/dto";\nexport type P = InvoiceDto;\n`,
      },
    ],
  },
  {
    rule: "shared-knows-nothing (shared/ importing a slice)",
    checker: "depcruise",
    expect: /shared-knows-nothing/,
    files: [
      {
        path: "shared/lib/__violation.ts",
        content: `import { billingRoutes } from "@slices/billing";\nexport const x = billingRoutes;\n`,
      },
    ],
  },
  {
    rule: "app-is-a-leaf (a slice importing @app)",
    checker: "depcruise",
    expect: /app-is-a-leaf/,
    files: [
      {
        path: "slices/billing/ui/__violation.ts",
        content: `import { router } from "@app/router";\nexport const x = router;\n`,
      },
    ],
  },
  {
    rule: "no-circular (mutually importing modules)",
    checker: "depcruise",
    expect: /no-circular/,
    files: [
      {
        path: "slices/billing/core/__a.ts",
        content: `import { b } from "./__b";\nexport const a = () => b;\n`,
      },
      {
        path: "slices/billing/core/__b.ts",
        content: `import { a } from "./__a";\nexport const b = () => a;\n`,
      },
    ],
  },
  {
    rule: "no-orphans (an unreachable module)",
    checker: "depcruise",
    expect: /no-orphans/,
    files: [{ path: "shared/lib/__orphan.ts", content: `export const orphan = 1;\n` }],
  },
  {
    rule: "allow-list closed set (app importing slice internals, not via index)",
    checker: "depcruise",
    expect: /not-in-allowed/,
    files: [
      {
        path: "app/__violation.ts",
        content: `import { fetchInvoices } from "../slices/billing/data/queries";\nexport const x = fetchInvoices;\n`,
      },
    ],
  },
  {
    rule: "oxlint no-restricted-imports (core/ importing vue)",
    checker: "oxlint",
    expect: /no-restricted-imports/,
    files: [
      {
        path: "slices/billing/core/__violation.ts",
        content: `import { ref } from "vue";\nexport const x = ref(0);\n`,
      },
    ],
  },
  {
    rule: "deep alias fails to typecheck (@slices/billing/core/rules)",
    checker: "typecheck",
    expect: /@slices\/billing\/core\/rules|Cannot find module/,
    files: [
      {
        path: "app/__violation.ts",
        content: `import { invoiceTotalMinor } from "@slices/billing/core/rules";\nexport const x = invoiceTotalMinor;\n`,
      },
    ],
  },
  {
    rule: "structure test (a stray slices/billing/utils/ folder)",
    checker: "structure",
    expect: /utils/,
    files: [{ path: "slices/billing/utils/__violation.ts", content: `export const junk = 1;\n` }],
    cleanupDirs: ["slices/billing/utils"],
  },
  {
    rule: "public-index-no-relaunder (a slice index re-exporting another slice)",
    checker: "depcruise",
    expect: /public-index-no-relaunder/,
    files: [
      {
        path: "slices/__relaunder__/index.ts",
        content: `export { billingRoutes } from "@slices/billing";\n`,
      },
    ],
    cleanupDirs: ["slices/__relaunder__"],
  },
  {
    rule: "core-stays-framework-free (core reaching vue via a shared/lib re-export)",
    checker: "depcruise",
    expect: /core-stays-framework-free/,
    files: [
      { path: "shared/lib/__reactive.ts", content: `export { ref } from "vue";\n` },
      {
        path: "slices/billing/core/__violation.ts",
        content: `import { ref } from "../../../shared/lib/__reactive";\nexport const x = ref;\n`,
      },
    ],
  },
  {
    rule: "computed dynamic import (import() with a non-literal specifier)",
    checker: "structure",
    expect: /non-literal specifier/,
    files: [
      {
        path: "slices/billing/ui/composables/__violation.ts",
        content:
          "export async function load(name: string) {\n  return import(`@slices/${name}`);\n}\n",
      },
    ],
  },
  {
    rule: "core purity (core/ reading the wall clock)",
    checker: "structure",
    expect: /core\/ is pure/,
    files: [
      {
        path: "slices/billing/core/__violation.ts",
        content: `export const stamp = () => new Date().toISOString();\n`,
      },
    ],
  },
  {
    rule: "store outside data/ (a Pinia store in app/providers)",
    checker: "structure",
    expect: /defineStore/,
    files: [
      {
        path: "app/providers/__violation.ts",
        content: `import { defineStore } from "pinia";\nexport const useX = defineStore("x", () => ({}));\n`,
      },
    ],
  },
  {
    rule: "server shape outside dto.ts (inline snake_case type in data/)",
    checker: "structure",
    expect: /snake_case type member/,
    files: [
      {
        path: "slices/billing/data/__violation.ts",
        content: `export interface RawThing {\n  thing_id: string;\n  created_at: string;\n}\nexport const raw: RawThing = { thing_id: "1", created_at: "z" };\n`,
      },
    ],
  },
];

function plant(files: readonly PlantedFile[]): void {
  for (const file of files) {
    const full = join(srcDir, file.path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, file.content);
  }
}

function cleanup(kase: EnforcementCase): void {
  for (const file of kase.files) rmSync(join(srcDir, file.path), { force: true });
  for (const dir of kase.cleanupDirs ?? [])
    rmSync(join(srcDir, dir), { recursive: true, force: true });
}

let failures = 0;
console.log(`Verifying ${cases.length} enforcement rules bite…\n`);

for (const kase of cases) {
  let result: CheckResult = { code: 0, output: "" };
  try {
    plant(kase.files);
    result = checkers[kase.checker]();
  } finally {
    cleanup(kase);
  }

  const bit = result.code !== 0 && kase.expect.test(result.output);
  if (bit) {
    console.log(`  ✓ ${kase.rule}  [${kase.checker}]`);
  } else {
    failures += 1;
    console.error(
      `  ✗ ${kase.rule}  [${kase.checker}] — expected a non-zero exit naming ${kase.expect}`,
    );
    console.error(
      `      exit=${result.code}; output tail:\n${result.output
        .split("\n")
        .slice(-8)
        .map((l) => `      | ${l}`)
        .join("\n")}`,
    );
  }
}

console.log("");
if (failures > 0) {
  console.error(
    `FAIL: ${failures}/${cases.length} rules did not bite. A silent rule is worse than no rule.`,
  );
  process.exit(1);
}
console.log(`PASS: all ${cases.length} rules bit their planted violation.`);
