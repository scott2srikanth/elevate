import type { Garment } from "../coach";
const neutrals = new Set([
  "black",
  "white",
  "grey",
  "gray",
  "navy",
  "brown",
  "beige",
  "cream",
  "tan",
]);
/** Small deterministic preference model. No fit or formality is inferred from pixels. */
export function recommendOutfit(wardrobe: Garment[], occasion: string) {
  const formal = /meeting|interview|presentation|business/i.test(occasion);
  const usefulness = (g: Garment) => {
    const f = g.garmentAnalysis?.confirmed
      ? g.garmentAnalysis.formality
      : "Any";
    return f === "Any"
      ? 0
      : formal
        ? f === "Formal"
          ? 3
          : f === "Smart"
            ? 2
            : -2
        : f === "Smart"
          ? 3
          : f === "Casual"
            ? 2
            : 1;
  };
  const pool = (category: string) =>
    wardrobe
      .filter((g) => g.category === category)
      .sort((a, b) => usefulness(b) - usefulness(a) || a.id.localeCompare(b.id))
      .slice(0, 6);
  const choices: Garment[][] = [];
  const tops = pool("Tops"),
    bottoms = pool("Bottoms"),
    dresses = pool("Dresses"),
    shoes = pool("Shoes"),
    layers = formal ? pool("Layers") : [];
  const variants = (pieces: Garment[]) => {
    for (const shoe of shoes.length ? shoes : [undefined]) {
      const base = shoe ? [...pieces, shoe] : pieces;
      choices.push(base);
      for (const layer of layers) choices.push([...base, layer]);
    }
  };
  for (const top of tops.length ? tops : [undefined])
    for (const bottom of bottoms.length ? bottoms : [undefined])
      variants([top, bottom].filter((p): p is Garment => !!p));
  for (const dress of dresses) variants([dress]);
  const score = (pieces: Garment[]) => {
    const categories = new Set(pieces.map((p) => p.category));
    const complete =
      categories.has("Shoes") &&
      (categories.has("Dresses") ||
        (categories.has("Tops") && categories.has("Bottoms")));
    const coreCount =
      Number(categories.has("Shoes")) +
      (categories.has("Dresses")
        ? 2
        : Number(categories.has("Tops")) + Number(categories.has("Bottoms")));
    const accentColors = new Set(
      pieces
        .map((p) => p.color.trim().toLowerCase())
        .filter((c) => c && !neutrals.has(c)),
    );
    return (
      (complete ? 100 : 0) +
      coreCount * 10 +
      pieces.reduce((sum, p) => sum + usefulness(p), 0) -
      Math.max(0, accentColors.size - 1) * 2 -
      (categories.has("Layers") ? 1 : 0)
    );
  };
  choices.sort((a, b) => score(b) - score(a));
  const pieces = choices[0] || [],
    categories = new Set(pieces.map((p) => p.category));
  const missing = (
    categories.has("Dresses") ? ["Shoes"] : ["Tops", "Bottoms", "Shoes"]
  ).filter((c) => !categories.has(c));
  const reviewed = pieces.some((p) => p.garmentAnalysis?.confirmed);
  return {
    pieces,
    missing,
    reason: reviewed
      ? `Selected from pieces you own using your reviewed categories, colours and occasion preferences for ${occasion.toLowerCase()}. A simple palette breaks ties. Confirm comfort, weather and the actual dress code; a photo cannot establish fit or fabric.`
      : `A starting combination from pieces you own for ${occasion.toLowerCase()}. Add reviewed photo details to personalise selection. Confirm the actual dress code, comfort, and weather; garment names alone cannot establish fit or formality.`,
  };
}
