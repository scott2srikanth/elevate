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
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Coach", exact: true }).click();
  await page.getByRole("button", { name: "Videos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Watch lesson", exact: true }),
  ).toHaveCount(15);
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

test("practice has occasion filters, Telugu audio and relevant in-session videos", async ({
  page,
}) => {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Publisher player</p>",
    }),
  );
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Video learner");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await page
    .getByRole("button", { name: "Browse practice videos", exact: true })
    .click();
  for (const topic of [
    "Dressing & etiquette",
    "Dining & etiquette",
    "Public appearances",
    "Functions & celebrations",
    "Holiday & vacation",
  ]) {
    await page.getByRole("button", { name: topic, exact: true }).click();
    expect(
      await page
        .getByRole("button", { name: "Watch lesson", exact: true })
        .count(),
    ).toBeGreaterThan(0);
  }
  await page.getByRole("button", { name: "Telugu audio", exact: true }).click();
  await expect(
    page.getByText(
      "No videos match this topic and audio language yet. Try all audio languages or another topic.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "All videos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Watch lesson", exact: true }),
  ).toHaveCount(3);
  await page
    .getByRole("button", { name: "Watch lesson", exact: true })
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /QB0GEt_K_ZQ/);
  await page
    .getByRole("button", { name: "Browse practice videos", exact: true })
    .click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page
    .getByRole("button", { name: /Feel at ease at the table Bring attention/ })
    .click();
  await page
    .getByRole("button", { name: "Videos for this practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Watch lesson", exact: true }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Watch lesson", exact: true })
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /zA2PfKRcm0g/);
  await expect(
    page.getByRole("button", { name: "Go to practice", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Got it. Let’s rehearse" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "తెలుగు", exact: true }).click();
  await page.getByRole("button", { name: "సాధన", exact: true }).click();
  await page
    .getByRole("button", { name: "సాధన వీడియోలు చూడండి", exact: true })
    .click();
  await page
    .getByRole("button", { name: "పాఠం చూడండి", exact: true })
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /QB0GEt_K_ZQ/);
});
