// Scaffolding generators for the vise architecture (run by the "new slice" /
// "new file" VS Code tasks, or `pnpm exec plop <slice|file>`).
//
//   slice  — a full vertical slice: core/ data/ ui/ + routes.ts + index.ts,
//            registered in architecture.config.ts and wired into the app router
//            and MSW bootstrap. Passes every architecture check out of the box.
//   file   — walks the constitution's "helper questions" to land one new file at
//            the right coordinate (slice + layer). Templates carry a real import
//            edge so a fresh file is never an orphan; wire it in where you use it.
//
// Everything the architecture enforces is baked into the templates: core is
// framework-free and pure, DTOs stay in data/, cross-slice access is via the
// public index.ts, and shared/ stays domain-free.
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const slicesDir = join(repoRoot, "apps", "web", "src", "slices");

const existingSlices = () =>
  readdirSync(slicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

// ---------------------------------------------------------------------------
// slice templates
// ---------------------------------------------------------------------------
const SLICE_CORE_TYPES = `/**
 * {{pascalCase name}} domain entities. Framework-free and pure: no vue, no fetch,
 * no clock. If you deleted Vue tomorrow this file still compiles.
 */

export interface {{pascalCase name}} {
  readonly id: string;
}

/** A read model projected from {{pascalCase name}} for lists and overviews. */
export interface {{pascalCase name}}Summary {
  readonly id: string;
}
`;

const SLICE_CORE_RULES = `import type { {{pascalCase name}}, {{pascalCase name}}Summary } from "./types";

/**
 * Project a {{pascalCase name}} down to its list/overview read model. Pure: any
 * \`now\`/\`today\` is passed in, never read from the ambient clock.
 */
export function summarize{{pascalCase name}}(entity: {{pascalCase name}}): {{pascalCase name}}Summary {
  return { id: entity.id };
}
`;

const SLICE_DATA_DTO = `import { z } from "zod";

/**
 * SERVER SHAPE for {{pascalCase name}}. Snake_case keys and wire formats live here
 * and are translated to core entities in mappers.ts — a DTO never leaves data/.
 */
export const {{camelCase name}}DtoSchema = z.object({
  id: z.string(),
});

export type {{pascalCase name}}Dto = z.infer<typeof {{camelCase name}}DtoSchema>;
`;

const SLICE_DATA_MAPPERS = `import type { {{pascalCase name}} } from "../core/types";
import type { {{pascalCase name}}Dto } from "./dto";

/** Translate the server DTO into the core entity. DTOs never leave data/. */
export function to{{pascalCase name}}(dto: {{pascalCase name}}Dto): {{pascalCase name}} {
  return { id: dto.id };
}
`;

const SLICE_DATA_QUERIES = `import { z } from "zod";
import { httpTransport } from "@shared/http/transport";
import { summarize{{pascalCase name}} } from "../core/rules";
import type { {{pascalCase name}}Summary } from "../core/types";
import { {{camelCase name}}DtoSchema } from "./dto";
import { to{{pascalCase name}} } from "./mappers";

// Real fetch → zod validation → mapper → pure core rule. The data layer is the
// IO choke point: DTOs are validated and mapped before anything else sees them.
export async function fetch{{pascalCase name}}List(): Promise<{{pascalCase name}}Summary[]> {
  const raw = await httpTransport.get<unknown>("/api/{{kebabCase name}}");
  return z
    .array({{camelCase name}}DtoSchema)
    .parse(raw)
    .map((dto) => summarize{{pascalCase name}}(to{{pascalCase name}}(dto)));
}
`;

const SLICE_DATA_MOCKS = `import { http, HttpResponse } from "msw";
import type { {{pascalCase name}}Dto } from "./dto";

// Seed data in SERVER shape. Swap in realistic fixtures as the slice grows.
const {{camelCase name}}Seed: {{pascalCase name}}Dto[] = [{ id: "{{kebabCase name}}-1" }];

export const {{camelCase name}}MockHandlers = [
  http.get("/api/{{kebabCase name}}", () => HttpResponse.json({{camelCase name}}Seed)),
];
`;

const SLICE_UI_VIEW = `<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { {{pascalCase name}}Summary } from "../../core/types";
import { fetch{{pascalCase name}}List } from "../../data/queries";

const items = ref<{{pascalCase name}}Summary[]>([]);

onMounted(async () => {
  items.value = await fetch{{pascalCase name}}List();
});
</script>

<template>
  <section class="p-4">
    <h1 class="text-xl font-semibold">{{pascalCase name}}</h1>
    <ul>
      <li v-for="item in items" :key="item.id" v-text="item.id" />
    </ul>
  </section>
</template>
`;

const SLICE_ROUTES = `import type { RouteRecordRaw } from "vue-router";

/** This slice owns its route paths; the app router only concatenates them. */
export const {{camelCase name}}Routes: RouteRecordRaw[] = [
  {
    path: "/{{kebabCase name}}",
    name: "{{kebabCase name}}",
    component: () => import("./ui/views/{{pascalCase name}}View.vue"),
  },
];
`;

const SLICE_INDEX = `/**
 * THE ONLY public surface of the {{kebabCase name}} slice. Everything else under
 * {{kebabCase name}}/ is private — deep imports do not resolve, by design. Keep
 * this surface tiny and deliberate.
 */
export { {{camelCase name}}Routes } from "./routes";

export type { {{pascalCase name}}, {{pascalCase name}}Summary } from "./core/types";

// Read model for cross-slice + app-level use.
export { fetch{{pascalCase name}}List } from "./data/queries";

// Mock API for this slice, composed by the app's MSW bootstrap.
export { {{camelCase name}}MockHandlers } from "./data/mocks";
`;

// ---------------------------------------------------------------------------
// single-file templates ("new file")
// ---------------------------------------------------------------------------
const CORE_FILE = `import { ok } from "@shared/lib/result";
import type { Result } from "@shared/lib/result";

/**
 * A pure {{camelCase name}} rule. Core is framework-free and deterministic: pass
 * inputs (and \`now\`/\`today\` when needed) in, and return a value or a Result —
 * never read the clock, fetch, or reach the framework.
 */
export function {{camelCase name}}(value: number): Result<number> {
  return ok(value);
}
`;

const DATA_FILE = `import { z } from "zod";
import { httpTransport } from "@shared/http/transport";

// data/ is the IO choke point: validate the server response before it travels
// on. Map the parsed DTO to a core entity (see mappers.ts) before returning it.
const {{camelCase name}}Schema = z.object({ id: z.string() });

export async function {{camelCase name}}(): Promise<{ readonly id: string }> {
  const raw = await httpTransport.get<unknown>("/api/{{kebabCase name}}");
  return {{camelCase name}}Schema.parse(raw);
}
`;

const UI_VIEW = `<script setup lang="ts">
import { ref } from "vue";

// Scaffolded view. Replace this local state with a composable from
// ui/composables that reads models from data/ and rules from core/.
const title = ref("{{pascalCase name}}");
</script>

<template>
  <section class="p-4">
    <h1 class="text-xl font-semibold" v-text="title" />
  </section>
</template>
`;

const UI_COMPONENT = `<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ label: string }>();
const text = computed(() => props.label);
</script>

<template>
  <span v-text="text" />
</template>
`;

const UI_COMPOSABLE = `import { ref } from "vue";
import type { Ref } from "vue";

export interface {{pascalCase name}}State {
  readonly loading: Ref<boolean>;
}

/**
 * View state for the {{camelCase name}} flow. Inject \`now\`/inputs at this UI
 * boundary and call core rules + data queries from here.
 */
export function use{{pascalCase name}}(): {{pascalCase name}}State {
  const loading = ref(false);
  return { loading };
}
`;

const SHARED_UI_VUE = `<script setup lang="ts">
import { computed } from "vue";

// A generic, domain-free widget. No slice nouns here — shared/ stays domain-free.
const props = defineProps<{ label?: string }>();
const text = computed(() => props.label ?? "");
</script>

<template>
  <span v-text="text" />
</template>
`;

const SHARED_UI_INDEX = `export { default as {{pascalCase name}} } from "./{{pascalCase name}}.vue";
`;

const SHARED_LIB = `/**
 * A domain-free helper. No slice nouns may appear here (shared/ is domain-free):
 * this formats/transforms primitive values and nothing more.
 */
export function {{camelCase name}}(value: string): string {
  return value;
}
`;

const WIRE_REMINDER = () =>
  "Next: import the new module where you use it — the no-orphans check flags files nothing references yet.";

export default function (plop) {
  // =========================================================================
  // new slice
  // =========================================================================
  plop.setGenerator("slice", {
    description:
      "Scaffold a vertical slice (core/ data/ ui/ + routes.ts + index.ts), register it in architecture.config.ts, and wire it into the app router + MSW.",
    prompts: [
      {
        type: "input",
        name: "name",
        message: 'Slice name — one business capability, kebab-case (e.g. "reporting"):',
        validate: (value) => {
          const name = String(value).trim();
          if (!/^[a-z][a-z0-9-]*$/.test(name)) {
            return "Use a lowercase kebab-case name (letters, digits, dashes; start with a letter).";
          }
          if (existingSlices().includes(name)) return `Slice "${name}" already exists.`;
          return true;
        },
      },
    ],
    actions: () => [
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/core/types.ts",
        template: SLICE_CORE_TYPES,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/core/rules.ts",
        template: SLICE_CORE_RULES,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/data/dto.ts",
        template: SLICE_DATA_DTO,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/data/mappers.ts",
        template: SLICE_DATA_MAPPERS,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/data/queries.ts",
        template: SLICE_DATA_QUERIES,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/data/mocks.ts",
        template: SLICE_DATA_MOCKS,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/ui/views/{{pascalCase name}}View.vue",
        template: SLICE_UI_VIEW,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/routes.ts",
        template: SLICE_ROUTES,
      },
      {
        type: "add",
        path: "apps/web/src/slices/{{kebabCase name}}/index.ts",
        template: SLICE_INDEX,
      },
      {
        type: "modify",
        path: "architecture.config.ts",
        pattern: /(export const slices = \[)([^\]]*)(\] as const;)/,
        template: '$1$2, "{{kebabCase name}}"$3',
      },
      {
        type: "modify",
        path: "apps/web/src/app/router/index.ts",
        pattern: /(import type \{ RouteRecordRaw \} from "vue-router";\n)/,
        template: '$1import { {{camelCase name}}Routes } from "@slices/{{kebabCase name}}";\n',
      },
      {
        type: "modify",
        path: "apps/web/src/app/router/index.ts",
        pattern: /(\n)(\];\n\nexport const router = createRouter)/,
        template: "$1  ...{{camelCase name}}Routes,\n$2",
      },
      {
        type: "modify",
        path: "apps/web/src/app/providers/msw.ts",
        pattern: /(import \{ setupWorker \} from "msw\/browser";\n)/,
        template:
          '$1import { {{camelCase name}}MockHandlers } from "@slices/{{kebabCase name}}";\n',
      },
      {
        type: "modify",
        path: "apps/web/src/app/providers/msw.ts",
        pattern: /(setupWorker\([^)]*)\)/,
        template: "$1, ...{{camelCase name}}MockHandlers)",
      },
    ],
  });

  // =========================================================================
  // new file (asks the helper questions)
  // =========================================================================
  plop.setGenerator("file", {
    description:
      "Add one file, routed to the right slice + layer by the constitution's helper questions.",
    prompts: [
      {
        type: "list",
        name: "scope",
        message:
          "What business reason would make this change? Pick the slice (or shared for a domain-free primitive):",
        choices: [...existingSlices(), "shared"],
      },
      {
        type: "confirm",
        name: "deleteVue",
        message:
          "Would this still make sense if you deleted Vue tomorrow? (pure logic/rules → core/)",
        default: false,
        when: (answers) => answers.scope !== "shared",
      },
      {
        type: "confirm",
        name: "talksToServer",
        message: "Does this know how to talk to the server? (fetch / DTOs → data/)",
        default: false,
        when: (answers) => answers.scope !== "shared" && !answers.deleteVue,
      },
      {
        type: "list",
        name: "uiKind",
        message: "Which UI artifact? (slices/<slice>/ui)",
        choices: ["view", "component", "composable"],
        when: (answers) =>
          answers.scope !== "shared" && !answers.deleteVue && !answers.talksToServer,
      },
      {
        type: "list",
        name: "sharedKind",
        message: "Generic + domain-free: a UI widget or a pure lib helper?",
        choices: ["ui", "lib"],
        when: (answers) => answers.scope === "shared",
      },
      {
        type: "input",
        name: "name",
        message: "Name (PascalCase for views/components, camelCase for rules/helpers):",
        validate: (value) => (String(value).trim() ? true : "A name is required."),
      },
    ],
    actions: (answers) => {
      if (answers.scope === "shared") {
        if (answers.sharedKind === "ui") {
          return [
            {
              type: "add",
              path: "apps/web/src/shared/ui/{{kebabCase name}}/{{pascalCase name}}.vue",
              template: SHARED_UI_VUE,
            },
            {
              type: "add",
              path: "apps/web/src/shared/ui/{{kebabCase name}}/index.ts",
              template: SHARED_UI_INDEX,
            },
            WIRE_REMINDER,
          ];
        }
        return [
          {
            type: "add",
            path: "apps/web/src/shared/lib/{{camelCase name}}.ts",
            template: SHARED_LIB,
          },
          WIRE_REMINDER,
        ];
      }

      const base = `apps/web/src/slices/${answers.scope}`;
      if (answers.deleteVue) {
        return [
          { type: "add", path: `${base}/core/{{camelCase name}}.ts`, template: CORE_FILE },
          WIRE_REMINDER,
        ];
      }
      if (answers.talksToServer) {
        return [
          { type: "add", path: `${base}/data/{{camelCase name}}.ts`, template: DATA_FILE },
          WIRE_REMINDER,
        ];
      }
      if (answers.uiKind === "view") {
        return [
          { type: "add", path: `${base}/ui/views/{{pascalCase name}}View.vue`, template: UI_VIEW },
          WIRE_REMINDER,
        ];
      }
      if (answers.uiKind === "component") {
        return [
          {
            type: "add",
            path: `${base}/ui/components/{{pascalCase name}}.vue`,
            template: UI_COMPONENT,
          },
          WIRE_REMINDER,
        ];
      }
      return [
        {
          type: "add",
          path: `${base}/ui/composables/use{{pascalCase name}}.ts`,
          template: UI_COMPOSABLE,
        },
        WIRE_REMINDER,
      ];
    },
  });
}
