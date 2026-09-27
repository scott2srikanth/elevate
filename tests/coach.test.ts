import assert from "node:assert/strict";
import test from "node:test";
import {
  addReflection,
  dayKey,
  initialState,
  occasionChecklist,
  recommend,
  streak,
  weekIndex,
  type Profile,
  type Reflection,
} from "../src/coach";
const profile: Profile = {
  name: "Alex",
  role: "Manager",
  goal: "Speak clearly",
  context: "Smart casual",
  minutes: 5,
  focus: "Communication",
  confidence: 3,
  startedAt: "2026-09-01T12:00:00Z",
};
const reflection: Reflection = {
  id: "1",
  exerciseId: "listening",
  at: "2026-09-26T12:00:00Z",
  confidence: 4,
  note: "I paused and heard a useful detail.",
  next: "Ask one follow-up.",
  situation: "Team meeting",
};
test("profile determines coaching focus", () => {
  assert.equal(
    recommend({ ...initialState(), profile }).exercise.area,
    "Communication",
  );
});
test("unfinished real-world challenge takes priority", () => {
  assert.equal(
    recommend({
      ...initialState(),
      profile,
      assignment: { exerciseId: "dining", rehearsedAt: reflection.at },
    }).exercise.id,
    "dining",
  );
});
test("difficult practice is repeated instead of blindly advancing", () => {
  assert.equal(
    recommend({
      ...initialState(),
      profile,
      reflections: [{ ...reflection, exerciseId: "story", confidence: 2 }],
    }).exercise.id,
    "story",
  );
});
test("recommendations round out unfinished curriculum skills", () => {
  assert.equal(
    recommend({ ...initialState(), profile, reflections: [reflection] })
      .exercise.id,
    "introduction",
  );
});
test("a reflection requires rehearsal and a real-world situation", () => {
  assert.throws(() => addReflection(initialState(), reflection));
  const state = {
    ...initialState(),
    assignment: { exerciseId: "listening", rehearsedAt: reflection.at },
  };
  assert.throws(() => addReflection(state, { ...reflection, situation: " " }));
  const result = addReflection(state, reflection);
  assert.equal(result.assignment, null);
  assert.equal(result.reflections.length, 1);
  assert.equal(state.reflections.length, 0);
});
test("streak counts distinct local calendar days and tolerates today not yet done", () => {
  const now = new Date(2026, 8, 26, 14);
  const make = (day: number) => ({
    ...reflection,
    at: new Date(2026, 8, day, 12).toISOString(),
  });
  assert.equal(streak([make(25), make(25), make(24)], now), 2);
  assert.equal(streak([make(23)], now), 0);
  assert.equal(dayKey(now), "2026-09-26");
});
test("eight-week path is bounded for future and old start dates", () => {
  assert.equal(weekIndex(profile, new Date("2026-08-01")), 0);
  assert.equal(weekIndex(profile, new Date("2026-09-16")), 2);
  assert.equal(weekIndex(profile, new Date("2027-01-01")), 7);
});
test("occasion plans provide nine unique, context-specific checks", () => {
  for (const title of ["Client meeting", "Job interview", "Business dinner"]) {
    const items = occasionChecklist(title).flatMap((g) => g.items);
    assert.equal(items.length, 9);
    assert.equal(new Set(items).size, 9);
  }
  assert.match(occasionChecklist("Business dinner")[0].items[0], /dietary/);
});
