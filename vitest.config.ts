import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Unit tests share the application's Vite configuration (JSX, aliases, the
// bundled-example plugin). Browser tests are separate: see playwright.config.ts.
export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx,js}"],
    environment: "node",
    // The Stradella search suites are CPU-bound; a failing case should not be
    // retried or left running.
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/i18n/{es,fr,pt,it,de}.ts", "src/**/*.d.ts"],
      reporter: ["text-summary", "html"],
      reportsDirectory: "coverage",
    },
  },
}));
