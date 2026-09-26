import test from "node:test";
import assert from "node:assert/strict";
import { parseAnalysis } from "../src/shared/analysis";
import { buildStudioRequest } from "../src/studioExchange";
import { initialState } from "../src/coach";
import { stateSchema } from "../src/shared/schema";
import { exampleAnalysis } from "./fixtures/analysis";
test("response accepts JSON fences and retains charts, images, and diagram through state migration", () => {
  const analysis = parseAnalysis(
    "```json\n" + JSON.stringify(exampleAnalysis()) + "\n```",
    "weekly",
  );
  const state = initialState();
  state.assessments.push({
    id: "test",
    at: new Date().toISOString(),
    kind: "weekly",
    feedback: analysis.summary,
    analysis,
  });
  assert.deepEqual(stateSchema.parse(state).assessments[0].analysis, analysis);
  assert.deepEqual(stateSchema.parse(initialState()).assessments, []);
});
test("invalid, oversized and wrong-tab responses are rejected without execution", () => {
  assert.throws(() => parseAnalysis("{broken", "weekly"), /not valid JSON/);
  assert.throws(() => parseAnalysis("x".repeat(60001), "weekly"), /too large/);
  assert.throws(
    () => parseAnalysis(JSON.stringify(exampleAnalysis("coach")), "weekly"),
    /belongs to/,
  );
  const a: any = exampleAnalysis();
  a.visualGuides[0].image = "https://evil.example/tracker.png";
  assert.throws(
    () => parseAnalysis(JSON.stringify(a), "weekly"),
    /visualGuides/,
  );
  a.visualGuides[0].image = "speaking";
  a.html = "<script>alert(1)</script>";
  assert.throws(
    () => parseAnalysis(JSON.stringify(a), "weekly"),
    /Unrecognized/,
  );
});
test("charts reject invalid scales and numerical claims", () => {
  const a = exampleAnalysis();
  a.charts[0].points[0].value = 99;
  assert.throws(() => parseAnalysis(JSON.stringify(a), "weekly"), /maximum/);
  a.charts[0].points[0].value = -1;
  assert.throws(() => parseAnalysis(JSON.stringify(a), "weekly"), /points/);
  a.charts[0].points[0].value = 1;
  a.charts[1].max = 100;
  assert.throws(
    () => parseAnalysis(JSON.stringify(a), "weekly"),
    /maximum of 5/,
  );
});
test("JSON packages are individually typed, exclude unchecked context and specify media attachment limits", () => {
  const state = initialState();
  state.memories.push({
    id: "1",
    at: new Date().toISOString(),
    text: "private memory",
  });
  for (const kind of ["weekly", "coach", "media"] as const) {
    const p = buildStudioRequest(state, kind, {
      question: "Help me prepare",
      mediaType: "voice",
      transcript: "My introduction",
      includeProfile: false,
      includeHistory: false,
      includeMemories: false,
    });
    assert.equal(p.kind, kind);
    assert.deepEqual(p.context, {});
    assert.ok(p.response_schema.properties?.visualGuides);
    assert.ok(p.response_schema.properties?.charts);
    assert.ok(!JSON.stringify(p).includes("private memory"));
    if (kind === "media") {
      assert.equal(p.media?.transcript, "My introduction");
      assert.match(p.media!.attachmentInstruction, /no audio\/image bytes/);
    }
  }
});
