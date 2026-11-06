import { test, expect, openApp, openTool, type Page } from "./fixtures";

// Timing tests run in their own project, after the others have finished, so
// parallel workers do not compete for the CPU and distort the measurement.

const rows = (page: Page) => page.locator(".harmony-progression-list > li");

test("loading a preset keeps the page responsive", async ({ page }) => {
  await openApp(page);
  // Record main-thread tasks longer than 50 ms from here on.
  await page.evaluate(() => {
    (window as unknown as { longTasks: number[] }).longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) (window as unknown as { longTasks: number[] }).longTasks.push(entry.duration);
    }).observe({ type: "longtask" });
  });
  await openTool(page, "Progression Assistant");
  await page.getByRole("button", { name: "Use preset" }).click();
  await page.getByRole("button", { name: /Load preset/i }).click();
  await expect(rows(page).first()).toBeVisible();
  await page.waitForTimeout(300);
  const longest = await page.evaluate(() => Math.max(0, ...(window as unknown as { longTasks: number[] }).longTasks));
  test.info().annotations.push({ type: "longest task", description: `${Math.round(longest)} ms` });
  expect(longest, "longest main-thread task while optimizing (ms)").toBeLessThan(400);
});
