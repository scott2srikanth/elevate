import { test, expect } from "@playwright/test";
import {
  embeddedHeightScript,
  parseEmbeddedHeight,
} from "../src/components/embeddedHeight";

test("all main menus and dialogs remain scrollable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Scroll QA");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  for (const menu of ["Today", "Practice", "Coach", "My style", "Profile"]) {
    await page.getByRole("button", { name: menu, exact: true }).click();
    const scroll = page.getByTestId("menu-scroll");
    await scroll.hover();
    await page.mouse.wheel(0, 100000);
    await expect
      .poll(() =>
        scroll.evaluate(
          (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
        ),
      )
      .toBeLessThan(3);
    await page.mouse.wheel(0, -100000);
    await expect
      .poll(() => scroll.evaluate((el) => el.scrollTop))
      .toBeLessThan(3);
  }
  await page.getByRole("button", { name: "Coach", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Use my reflections and self-checks with on-device AI Coach",
    })
    .click();
  await page.getByRole("button", { name: "More coaching tools" }).click();
  for (const section of [
    "Overview",
    "Self-check",
    "Progress",
    "Videos",
    "Weekly review",
    "Saved plans",
    "Coach memory",
    "Dining",
    "Cultural context",
    "Personal brand",
    "Coach settings",
  ]) {
    await page.getByRole("button", { name: section, exact: true }).click();
    const scroll = page.getByTestId("menu-scroll");
    await scroll.hover();
    await page.mouse.wheel(0, 100000);
    await expect
      .poll(() =>
        scroll.evaluate(
          (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
        ),
      )
      .toBeLessThan(3);
    await page.mouse.wheel(0, -100000);
    await expect
      .poll(() => scroll.evaluate((el) => el.scrollTop))
      .toBeLessThan(3);
  }
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit my profile", exact: true })
    .click();
  const dialog = page.getByTestId("dialog-scroll");
  await dialog.hover();
  await page.mouse.wheel(0, 100000);
  await expect
    .poll(() =>
      dialog.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
    )
    .toBeLessThan(3);
});

test("embedded result forms grow, shrink, and pass scrolling to the menu", async ({
  page,
}) => {
  await page.goto("/style");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Result QA");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  await page.getByRole("button", { name: "My style", exact: true }).click();
  await page.getByRole("button", { name: "Photo check", exact: true }).click();
  const checkFrame = async () => {
    const frame = page.locator("iframe");
    await expect
      .poll(() =>
        frame.evaluate((el: HTMLIFrameElement) => !!el.contentDocument?.body),
      )
      .toBe(true);
    await expect
      .poll(() =>
        frame.evaluate((el: HTMLIFrameElement) =>
          Math.abs(
            el.clientHeight -
              Math.ceil(
                el.contentDocument!.body.getBoundingClientRect().height,
              ) -
              2,
          ),
        ),
      )
      .toBeLessThan(2);
    const before = await frame.evaluate(
      (el) => el.getBoundingClientRect().height,
    );
    // Exercise asynchronous layout growth independently of model download/inference.
    await frame.evaluate((el: HTMLIFrameElement) => {
      const content = el.contentDocument!.createElement("section");
      content.id = "scroll-regression-result";
      content.style.height = "1400px";
      content.textContent = "Expanded result fixture";
      el.contentDocument!.body.append(content);
    });
    await expect
      .poll(() => frame.evaluate((el) => el.getBoundingClientRect().height))
      .toBeGreaterThan(before + 1300);
    await expect
      .poll(() =>
        frame.evaluate((el: HTMLIFrameElement) => {
          const doc = el.contentDocument!;
          return doc.documentElement.scrollHeight - el.clientHeight;
        }),
      )
      .toBeLessThan(3);
    await frame.scrollIntoViewIfNeeded();
    const bounds = await frame.boundingBox();
    await page.mouse.move(bounds!.x + 20, Math.max(180, bounds!.y + 40));
    const scroll = page.getByTestId("menu-scroll");
    const start = await scroll.evaluate((el) => el.scrollTop);
    await page.mouse.wheel(0, 450);
    await expect
      .poll(() => scroll.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(start);
    await frame.evaluate((el: HTMLIFrameElement) =>
      el.contentDocument!.getElementById("scroll-regression-result")!.remove(),
    );
    await expect
      .poll(() => frame.evaluate((el) => el.getBoundingClientRect().height))
      .toBeLessThan(before + 10);
  };
  await checkFrame();
  await page.getByRole("button", { name: "Coach", exact: true }).click();
  await page.getByRole("button", { name: "Recordings", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Use my reflections and self-checks with on-device AI Coach",
    })
    .click();
  await checkFrame();
});

test("native height bridge follows result changes and rejects invalid messages", async ({
  page,
}) => {
  await page.setContent(
    '<!doctype html><body style="margin:0;padding:18px"><div id="result" style="height:400px"></div></body>',
  );
  await page.evaluate(() => {
    (window as any).ReactNativeWebView = {
      postMessage: (value: string) => {
        (window as any).lastHeightMessage = value;
      },
    };
  });
  await page.evaluate(embeddedHeightScript("test-session"));
  const height = async () =>
    parseEmbeddedHeight(
      await page.evaluate(() => (window as any).lastHeightMessage || ""),
      "test-session",
    );
  await expect.poll(height).toBe(438);
  await page.locator("#result").evaluate((el) => {
    (el as HTMLElement).style.height = "2000px";
  });
  await expect.poll(height).toBe(2038);
  await page.locator("#result").evaluate((el) => {
    (el as HTMLElement).style.height = "200px";
  });
  await expect.poll(height).toBe(238);
  expect(
    parseEmbeddedHeight(
      '{"type":"elevate-content-height","session":"wrong","height":800}',
      "test-session",
    ),
  ).toBeNull();
  for (const value of [-1, 0, 30001, "900", null])
    expect(
      parseEmbeddedHeight(
        JSON.stringify({
          type: "elevate-content-height",
          session: "test-session",
          height: value,
        }),
        "test-session",
      ),
    ).toBeNull();
});
