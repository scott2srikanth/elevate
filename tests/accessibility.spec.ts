import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("main mobile and desktop screens have no serious accessibility violations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("button", { name: "Create my personal plan" }),
  ).toBeVisible();
  for (const tab of ["Today", "Practice", "Coach", "Profile"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      report.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact || ""),
      ),
    ).toEqual([]);
  }
});

test("illustrations and grouped navigation work on mobile and desktop", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Close dialog" }).click();
  const companions = page.getByRole("button", {
    name: "Greet your coaching companions",
  });
  await companions.scrollIntoViewIfNeeded();
  await expect(companions.locator("img")).toBeVisible();
  await expect
    .poll(() =>
      companions
        .locator("img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await companions.click();
  await expect(page.getByText("One small step. We’re with you.")).toBeVisible();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-illustration.png`,
  });
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(
    page.getByRole("img", {
      name: "Professionals practicing a relaxed conversation together",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-practice.png`,
  });
  await page.getByRole("button", { name: "My journey", exact: true }).click();
  await expect(page).toHaveURL(/\/journey$/);
  await page.reload();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("button", { name: "My journey", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Exercise library", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practice$/);
});
