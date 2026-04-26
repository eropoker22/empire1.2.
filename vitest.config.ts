import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.js"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "apps/**/*.ts",
        "packages/game-core/src/**/*.ts",
        "packages/game-config/src/**/*.ts",
        "tools/**/*.ts"
      ],
      exclude: [
        "apps/**/index.ts",
        "apps/**/bootstrap/**",
        "packages/**/src/**/*.d.ts",
        "packages/**/src/**/index.ts",
        "packages/game-core/src/contracts/**",
        "packages/game-core/src/entities/**",
        "packages/shared-types/**",
        "page-assets/**",
        "pages/**",
        "tools/debug/src/index.ts",
        "vite*.config.ts"
      ],
      thresholds: {
        lines: 45,
        statements: 45,
        functions: 45,
        branches: 40
      }
    }
  }
});
