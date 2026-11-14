import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Unit tests share the application's Vite configuration (JSX, aliases, the
// bundled-example plugin). Browser tests are separate: see playwright.config.ts.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // A tool's tests sit in its folder; tests of shared code and of the
      // composed app are under tests/unit.
      include: ["src/**/*.test.{ts,tsx,js}", "tests/unit/**/*.test.{ts,tsx,js}"],
      environment: "node",
      // The Stradella search suites are CPU-bound; a failing case should not be
      // retried or left running.
      testTimeout: 60_000,
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/i18n/{es,fr,pt,it,de}.ts", "src/**/*.d.ts", "src/**/*.test.{ts,tsx}"],
        reporter: ["text-summary", "html"],
        reportsDirectory: "coverage",
      },
    },
  }),
);
