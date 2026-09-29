import test from "node:test";
import assert from "node:assert/strict";
import {
  classify,
  estimateColor,
} from "../public/observation/garment/engine.mjs";
const m = {
  rows: [
    { label: "Dress", category: "Dresses", vector: [1, 0] },
    { label: "Not a garment", category: "Unknown", vector: [0, 1] },
  ],
  temperature: 0.04,
  minimumSimilarity: 0.2,
  minimumProbability: 0.55,
  minimumMargin: 0.12,
};
test("garment head abstains on ties, negative classes and invalid embeddings", () => {
  assert.equal(classify([1, 0], m).accepted, true);
  assert.equal(classify([1, 1], m).accepted, false);
  assert.equal(classify([0, 1], m).accepted, false);
  assert.throws(() => classify([0, 0], m));
});
test("colour extraction ignores plain background and leaves blank images unknown", () => {
  const rgba = new Uint8ClampedArray(20 * 20 * 4).fill(255);
  assert.equal(estimateColor(rgba, 20, 20).color, "");
  for (let y = 5; y < 15; y++)
    for (let x = 5; x < 15; x++) {
      const i = (y * 20 + x) * 4;
      rgba.set([35, 47, 76, 255], i);
    }
  assert.equal(estimateColor(rgba, 20, 20).color, "Navy");
});
