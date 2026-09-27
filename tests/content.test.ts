import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyContent,
  parseContent,
  safeVideoUrl,
  youtubeId,
} from "../src/shared/content";
import { installLanguages, availableLanguages } from "../src/contentRuntime";
import { translate } from "../src/i18n/translate";
import {
  installLessons,
  exercises,
  initialState,
  recommend,
} from "../src/coach";
import { stateSchema } from "../src/shared/schema";

test("content rejects executable URLs, duplicate IDs, invalid language placeholders and malformed JSON", () => {
  assert.equal(safeVideoUrl("javascript:alert(1)"), false);
  assert.equal(safeVideoUrl("http://example.com/a.mp4"), false);
  assert.equal(safeVideoUrl("https://example.com/not-a-video"), false);
  assert.equal(safeVideoUrl("https://example.com/lesson.mp4"), true);
  assert.equal(youtubeId("https://youtu.be/eIho2S0ZahI"), "eIho2S0ZahI");
  assert.equal(youtubeId("https://evil.example/watch?v=eIho2S0ZahI"), null);
  const doc = emptyContent();
  doc.languages = [
    { code: "hi", name: "हिन्दी", strings: { "Hi {name}": "नमस्ते" } },
  ];
  assert.throws(() => parseContent(JSON.stringify(doc)));
  doc.languages = [
    { code: "hi", name: "हिन्दी", strings: { "Hi {name}": "नमस्ते {name}" } },
  ];
  doc.languages.push(doc.languages[0]);
  assert.throws(() => parseContent(JSON.stringify(doc)));
  assert.throws(() => parseContent('{"code":"run this"}'));
  assert.deepEqual(
    parseContent("```json\n" + JSON.stringify(emptyContent()) + "\n```"),
    emptyContent(),
  );
});

test("published language packs, custom lessons and state IDs survive schema validation", () => {
  installLanguages([
    {
      code: "hi",
      name: "हिन्दी",
      strings: {
        Today: "आज",
        "Your next chapter, {name}.": "आपका अगला अध्याय, {name}.",
      },
    },
  ]);
  assert.equal(translate("Today", "hi"), "आज");
  assert.equal(
    translate("Your next chapter, Ananya.", "hi"),
    "आपका अगला अध्याय, Ananya.",
  );
  assert.equal(translate("Untranslated text", "hi"), "Untranslated text");
  assert.ok(availableLanguages().some((p) => p.code === "hi"));
  const custom = {
    id: "custom-lesson",
    title: "Meet a host",
    area: "Etiquette" as const,
    minutes: 5,
    description: "Prepare a greeting",
    lesson: "Consider the occasion",
    steps: ["Rehearse a greeting"],
    challenge: "Greet your host",
  };
  installLessons([custom]);
  assert.ok(exercises.some((e) => e.id === custom.id));
  const state = initialState();
  state.preferences.language = "hi";
  state.learned = [custom.id];
  assert.equal(stateSchema.parse(state).learned[0], custom.id);
  installLessons([]);
  state.assignment = {
    exerciseId: custom.id,
    rehearsedAt: new Date().toISOString(),
  };
  assert.ok(recommend(state).exercise);
  installLanguages([]);
});
