import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  exercises,
  recommend,
  type Reflection,
} from "../src/coach";
import { learningProgress } from "../src/learning";
import { stagePlan } from "../src/development";
import { stateSchema } from "../src/shared/schema";
import { buildCoachAnalysis } from "../src/aiCoach";
import {
  inferDecisions,
  featureState,
  coachDecisions,
  freshObservations,
} from "../src/intelligence/engine";
import parity from "./fixtures/decision-parity.json";
const now = new Date("2026-09-29T12:00:00Z");
function row(day: number, confidence: number, id = "story"): Reflection {
  return {
    id: `${id}-${day}`,
    exerciseId: id,
    at: `2026-09-${String(day).padStart(2, "0")}T08:00:00Z`,
    confidence,
    note: "A real practice",
    next: "Repeat",
    situation: "Team meeting",
  };
}
test("legacy state retains imported history and gains opt-in coach settings", () => {
  const s = initialState();
  const legacy = { ...s, aiCoach: undefined };
  const result = stateSchema.parse(legacy);
  assert.deepEqual(result.aiCoach, { consent: false, observations: {} });
  assert.deepEqual(result.assessments, s.assessments);
});
test("unknown, future and expired observations are not used as model evidence", () => {
  assert.deepEqual(
    freshObservations(
      {
        fit: { value: 0.5, at: "2026-09-01" },
        fatigue: { value: 0.8, at: "2026-09-28" },
        unknown: { value: 1, at: now.toISOString() },
        posture: { value: 0.9, at: "2026-09-30" },
      },
      now,
    ),
    {},
  );
});
test("schema rejects invalid observations", () => {
  const s = initialState();
  for (const value of [-1, 2, NaN, Infinity, true])
    assert.equal(
      stateSchema.safeParse({
        ...s,
        aiCoach: {
          consent: true,
          observations: { fit: { value, at: now.toISOString() } },
        },
      }).success,
      false,
    );
});
test("cold start never fabricates fit, posture or media evidence", () => {
  const features = featureState(initialState(), now);
  assert.equal(features.fit, undefined);
  assert.equal(features.posture, undefined);
  assert.equal(features.evidence_quality, undefined);
  assert.ok(coachDecisions(initialState(), now).every((d) => d.value === null));
});
test("consent is required to generate analysis", () => {
  assert.throws(
    () => buildCoachAnalysis(initialState(), "coach", now),
    /Enable/,
  );
  assert.ok(
    inferDecisions({ fit: 1, evidence_quality: 1 }, false).every(
      (d) => d.probabilities === null,
    ),
  );
});
test("model probabilities match the Python export", () => {
  for (const fixture of parity) {
    const actual = inferDecisions(fixture.features, true);
    for (const d of actual) {
      const expected = fixture.expected.find((r) => r.id === d.id)!;
      assert.equal(d.value, expected.value);
      for (const [key, p] of Object.entries(d.probabilities ?? {}))
        assert.ok(
          Math.abs(
            p -
              (expected.probabilities as unknown as Record<string, number>)[
                key
              ],
          ) < 1e-10,
        );
    }
  }
});
test("missing one input withholds only affected heads", () => {
  const r = inferDecisions({ fit: 1, evidence_quality: 1 }, true);
  assert.equal(r.find((d) => d.id === "clothing_fit")?.value, "ready");
  assert.equal(r.find((d) => d.id === "next_exercise")?.probabilities, null);
});
test("current explicit self-check can influence the daily recommendation", () => {
  const s = initialState();
  s.aiCoach = {
    consent: true,
    observations: Object.fromEntries(
      Object.entries({
        posture: 1,
        intro_ready: 0,
        listening: 1,
        evidence_quality: 1,
      }).map(([key, value]) => [key, { value, at: now.toISOString() }]),
    ),
  };
  assert.equal(recommend(s, now).exercise.id, "introduction");
  assert.match(recommend(s, now).reason, /self-check/);
  s.assignment = { exerciseId: "wardrobe", rehearsedAt: now.toISOString() };
  assert.equal(recommend(s, now).exercise.id, "wardrobe");
});
test("progress ignores duplicate IDs, same-day repetitions and future records", () => {
  const s = initialState();
  s.reflections = [
    row(29, 4),
    row(29, 4),
    { ...row(29, 5), id: "another" },
    row(30, 5),
  ];
  const progress = learningProgress(s, exercises, now).find(
    (p) => p.exerciseId === "story",
  )!;
  assert.equal(progress.evidenceDays, 1);
  assert.equal(progress.attempts, 2);
  assert.equal(progress.trend, null);
  assert.notEqual(progress.status, "consistent_self_report");
});
test("trend is grounded in multiple days, and declining confidence triggers support", () => {
  const s = initialState();
  s.reflections = [
    row(29, 2),
    row(28, 2),
    row(27, 2),
    row(26, 5),
    row(25, 5),
    row(24, 5),
  ];
  const skill = learningProgress(s, exercises, now).find(
    (p) => p.exerciseId === "story",
  )!;
  assert.equal(skill.trend, -3);
  assert.equal(skill.status, "needs_support");
  assert.equal(recommend(s, now).exercise.id, "story");
});
test("spaced review interval lengthens with consistent self-report", () => {
  const s = initialState();
  s.reflections = [row(10, 4), row(9, 4), row(8, 4)];
  const skill = learningProgress(s, exercises, now).find(
    (p) => p.exerciseId === "story",
  )!;
  assert.equal(skill.dueAt, "2026-09-24T08:00:00.000Z");
  assert.equal(skill.due, true);
  assert.match(recommend(s, now).reason, /spaced review/);
});
test("future reflections cannot advance the curriculum", () => {
  const s = initialState();
  s.reflections = [row(30, 5, "introduction"), row(30, 5, "listening")];
  assert.equal(stagePlan(s, now).index, 0);
});
test("all three coach contexts generate valid, persistable analyses with explicit observation limits", () => {
  const s = initialState();
  s.aiCoach.consent = true;
  s.reflections = [row(28, 3)];
  for (const kind of ["coach", "weekly", "media"] as const) {
    const analysis = buildCoachAnalysis(s, kind, now);
    assert.equal(analysis.kind, kind);
    assert.equal(analysis.charts[0].basis, "self_reported");
    assert.ok(
      analysis.limitations.some((s) =>
        s.includes("does not judge personality"),
      ),
    );
    s.assessments.push({
      id: kind,
      at: now.toISOString(),
      kind: "AI Coach",
      feedback: analysis.summary,
      analysis,
    });
  }
  assert.equal(stateSchema.parse(s).assessments.length, 3);
});
