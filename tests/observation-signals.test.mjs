import test from "node:test";
import assert from "node:assert/strict";
import {
  exposure,
  poseSignals,
  speechSignals,
} from "../public/observation/signals.mjs";
test("exposure handles black, white and midtone without appearance classification", () => {
  assert.equal(exposure(new Uint8Array([0, 0, 0, 255])), 0);
  assert.equal(exposure(new Uint8Array([255, 255, 255, 255])), 0);
  assert.equal(exposure(new Uint8Array([128, 128, 128, 255])), 1);
});
test("pose abstains on multiple people, missing or hidden landmarks", () => {
  assert.equal(poseSignals([]), null);
  assert.equal(poseSignals([[], []]), null);
  assert.equal(poseSignals([[]]), null);
  const p = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.99,
  }));
  p[0].y = 0.2;
  p[11].x = 0.35;
  p[12].x = 0.65;
  assert.equal(poseSignals([p])?.framing, 1);
  p[0].visibility = 0.4;
  assert.equal(poseSignals([p]), null);
});
test("speech level and gaps use detected intervals; silence does not become speech evidence", () => {
  assert.equal(speechSignals(new Float32Array(1000), 1000, []), null);
  const result = speechSignals(new Float32Array(8000).fill(0.1), 1000, [
    { start: 0, end: 1000 },
    { start: 5000, end: 6000 },
  ]);
  assert.ok(Math.abs(result.volume + 20) < 0.01);
  assert.equal(result.pause_seconds, 4);
  assert.equal(result.speech_seconds, 2);
});
