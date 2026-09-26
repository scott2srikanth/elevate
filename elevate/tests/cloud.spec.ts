import { exampleAnalysis } from "./fixtures/analysis";
import { test, expect } from "@playwright/test";
test("cloud account backs up coaching and restores it on a second device", async ({
  page,
  browser,
}) => {
  const email = `ui-${test.info().project.name}-${Date.now()}@example.com`,
    password = "test-cloud-password-2026";
  await page.goto("/");
  await page.getByRole("button", { name: "Create my personal plan" }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Morgan");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page
    .getByRole("textbox", { name: "Password (12+ characters)", exact: true })
    .fill(password);
  await page
    .getByRole("button", { name: "Create cloud account", exact: true })
    .click();
  await expect(
    page.getByText("Save this recovery code now. It is only shown once."),
  ).toBeVisible();
  await page.getByRole("button", { name: "I saved my recovery code" }).click();
  await page
    .getByRole("button", { name: "Back up this device to cloud" })
    .click();
  await page.getByRole("button", { name: "Confirm sync direction" }).click();
  await expect(
    page.getByText("Connected. Changes save automatically to D1."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Coach", exact: true }).click();
  await page
    .getByRole("textbox", { name: "One win this week" })
    .fill("I introduced myself clearly.");
  await page
    .getByRole("textbox", { name: "What got in the way?" })
    .fill("I rushed the ending.");
  await page
    .getByRole("textbox", { name: "My next small commitment" })
    .fill("Pause before my final point.");
  await page.getByRole("button", { name: "Save weekly review" }).click();
  await expect(
    page.getByText(
      "Review saved. Your chosen focus will guide your next practices.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "My coach", exact: true }).click();
  await page
    .getByRole("textbox", { name: "A useful fact or preference" })
    .fill("I prefer short, seated exercises.");
  await page.getByRole("button", { name: "Save to coach memory" }).click();
  await page
    .getByRole("textbox", { name: "Paste ChatGPT response JSON" })
    .fill(JSON.stringify(exampleAnalysis("coach")));
  await page
    .getByRole("button", { name: "Preview analysis", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save analysis to my history" })
    .click();

  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page.getByText("Saved to D1", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Cloud sync resumed.", { exact: true }),
  ).toBeVisible();
  const raw = await page.evaluate(() =>
    localStorage.getItem("elevate.personal-coach.v1"),
  );
  expect(raw).not.toContain("Morgan");
  expect(JSON.parse(raw!).encrypted).toBe(1);
  const second = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const other = await second.newPage();
  await other.goto("http://localhost:8787/profile");
  await other.getByRole("textbox", { name: "Email address" }).fill(email);
  await other
    .getByRole("textbox", { name: "Password (12+ characters)", exact: true })
    .fill(password);
  await other.getByRole("button", { name: "Sign in to cloud" }).click();
  await other.getByRole("button", { name: "Restore cloud profile" }).click();
  await other.getByRole("button", { name: "Confirm sync direction" }).click();
  await expect(other.getByText("Morgan", { exact: true })).toBeVisible();
  await other.getByRole("button", { name: "Coach", exact: true }).click();
  await expect(
    other.getByText("Win: I introduced myself clearly."),
  ).toBeVisible();
  await other.getByRole("button", { name: "My coach", exact: true }).click();
  await expect(
    other.getByText("I prefer short, seated exercises.", { exact: true }),
  ).toBeVisible();
  await other
    .getByRole("textbox", { name: "What would you like help with?" })
    .fill("Help me speak with clarity.");
  await other
    .getByRole("button", { name: "Generate JSON for ChatGPT" })
    .click();
  const packet = JSON.parse(
    await other
      .getByRole("textbox", { name: "JSON to paste into ChatGPT" })
      .inputValue(),
  );
  expect(packet.kind).toBe("coach");
  expect(packet.context.previousAnalysis[0].summary).toBe(
    exampleAnalysis("coach").summary,
  );
  await expect(
    other.getByText("Make space for your next sentence", { exact: true }),
  ).toBeVisible();
  expect(packet.context.approvedMemories).toContain(
    "I prefer short, seated exercises.",
  );
  await other
    .getByRole("button", { name: "More coaching tools", exact: true })
    .click();
  await other.getByRole("button", { name: "Dining", exact: true }).click();
  await other
    .getByRole("button", { name: "Look to the host and wait for a cue" })
    .click();
  await expect(other.getByText(/A thoughtful choice/)).toBeVisible();
  await other
    .getByRole("button", { name: "Personal brand", exact: true })
    .click();
  await other.getByRole("textbox", { name: "Who do you help?" }).fill("teams");
  await other
    .getByRole("textbox", { name: "Your expertise", exact: true })
    .fill("research");
  await other
    .getByRole("textbox", { name: "The outcome you help create" })
    .fill("build useful products");
  await other.getByRole("button", { name: "Build my brand statement" }).click();
  await expect(
    other.getByText(
      "Morgan helps teams build useful products through research.",
      { exact: true },
    ),
  ).toBeVisible();
  await other.screenshot({
    path: `test-results/${test.info().project.name}-coach-studio.png`,
    fullPage: true,
  });
  await other.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(other.getByText("Saved to D1", { exact: true })).toBeVisible();
  await other
    .getByRole("checkbox", {
      name: "I want to permanently delete my cloud account and all uploaded media",
    })
    .click();
  await other
    .getByRole("textbox", { name: "Current password to confirm deletion" })
    .fill(password);
  await other
    .getByRole("button", { name: "Permanently delete cloud account" })
    .click();
  await expect(
    other.getByText("Account and private media deleted."),
  ).toBeVisible();
  await second.close();
});
