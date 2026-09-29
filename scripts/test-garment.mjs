import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const uploads = [],
  errors = [];
page.on("request", (r) => {
  if (r.method() === "POST" && /\/api\/(media|analyze|coach)/.test(r.url()))
    uploads.push(r.url());
});
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.GARMENT_TEST_URL || "http://localhost:8790";
try {
  await page.goto(base + "/style");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Garment QA");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  await page.getByRole("button", { name: "My style", exact: true }).click();
  await page.getByRole("button", { name: "Photo check", exact: true }).click();
  let frame = page.frameLocator('iframe[title="On-device garment analysis"]');
  await frame.locator("#offline-download").waitFor({ state: "visible" });
  await frame.locator("#offline-download").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('iframe[title="On-device garment analysis"]')
        ?.contentWindow?.location.pathname.includes("/offline/"),
    {},
    { timeout: 180000 },
  );
  await frame.locator("#consent").check();
  await frame
    .locator("#file")
    .setInputFiles(
      process.env.GARMENT_TEST_IMAGE || "/tmp/elevate-fashion/dress.jpg",
    );
  await frame.locator("#review").waitFor({ state: "visible", timeout: 120000 });
  await page.waitForFunction(() => {
    const frame = document.querySelector(
      'iframe[title="On-device garment analysis"]',
    );
    return (
      frame?.contentDocument?.documentElement.scrollHeight <=
      frame.clientHeight + 2
    );
  });
  await frame.locator("#save").scrollIntoViewIfNeeded();
  const saveBounds = await frame.locator("#save").boundingBox();
  assert.ok(
    saveBounds && saveBounds.y >= 0 && saveBounds.y + saveBounds.height <= 844,
    "Generated-result save control must be reachable in the mobile viewport",
  );
  console.log(
    "INFERENCE",
    await frame.locator("#prediction").innerText(),
    "COLOUR",
    await frame.locator("#color").inputValue(),
  );
  await frame.locator("#piece-name").fill("My reviewed dress");
  await frame.locator("#category").selectOption("Dresses");
  await frame.locator("#color").fill("Black");
  await frame.locator("#formality").selectOption("Smart");
  await frame.locator("#confirmed").check();
  await frame.locator("#save").click();
  await frame.getByText(/Added to your wardrobe/).waitFor();
  await page.getByRole("button", { name: "Outfits", exact: true }).click();
  await page.getByText("My reviewed dress", { exact: false }).last().waitFor();
  assert.match(
    await page.getByText(/Selected from pieces you own/).innerText(),
    /reviewed/,
  );
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByText("My reviewed dress", { exact: false }).last().waitFor();
  await page.getByRole("button", { name: "Photo check", exact: true }).click();
  frame = page.frameLocator('iframe[title="On-device garment analysis"]');
  await frame.locator("#consent").check();
  await frame
    .locator("#file")
    .setInputFiles(
      process.env.GARMENT_TEST_IMAGE || "/tmp/elevate-fashion/dress.jpg",
    );
  await frame.locator("#review").waitFor({ state: "visible", timeout: 120000 });
  console.log("OFFLINE", await frame.locator("#prediction").innerText());
  assert.equal(uploads.length, 0);
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: "/tmp/elevate-fashion/mobile-verified.png",
    fullPage: true,
  });
  console.log(
    "PASS: inference, reviewed save, outfit connection, offline reload/inference, no photo uploads",
  );
} finally {
  await browser.close();
}
