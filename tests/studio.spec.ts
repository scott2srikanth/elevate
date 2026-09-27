import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { exampleAnalysis } from "./fixtures/analysis";
test("manual ChatGPT exchange works without an account and saves visual analysis", async ({
  page,
}) => {
  const aiRequests: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/(coach|analyze|media)/.test(r.url())) aiRequests.push(r.url());
  });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/coach");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  for (const [tab, kind] of [
    ["Weekly review", "weekly"],
    ["My coach", "coach"],
    ["Photo & voice", "media"],
  ] as const) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    if (kind === "coach")
      await page
        .getByRole("textbox", { name: "What would you like help with?" })
        .fill("Help me introduce myself.");
    if (kind === "media")
      await page
        .getByRole("textbox", {
          name: "Transcript or spoken script (optional)",
        })
        .fill("Hello, I lead research.");
    await page
      .getByRole("button", { name: "Generate JSON for ChatGPT", exact: true })
      .click();
    const packet = JSON.parse(
      await page
        .getByRole("textbox", { name: "JSON to paste into ChatGPT" })
        .inputValue(),
    );
    await page.getByRole("button", { name: "Copy JSON", exact: true }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(JSON.parse(copied).kind).toBe(kind);
    expect(packet.kind).toBe(kind);
    expect(packet.response_schema.properties.charts).toBeTruthy();
    const incoming = page.getByRole("textbox", {
      name: "Paste ChatGPT response JSON",
    });
    await incoming.fill("not json");
    await page
      .getByRole("button", { name: "Preview analysis", exact: true })
      .click();
    await expect(
      page.getByText(/This is not valid JSON/).filter({ visible: true }),
    ).toBeVisible();
    await incoming.fill(
      JSON.stringify(exampleAnalysis(kind === "weekly" ? "coach" : "weekly")),
    );
    await page
      .getByRole("button", { name: "Preview analysis", exact: true })
      .click();
    await expect(
      page.getByText(/This response belongs to/).filter({ visible: true }),
    ).toBeVisible();
    await incoming.fill(
      "```json\n" + JSON.stringify(exampleAnalysis(kind)) + "\n```",
    );
    await page
      .getByRole("button", { name: "Preview analysis", exact: true })
      .click();
    await expect(
      page.getByText("PREVIEW · NOT SAVED YET").filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Your suggested practice rhythm", { exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Reported confidence over time", { exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Create space to speak", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Save analysis to my history", exact: true })
      .click();
    await expect(
      page.getByText(/Analysis saved/).filter({ visible: true }),
    ).toBeVisible();
  }
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Photo & voice", exact: true })
    .click();
  await expect(
    page
      .getByText("Make space for your next sentence", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    report.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page
    .getByText("Your suggested practice rhythm", { exact: true })
    .filter({ visible: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-studio-analysis.png`,
  });
  await page
    .getByText("Reported confidence over time", { exact: true })
    .filter({ visible: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-studio-trend.png`,
  });
  await page
    .getByText("See it. Try it. Make it yours.", { exact: true })
    .filter({ visible: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-studio-guides.png`,
  });
  await page
    .getByRole("button", { name: "More coaching tools", exact: true })
    .click();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page
      .getByText("Make space for your next sentence", { exact: true })
      .filter({ visible: true }),
  ).toHaveCount(3);
  const remove = page.getByRole("button", { name: /Delete feedback/ });
  await remove.first().click();
  await expect(remove).toHaveCount(2);
  expect(aiRequests).toEqual([]);
});
