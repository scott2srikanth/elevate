import test from "node:test";
import assert from "node:assert/strict";
import { initialState, exercises } from "../src/coach";
import { stateSchema } from "../src/shared/schema";
import { translate } from "../src/i18n/translate";
import { buildStudioRequest } from "../src/studioExchange";
import te from "../src/i18n/te.json";
test("old profiles default to English; Telugu survives schema roundtrip", () => {
  const legacy = JSON.parse(JSON.stringify(initialState()));
  delete legacy.preferences.language;
  assert.equal(stateSchema.parse(legacy).preferences.language, "en");
  legacy.preferences.language = "te";
  assert.equal(stateSchema.parse(legacy).preferences.language, "te");
  assert.equal(
    stateSchema.safeParse({
      ...legacy,
      preferences: { ...legacy.preferences, language: "not a language code" },
    }).success,
    false,
  );
});
test("all practice teaching content has Telugu translations without changing domain keys", () => {
  for (const e of exercises)
    for (const s of [e.title, e.description, e.lesson, e.challenge, ...e.steps])
      assert.ok((te as Record<string, string>)[s], s);
  assert.equal(translate("Stage 3", "te"), "దశ 3");
  assert.equal(
    translate("Your next chapter, Alex.", "te"),
    "Alex, మీ కొత్త ప్రయాణం.",
  );
  assert.equal(translate("నా స్వంత గమనిక", "te"), "నా స్వంత గమనిక");
});
test("ChatGPT packages request Telugu while preserving machine schema keys", () => {
  const state = initialState();
  state.preferences.language = "te";
  for (const kind of ["weekly", "coach", "media"] as const) {
    const packet = buildStudioRequest(state, kind, {
      question: "సహాయం",
      mediaType: "photo",
      transcript: "",
      includeProfile: true,
      includeHistory: true,
      includeMemories: true,
    });
    assert.equal(packet.responseLanguage, "Telugu (తెలుగు)");
    assert.equal(packet.kind, kind);
    assert.ok(packet.instructions[0].includes("Telugu"));
  }
});
