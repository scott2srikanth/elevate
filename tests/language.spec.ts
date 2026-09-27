import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Telugu onboarding, coaching, export language and profile language persist", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("launch-splash")).toBeVisible();
  await page.getByRole("button", { name: "తెలుగు", exact: true }).click();
  await expect(page.getByText("మీ ప్రయాణం మీతోనే మొదలవుతుంది.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "నా ప్రయాణం ప్రారంభించండి" }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "మిమ్మల్ని ఏ పేరుతో పిలవాలి?" })
    .fill("అనన్య");
  await page
    .getByRole("textbox", {
      name: "మీ వృత్తి లేదా రోజువారీ పాత్ర",
      exact: true,
    })
    .fill("ఉపాధ్యాయురాలు");
  await page.getByRole("button", { name: "నా ప్రయాణం ప్రారంభించండి" }).click();
  await expect(page.getByText("అనన్య, మీ కొత్త ప్రయాణం.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("అనన్య, మీ కొత్త ప్రయాణం.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Begin my journey" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "ఈ రోజు సాధన ప్రారంభించండి" }).click();
  await expect(
    page.getByText("మీలా అనిపించే స్వీయ పరిచయం").last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "అర్థమైంది. సాధన చేద్దాం" }).click();
  await expect(
    page.getByText("మీ పని, అది ఎవరికి ఉపయోగపడుతుందో ఒక వాక్యంలో రాయండి."),
  ).toBeVisible();
  await page.getByRole("button", { name: "మూసివేయండి" }).click();
  await page.getByRole("button", { name: "కోచ్", exact: true }).click();
  await page.getByRole("button", { name: "నా కోచ్", exact: true }).click();
  await page
    .getByRole("textbox", { name: "మీకు ఏ విషయంలో సహాయం కావాలి?" })
    .fill("నా పరిచయం మెరుగుపరచాలి");
  await page
    .getByRole("button", { name: "ChatGPT కోసం JSON రూపొందించండి" })
    .click();
  const packet = JSON.parse(
    await page
      .getByRole("textbox", { name: "ChatGPTలో పేస్ట్ చేయాల్సిన JSON" })
      .inputValue(),
  );
  expect(packet.responseLanguage).toBe("Telugu (తెలుగు)");
  expect(packet.question).toBe("నా పరిచయం మెరుగుపరచాలి");
  await page.getByRole("button", { name: "ప్రొఫైల్", exact: true }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByText("Always, authentically you.")).toBeVisible();
  await expect(page.getByText("అనన్య", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Always, authentically you.")).toBeVisible();
  await page.getByRole("button", { name: "తెలుగు", exact: true }).click();
  await page.getByRole("button", { name: "నా ప్రొఫైల్ మార్చండి" }).click();
  await expect(
    page.getByRole("textbox", { name: "మిమ్మల్ని ఏ పేరుతో పిలవాలి?" }),
  ).toHaveValue("అనన్య");
  await expect(page.locator('[aria-modal="true"]')).toHaveAttribute(
    "role",
    "dialog",
  );
  await page.screenshot({
    path: `test-results/${test.info().project.name}-telugu-onboarding.png`,
  });
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    a11y.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  expect(errors).toEqual([]);
});
