import { test, expect } from "@playwright/test";
test("personal coaching loop survives reload, with wardrobe, occasions, and deletion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes("Unexpected text node")
    )
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("textbox", { name: "What should we call you?" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Alex");
  await page
    .getByRole("textbox", { name: "Your role or everyday context" })
    .fill("Team lead");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  await expect(page.getByText("Your next chapter, Alex.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Your next chapter, Alex.")).toBeVisible();
  await page.getByRole("button", { name: "Start today’s practice" }).click();
  await page.getByRole("button", { name: "Got it. Let’s rehearse" }).click();
  await page
    .getByRole("button", { name: "I’ve rehearsed — set my challenge" })
    .click();
  await page
    .getByRole("button", { name: "I’ll come back after trying it" })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Add my reflection" }).click();
  await page
    .getByRole("textbox", { name: "Where did you try it?" })
    .fill("Weekly team meeting");
  await page
    .getByRole("textbox", { name: "What happened? What did you notice?" })
    .fill("I paused and introduced my contribution clearly.");
  await page
    .getByRole("textbox", { name: "What would you try next time? (optional)" })
    .fill("Ask a question after my introduction.");
  await page
    .getByRole("button", { name: "Save reflection & keep growing" })
    .click();
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await page.getByRole("button", { name: "My journey", exact: true }).click();
  await expect(
    page.getByText("I paused and introduced my contribution clearly."),
  ).toBeVisible();
  await page.getByRole("button", { name: "My style", exact: true }).click();
  await page.getByRole("button", { name: "Add a wardrobe piece" }).click();
  await page
    .getByRole("textbox", { name: "Piece name", exact: true })
    .fill("White Oxford shirt");
  await page.getByRole("button", { name: "Add to my wardrobe" }).click();
  await expect(
    page.getByText("White Oxford shirt", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Prepare for an occasion" }).click();
  await page
    .getByRole("button", { name: "Business dinner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create my preparation plan" })
    .click();
  await page
    .getByRole("checkbox", { name: "Check the venue and dietary arrangements" })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "Check the venue and dietary arrangements",
    }),
  ).toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(
    page.getByRole("checkbox", {
      name: "Check the venue and dietary arrangements",
    }),
  ).toBeChecked();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-profile.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-today.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Delete my local data" }).click();
  await page
    .getByRole("button", { name: "Yes, delete all my local data" })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Begin my journey" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
