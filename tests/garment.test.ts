import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/coach";
import { stateSchema } from "../src/shared/schema";
import { parseGarmentMessage, type GarmentResult } from "../src/shared/garment";
import { recommendOutfit } from "../src/intelligence/garmentOutfits";
const dress: GarmentResult = {
  id: "garment-12345678901",
  name: "Blue dress",
  category: "Dresses",
  color: "Blue",
  garmentAnalysis: {
    model: "garment-one-0.1.0",
    release: "a".repeat(64),
    at: new Date().toISOString(),
    proposedType: "Dress",
    score: 0.8,
    accepted: true,
    confirmed: true,
    formality: "Smart",
  },
};
test("garment bridge requires current reviewed metadata and excludes photo payloads", () => {
  const wrap = (garment: unknown, session = "test") =>
    JSON.stringify({ type: "elevate-garment", session, garment });
  assert.deepEqual(parseGarmentMessage(wrap(dress), "test"), dress);
  assert.equal(parseGarmentMessage(wrap(dress, "other"), "test"), null);
  assert.equal(
    parseGarmentMessage(
      wrap({ ...dress, photo: "data:image/jpeg;base64,private" }),
      "test",
    ),
    null,
  );
  assert.equal(
    parseGarmentMessage(
      wrap({
        ...dress,
        garmentAnalysis: { ...dress.garmentAnalysis, confirmed: false },
      }),
      "test",
    ),
    null,
  );
  assert.equal(
    parseGarmentMessage(
      wrap({
        ...dress,
        garmentAnalysis: {
          ...dress.garmentAnalysis,
          at: "2020-01-01T00:00:00.000Z",
        },
      }),
      "test",
    ),
    null,
  );
  const s = initialState();
  s.wardrobe = [dress];
  assert.deepEqual(stateSchema.parse(s).wardrobe, [dress]);
});
test("a reviewed dress replaces separates and does not invent missing shoes", () => {
  const r = recommendOutfit([dress], "Client meeting");
  assert.deepEqual(r.pieces, [dress]);
  assert.deepEqual(r.missing, ["Shoes"]);
});
test("outfit selection uses confirmed occasion preferences and preserves ownership", () => {
  const casual = {
    ...dress,
    id: "casual",
    name: "Casual dress",
    garmentAnalysis: { ...dress.garmentAnalysis, formality: "Casual" as const },
  };
  const smart = { ...dress, id: "smart" };
  const shoe = { id: "shoe", name: "Shoes", category: "Shoes", color: "Black" };
  const r = recommendOutfit([casual, smart, shoe], "Client meeting");
  assert.deepEqual(
    r.pieces.map((p) => p.id),
    ["smart", "shoe"],
  );
  assert.deepEqual(r.missing, []);
});
