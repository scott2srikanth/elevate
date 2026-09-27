import test from "node:test";
import assert from "node:assert/strict";
import { initialState, exercises } from "../src/coach";
import {
  adaptiveStage,
  stagePlan,
  practiceForTime,
  weeklySummary,
  outfitSuggestion,
  brandStatement,
} from "../src/development";
import { stateSchema } from "../src/shared/schema";
const reflection = (exerciseId: string, at: string, confidence = 4) => ({
  id: exerciseId + at,
  exerciseId,
  at,
  confidence,
  note: "A useful practice.",
  next: "Repeat tomorrow.",
  situation: "Work",
});
test("legacy state gains new fields without losing the profile history", () => {
  const legacy = {
    version: 1,
    profile: null,
    assignment: null,
    learned: [],
    reflections: [],
    wardrobe: [],
    occasions: [],
  };
  const migrated = stateSchema.parse(legacy);
  assert.deepEqual(migrated.memories, []);
  assert.equal(migrated.preferences.retentionDays, 0);
});
test("stage advances on completed skills, not elapsed time", () => {
  const s = initialState();
  assert.equal(adaptiveStage(s), 0);
  s.reflections = [
    reflection("introduction", "2026-09-01"),
    reflection("listening", "2026-09-02"),
  ];
  assert.equal(adaptiveStage(s), 1);
  s.reflections.push(
    reflection("grooming", "2026-09-03"),
    reflection("wardrobe", "2026-09-04"),
  );
  assert.equal(adaptiveStage(s), 2);
  assert.equal(
    adaptiveStage({
      ...s,
      reflections: s.reflections.map((r) => ({ ...r, confidence: 2 })),
    }),
    0,
  );
});
test("short practice adapts steps and duration", () => {
  const e = practiceForTime(exercises[0], 3);
  assert.equal(e.minutes, 3);
  assert.equal(e.steps.length, 2);
  assert.equal(exercises[0].minutes, 5);
});
test("review computes only recent past practices and detects specific themes", () => {
  const s = initialState();
  s.reflections = [
    {
      ...reflection("story", "2026-09-25"),
      note: "I rushed my answer.",
      confidence: 3,
    },
    reflection("story", "2026-08-01"),
    reflection("story", "2026-10-01"),
  ];
  const report = weeklySummary(s, new Date("2026-09-27"));
  assert.equal(report.count, 1);
  assert.equal(report.signals[0].id, "story");
  assert.equal(report.reviewDue, true);
});
test("outfit only includes clothing actually owned", () => {
  const s = initialState();
  s.wardrobe = [
    { id: "a", name: "White shirt", category: "Tops", color: "White" },
  ];
  const result = outfitSuggestion(s, "Client meeting");
  assert.deepEqual(
    result.pieces.map((p) => p.id),
    ["a"],
  );
  assert.deepEqual(result.missing, ["Bottoms", "Shoes"]);
});
test("brand statement uses supplied facts without invented credentials", () => {
  assert.equal(
    brandStatement(
      "Alex",
      "Designer",
      "teams",
      "research",
      "build usable products",
    ),
    "Alex, Designer, helps teams build usable products through research.",
  );
});
test("invalid retention and malformed exercise IDs are rejected", () => {
  assert.throws(() =>
    stateSchema.parse({
      ...initialState(),
      preferences: { ...initialState().preferences, retentionDays: 365 },
    }),
  );
  assert.throws(() =>
    stateSchema.parse({
      ...initialState(),
      assignment: {
        exerciseId: "invalid id with spaces",
        rehearsedAt: "2026-09-27",
      },
    }),
  );
});

test("later stages require fresh reflections for repeated skills", () => {
  const s = initialState();
  s.reflections = [
    reflection("introduction", "2026-09-01"),
    reflection("listening", "2026-09-02"),
    reflection("grooming", "2026-09-03"),
    reflection("wardrobe", "2026-09-04"),
  ];
  assert.deepEqual(stagePlan(s).remaining, ["wardrobe", "grooming"]);
  s.reflections.push(reflection("wardrobe", "2026-09-05"));
  assert.deepEqual(stagePlan(s).remaining, ["grooming"]);
});
