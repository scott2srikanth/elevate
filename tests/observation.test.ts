import test from "node:test";
import assert from "node:assert/strict";
import { initialState, recommend } from "../src/coach";
import {
  mediaReportSchema,
  parseMediaMessage,
  type MediaReport,
} from "../src/shared/observation";
import { mediaFeatures, mediaGuidance } from "../src/intelligence/observation";
import { coachDecisions, featureState } from "../src/intelligence/engine";
import { stateSchema } from "../src/shared/schema";
import { stagePlan } from "../src/development";
const now = new Date();
const report: MediaReport = {
  version: 1,
  id: "test",
  at: now.toISOString(),
  kind: "audio",
  model: "elevate-observe-0.1",
  metrics: [{ key: "volume", value: -42, unit: "dBFS", reliability: 0.8 }],
  notes: [],
};
test("observation bridge validates session, numeric ranges, units and duplicate metrics", () => {
  const message = (r: unknown) =>
    JSON.stringify({ type: "elevate-observation", session: "x", report: r });
  assert.ok(parseMediaMessage(message(report), "x"));
  assert.equal(parseMediaMessage(message(report), "y"), null);
  for (const metrics of [
    [{ ...report.metrics[0], value: Infinity }],
    [{ ...report.metrics[0], unit: "score" }],
    [...report.metrics, ...report.metrics],
  ])
    assert.equal(
      mediaReportSchema.safeParse({ ...report, metrics }).success,
      false,
    );
  assert.equal(parseMediaMessage("invalid", "x"), null);
});
test("automatic measurements expire, withhold low reliability and preserve manual overrides", () => {
  assert.deepEqual(
    mediaFeatures(
      [{ ...report, at: new Date(now.getTime() - 86400000).toISOString() }],
      now,
    ),
    {},
  );
  assert.deepEqual(
    mediaFeatures(
      [{ ...report, metrics: [{ ...report.metrics[0], reliability: 0.4 }] }],
      now,
    ),
    {},
  );
  const state = initialState();
  state.aiCoach = {
    consent: true,
    mediaReports: [report],
    observations: { volume: { value: 0.9, at: now.toISOString() } },
  };
  assert.equal(featureState(state, now).volume, 0.9);
  assert.equal(featureState(state, now).posture, undefined);
  assert.equal(featureState(state, now).pace, undefined);
});
test("recordings persist through account validation and affect recommendations without advancing stages", () => {
  const state = initialState();
  const before = stagePlan(state, now);
  state.aiCoach = { consent: true, observations: {}, mediaReports: [report] };
  assert.equal(stateSchema.parse(state).aiCoach.mediaReports?.length, 1);
  assert.match(recommend(state, now).reason, /recording/);
  assert.deepEqual(stagePlan(state, now), before);
  assert.equal(mediaGuidance([report], now).length, 1);
  state.aiCoach.consent = false;
  assert.doesNotMatch(recommend(state, now).reason, /recording/);
  assert.ok(coachDecisions(state, now).every((d) => d.value === null));
});
test("media reliability applies only to heads that use those measurements", () => {
  const state = initialState();
  state.aiCoach = { consent: true, observations: {}, mediaReports: [report] };
  const results = coachDecisions(state, now);
  assert.ok(
    results
      .find((d) => d.id === "ask_more_information")
      ?.reasons.some((r) => r.includes("Missing")),
  );
  assert.ok(results.every((d) => d.id !== "next_exercise" || d.value === null));
});
