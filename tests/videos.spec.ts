import { test, expect } from "@playwright/test";

test("video filters, single player, practice handoff and Telugu guidance", async ({
  page,
}) => {
  // Third-party streaming is deliberately mocked: exercise our UI without ads or network variability.
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Publisher player</p>",
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Coach", exact: true }).click();
  await page.getByRole("button", { name: "Videos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Watch lesson", exact: true }),
  ).toHaveCount(12);
  await expect(page.locator("iframe")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Watch lesson", exact: true })
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /eIho2S0ZahI/);
  await expect(page.locator("iframe")).toHaveAttribute(
    "referrerpolicy",
    "strict-origin-when-cross-origin",
  );
  await page
    .getByRole("button", { name: "Watch lesson", exact: true })
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveAttribute("src", /R1vskiVDwl4/);
  await page.getByRole("button", { name: "Listening", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Watch lesson", exact: true }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Watch lesson", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "My coach", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Videos", exact: true }).click();
  await page
    .getByRole("button", { name: "Watch lesson", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Go to practice", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "తెలుగు", exact: true }).click();
  await page.getByRole("button", { name: "కోచ్", exact: true }).click();
  await page.getByRole("button", { name: "వీడియోలు", exact: true }).click();
  await expect(
    page.getByText("ఇతరులు ఆసక్తిగా వినేలా మాట్లాడండి", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "పాఠం చూడండి", exact: true })
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /hl=te/);
  await page.screenshot({
    path: `test-results/${test.info().project.name}-video-library.png`,
    fullPage: true,
  });
});

test("practice shows only relevant contained session videos", async ({
  page,
}) => {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Publisher player</p>",
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Video learner");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Browse practice videos", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /Feel at ease at the table Bring attention/ })
    .click();
  await page
    .getByRole("button", { name: "Videos for this practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Watch lesson", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Watch lesson", exact: true })
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /zA2PfKRcm0g/);
  await expect(page.getByText("Video topic", { exact: true })).toHaveCount(0);
  const bounds = await page.locator("iframe").evaluate((frame) => {
    const a = frame.getBoundingClientRect();
    const b = frame.parentElement!.getBoundingClientRect();
    return {
      contained: a.left >= b.left && a.right <= b.right,
      width: a.width,
    };
  });
  expect(bounds.contained).toBe(true);
  expect(bounds.width).toBeGreaterThanOrEqual(200);
  await expect(
    page.getByRole("button", { name: "Go to practice", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Got it. Let’s rehearse" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
});
