import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("multilingual splash scrolls names and waits for Continue", async ({
  page,
}) => {
  await page.goto("/");
  const splash = page.getByTestId("launch-splash");
  await expect(splash).toBeVisible();
  for (const name of ["Elevate", "एलिवेट", "ఎలివేట్", "எலிவேட்", "എലിവേറ്റ്"]) {
    await expect(
      splash.getByText(name, { exact: true }).first(),
    ).toBeAttached();
  }
  const english = splash.getByText("Elevate", { exact: true }).first();
  const original = await english.boundingBox();
  await expect
    .poll(async () => (await english.boundingBox())!.y)
    .toBeLessThan(original!.y - 60);
  await expect(splash).toBeVisible();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-multilingual-splash.png`,
  });
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(splash).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "What should we call you?" }),
  ).toBeVisible();
});
test("reduced motion shows static multilingual branding", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByText("एलिवेट · ఎలివేట్ · எலிவேட் · എലിവേറ്റ്", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByTestId("launch-splash")).toHaveCount(0);
});
