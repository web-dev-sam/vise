import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Runtime + test alias resolution MIRRORS tsconfig.json `paths` so tsc, Vite,
// and Vitest agree. Slice aliases resolve ONLY to the public index.ts — a deep
// import like `@slices/billing/core/rules` matches no alias and fails to resolve,
// exactly as it does in the type checker.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@slices\/billing$/, replacement: r("./src/slices/billing/index.ts") },
      { find: /^@slices\/scheduling$/, replacement: r("./src/slices/scheduling/index.ts") },
      { find: /^@shared\//, replacement: r("./src/shared/") },
      { find: /^@app\//, replacement: r("./src/app/") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
