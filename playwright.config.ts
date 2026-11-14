import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests for Accordion-Tools. They run against the production build
 * served by `vite preview`, so they see the same files as GitHub Pages.
 *
 * One-time setup: `npx playwright install chromium`. Then: `npm run test:e2e`.
 * PLAYWRIGHT_CHROMIUM_PATH can point at an installed Chrome instead.
 */
const PORT = 4321;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  // Text snapshots (export-snapshots.spec.ts) are the same on every system,
  // so their files carry no platform or project suffix.
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFileName}/{arg}{ext}",
  use: {
    baseURL: `http://localhost:${PORT}/Accordion-Tools/`,
    trace: "retain-on-failure",
    launchOptions: { executablePath, args: ["--autoplay-policy=no-user-gesture-required"] },
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /performance\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "phone",
      // Exported files do not depend on the screen; desktop checks them.
      testIgnore: /(performance|export-snapshots)\.spec\.ts/,
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    // Runs alone once the other projects are done, so timings are not inflated
    // by parallel workers.
    {
      name: "performance",
      testMatch: /performance\.spec\.ts/,
      dependencies: ["desktop", "phone"],
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/Accordion-Tools/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
