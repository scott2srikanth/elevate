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

test("writing reveal resets seamlessly while the text only travels upward", async ({
  page,
}) => {
  await page.goto("/");
  const word = page
    .getByTestId("launch-splash")
    .getByText("Elevate", { exact: true })
    .first();
  await word.waitFor({ state: "attached" });
  const samples = await word.evaluate(async (element) => {
    const mask = element.parentElement!;
    const track = mask.parentElement!.parentElement!;
    const samples: { y: number; width: number }[] = [];
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const transform = getComputedStyle(track).transform;
        samples.push({
          y: transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42,
          width: mask.getBoundingClientRect().width,
        });
        if (samples.length >= 145) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
    return samples;
  });
  expect(samples.some((x) => x.width > 20 && x.width < 200)).toBe(true);
  let wraps = 0;
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1],
      current = samples[i];
    if (current.y > previous.y + 1) {
      expect(previous.y).toBeLessThan(-500);
      expect(current.y).toBeGreaterThan(-1);
      expect(current.width).toBeLessThan(100);
      wraps++;
    }
  }
  expect(wraps).toBeGreaterThan(0);
});

test("silent welcome video autoplays and stops when Continue is pressed", async ({
  page,
}) => {
  await page.goto("/");
  const video = page.getByTestId("welcome-video");
  await expect(video).toBeVisible();
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0.2);
  expect(
    await video.evaluate((element: HTMLVideoElement) => ({
      muted: element.muted,
      controls: element.controls,
      loop: element.loop,
      inline: element.playsInline,
    })),
  ).toEqual({ muted: true, controls: false, loop: true, inline: true });
  await page.screenshot({
    path: `test-results/${test.info().project.name}-welcome-video.png`,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(video).toHaveCount(0);
});
test("reduced motion skips the welcome video", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Elevate coaching companions" }),
  ).toBeVisible();
  await expect(page.getByTestId("welcome-video")).toHaveCount(0);
});
