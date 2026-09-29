import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 500));
});
const base = process.env.OBSERVATION_TEST_URL || "http://localhost:8788";
try {
  await page.goto(base + "/observation/index.html?session=qa");
  if (
    !(await page.locator("#offline-settings").getAttribute("open")) &&
    !(await page.locator("#offline-download").isVisible())
  )
    await page.locator("#offline-settings > summary").click();
  await page.locator("#offline-download").waitFor({ state: "visible" });
  await page.waitForFunction(
    () => !document.querySelector("#offline-download").disabled,
  );
  await page.locator("#offline-download").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("#offline-status")
        ?.textContent?.includes("Offline ready"),
    {},
    { timeout: 180000 },
  );
  await page.locator("#consent").check();
  await page
    .locator("#file")
    .setInputFiles("tests/fixtures/observation-person.jpg");
  await page.waitForFunction(
    () => !document.querySelector("#file").disabled,
    {},
    { timeout: 120000 },
  );
  console.log(
    "PHOTO",
    await page.locator("#status").innerText(),
    await page.locator("#results").innerText(),
  );
  assert.match(await page.locator("#status").innerText(), /Check complete/);
  assert.match(await page.locator("#results").innerText(), /framing:/);
  await fs.mkdir("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/observation-photo.png",
    fullPage: true,
  });
  await page
    .locator("#file")
    .setInputFiles("tests/fixtures/observation-speech.wav");
  await page.waitForFunction(
    () => !document.querySelector("#file").disabled,
    {},
    { timeout: 120000 },
  );
  console.log(
    "AUDIO",
    await page.locator("#status").innerText(),
    await page.locator("#results").innerText(),
  );
  assert.match(await page.locator("#status").innerText(), /Check complete/);
  assert.match(await page.locator("#results").innerText(), /volume:/);
  // Generated silence: confirms VAD abstains rather than treating noise level as speaking skill.
  const rate = 16000,
    length = rate * 3;
  const wav = Buffer.alloc(44 + length * 2);
  wav.write("RIFF");
  wav.writeUInt32LE(36 + length * 2, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(length * 2, 40);
  await page
    .locator("#file")
    .setInputFiles({ name: "silence.wav", mimeType: "audio/wav", buffer: wav });
  await page.waitForFunction(
    () => !document.querySelector("#file").disabled,
    {},
    { timeout: 120000 },
  );
  assert.match(await page.locator("#results").innerText(), /Not enough speech/);
  // A generated blank WebM exercises frame seeking and missing-person abstention.
  const encoded = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(10);
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const stopped = new Promise((r) => {
      recorder.onstop = r;
    });
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start();
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = "#777";
      ctx.fillRect(0, 0, 320, 240);
      await new Promise((r) => setTimeout(r, 100));
    }
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
  });
  await page.locator("#file").setInputFiles({
    name: "blank.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(encoded),
  });
  await page.waitForFunction(
    () => !document.querySelector("#file").disabled,
    {},
    { timeout: 120000 },
  );
  console.log(
    "VIDEO",
    await page.locator("#status").innerText(),
    await page.locator("#results").innerText(),
  );
  // MediaRecorder streams can have unknown duration; require graceful rejection or actual frame analysis.
  assert.match(
    await page.locator("#status").innerText(),
    /Check complete|no longer than 60 seconds/,
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("Observation model smoke tests passed.");
} finally {
  await browser.close();
}
