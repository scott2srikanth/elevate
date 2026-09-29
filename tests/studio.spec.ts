import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("on-device AI Coach replaces JSON exchange and persists self-checks", async ({
  page,
}) => {
  const aiRequests: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/(coach|analyze|media)/.test(r.url())) aiRequests.push(r.url());
  });
  await page.goto("/coach");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Alex");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  await page.getByRole("button", { name: "Coach", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Generate JSON for ChatGPT" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Paste ChatGPT response JSON" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("AI coaching studio", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", {
      name: "Use my reflections and self-checks with on-device AI Coach",
    })
    .click();
  await page.getByRole("button", { name: "Self-check", exact: true }).click();
  await page
    .getByRole("button", { name: "Observation quality: 5/5", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Comfortable posture: 5/5", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Introduction prepared: 1/5", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Listening practice: 5/5", exact: true })
    .click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(
    page.getByText(/Your current self-check suggests this practice/).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save coaching plan", exact: true })
    .click();
  await expect(page.getByText(/Last saved/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Self-check", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Introduction prepared: 1/5",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Start recommended practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Got it. Let’s rehearse/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    report.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  expect(aiRequests).toEqual([]);
});
