import { localAccount } from "./fixtures/localAccount";
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import type { ContentDocument, ContentSnapshot } from "../src/shared/content";

test("administrator JSON publication reaches an open learner, with authorization and conflict protection", async ({
  browser,
  page,
  baseURL,
}) => {
  test.setTimeout(120000);
  if (baseURL !== "http://localhost:8787")
    throw new Error("Administrator tests are local-only.");
  const email = `admin-${crypto.randomUUID()}@example.com`;
  const password = "local-admin-test-password-2026";
  const headers = { "X-Elevate-Request": "1", "CF-Connecting-IP": email };
  const anonymous = await page.request.get("/api/admin/content");
  expect(anonymous.status()).toBe(401);
  await localAccount(email, password, baseURL);
  expect(
    (
      await page.request.post("/api/auth/register", {
        headers,
        data: { email, password },
      })
    ).status(),
  ).toBe(403);
  const register = await page.request.post("/api/auth/login", {
    headers,
    data: { email, password },
  });
  expect(register.status()).toBe(200);
  expect((await page.request.get("/api/admin/content")).status()).toBe(403);
  expect(
    (
      await page.request.post("/api/admin/users", {
        headers,
        data: { email: "denied@example.com", password },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.put("/api/admin/content", {
        headers,
        data: {
          baseRevision: 0,
          document: {
            schemaVersion: 1,
            lessons: [],
            videos: [],
            languages: [],
          },
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/admin/media", {
        headers: { ...headers, "Content-Type": "video/mp4" },
        data: Buffer.from("not allowed"),
      })
    ).status(),
  ).toBe(403);
  execFileSync(
    process.execPath,
    ["scripts/admin-role.mjs", "grant", email, "--local"],
    {
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: "/tmp/elevate-admin-test-role.log",
      },
      stdio: "pipe",
    },
  );
  const original: ContentSnapshot = await (
    await page.request.get("/api/admin/content")
  ).json();
  const learnerContext = await browser.newContext();
  const learner = await learnerContext.newPage();
  try {
    await learner.clock.install();
    await learner.goto(`${baseURL}/`);
    await learner
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await learner
      .getByRole("textbox", { name: "What should we call you?" })
      .fill("Synced learner");
    await learner.getByRole("button", { name: "Begin my journey" }).click();
    await learner.getByRole("button", { name: "Profile", exact: true }).click();
    await expect(
      learner.getByRole("button", { name: "हिन्दी", exact: true }),
    ).toHaveCount(0);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Administrator workspace" }),
    ).toBeVisible();
    const learnerEmail = `learner-${crypto.randomUUID()}@example.com`;
    await page.getByLabel("User email", { exact: true }).fill(learnerEmail);
    await page.getByLabel("User password (12+ characters)").fill(password);
    await page
      .getByRole("button", { name: "Create user account", exact: true })
      .click();
    await expect(
      page.getByText(`Account created: ${learnerEmail}`),
    ).toBeVisible();
    expect(
      (
        await page.request.post("/api/admin/users", {
          headers,
          data: { email: learnerEmail, password },
        })
      ).status(),
    ).toBe(409);
    await page
      .getByRole("button", { name: "I saved the recovery code" })
      .click();
    const login = await learner.request.post("/api/auth/login", {
      headers,
      data: { email: learnerEmail, password },
    });
    expect(login.status()).toBe(200);
    expect((await learner.request.get("/api/admin/content")).status()).toBe(
      403,
    );
    expect(
      (
        await learner.request.delete("/api/account", {
          headers,
          data: { password },
        })
      ).status(),
    ).toBe(200);
    await page.getByLabel("Template type").selectOption("language");
    await page.getByLabel("Language code").fill("hi");
    await page.getByLabel("Language name").fill("हिन्दी");
    await page
      .getByRole("button", { name: "Create a JSON template", exact: true })
      .click();
    const template = JSON.parse(
      await page.getByLabel("Copy this template to ChatGPT").inputValue(),
    );
    expect(template.document.languages.at(-1).code).toBe("hi");
    expect(
      Object.keys(template.document.languages.at(-1).strings).length,
    ).toBeGreaterThan(500);
    const lesson = {
      id: "admin-test-greeting",
      title: "A thoughtful host greeting",
      area: "Etiquette" as const,
      minutes: 3,
      description: "Prepare for your next function",
      lesson: "Ask how the host likes to greet guests.",
      steps: ["Rehearse a warm greeting"],
      challenge: "Try the greeting at your next function",
    };
    const document: ContentDocument = {
      ...original.document,
      lessons: [...original.document.lessons, lesson],
      videos: [
        ...original.document.videos,
        {
          id: "admin-test-video",
          title: "Direct greeting lesson",
          author: "Test instructor",
          audio: "hi",
          topic: "Host greetings",
          lessonIds: [lesson.id],
          url: "https://www.youtube.com/watch?v=eIho2S0ZahI",
          format: "lesson",
          note: "Notice the greeting",
          practice: "Try a greeting",
        },
      ],
      languages: [
        ...original.document.languages,
        {
          code: "hi",
          name: "हिन्दी",
          strings: {
            Today: "आज",
            Practice: "अभ्यास",
            "What should we call you?": "आपका नाम क्या है?",
            "Your next chapter, {name}.": "आपका अगला अध्याय, {name}.",
          },
        },
      ],
    };
    await page.getByLabel("Upload JSON file").setInputFiles({
      name: "content.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(document)),
    });
    await expect(
      page.getByRole("heading", { name: "Review changes" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Apply to all devices", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("heading", { name: lesson.title, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Languages \(/ }).click();
    await expect(
      page.getByRole("cell", { name: "आज", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Videos \(/ }).click();
    await expect(
      page.getByRole("button", { name: "Preview video", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("checkbox", {
        name: "I reviewed the preview and any removals.",
      })
      .check();
    await page.screenshot({
      path: `test-results/${test.info().project.name}-admin-dashboard-preview.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Apply to all devices", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("published");
    const invalid = await page.request.put("/api/admin/content", {
      headers,
      data: {
        baseRevision: original.revision + 1,
        document: {
          ...document,
          videos: [{ ...document.videos.at(-1), url: "javascript:alert(1)" }],
        },
      },
    });
    expect(invalid.status()).toBe(400);
    const conflict = await page.request.put("/api/admin/content", {
      headers,
      data: { baseRevision: original.revision, document },
    });
    expect(conflict.status()).toBe(409);
    const unknown = await page.request.put("/api/admin/content", {
      headers,
      data: {
        baseRevision: original.revision + 1,
        document: {
          ...document,
          videos: [
            { ...document.videos.at(-1), lessonIds: ["does-not-exist"] },
          ],
        },
      },
    });
    expect(unknown.status()).toBe(400);
    await learner.clock.fastForward(61000);
    await expect(
      learner.getByRole("button", { name: "हिन्दी", exact: true }),
    ).toBeVisible();
    await learner.getByRole("button", { name: "हिन्दी", exact: true }).click();
    await expect(
      learner.getByRole("button", { name: "आज", exact: true }),
    ).toBeVisible();
    await learner.getByRole("button", { name: "अभ्यास", exact: true }).click();
    await expect(
      learner.getByText(lesson.title, { exact: true }),
    ).toBeVisible();
    // Failure to refresh must retain the last good configuration on reload.
    await learner.route("**/api/content", (route) => route.abort());
    await learner.reload();
    await learner
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await expect(
      learner.getByRole("button", { name: "अभ्यास", exact: true }),
    ).toBeVisible();
    await expect(
      learner.getByText(lesson.title, { exact: true }),
    ).toBeVisible();
    await learner.route("https://www.youtube-nocookie.com/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<p>Player fixture</p>",
      }),
    );
    await learner
      .getByRole("button", {
        name: /A thoughtful host greeting Prepare for your next function/,
      })
      .click();
    await learner
      .getByRole("button", { name: "Videos for this practice", exact: true })
      .click();
    await expect(
      learner.getByRole("button", { name: "Watch lesson", exact: true }),
    ).toHaveCount(1);
    await expect(learner.getByText("Video topic", { exact: true })).toHaveCount(
      0,
    );
    await learner
      .getByRole("button", { name: "Watch lesson", exact: true })
      .click();
    await expect(learner.locator("iframe")).toHaveAttribute(
      "src",
      /eIho2S0ZahI/,
    );
    // Uploaded MP4s are served as public lesson media, with byte-range support.
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from("ftypisom"),
      Buffer.alloc(16),
    ]);
    const upload = await page.request.post("/api/admin/media", {
      headers: { ...headers, "Content-Type": "video/mp4" },
      data: mp4,
    });
    expect(upload.status()).toBe(201);
    const media = await upload.json();
    const range = await learner.request.get(`${baseURL}${media.url}`, {
      headers: { Range: "bytes=0-11" },
    });
    expect(range.status()).toBe(206);
    expect((await range.body()).length).toBe(12);
    await page.screenshot({
      path: `test-results/${test.info().project.name}-administrator.png`,
      fullPage: true,
    });
  } finally {
    const latest: ContentSnapshot = await (
      await page.request.get("/api/admin/content")
    ).json();
    await page.request.put("/api/admin/content", {
      headers,
      data: { baseRevision: latest.revision, document: original.document },
    });
    await page.request.delete("/api/account", { headers });
    await learnerContext.close();
  }
});
