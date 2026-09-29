/** Fixed text-prototype decision head over a pretrained quantized image encoder. */
export function classify(vector, model) {
  const norm = Math.hypot(...vector);
  if (!Number.isFinite(norm) || norm < 1e-8)
    throw Error("The model returned an invalid image representation.");
  const rows = model.rows.map((row) => ({
    ...row,
    similarity: row.vector.reduce((s, v, i) => s + (v * vector[i]) / norm, 0),
  }));
  const max = Math.max(...rows.map((r) => r.similarity));
  const sum = rows.reduce(
    (s, r) => s + Math.exp((r.similarity - max) / model.temperature),
    0,
  );
  for (const row of rows)
    row.score = Math.exp((row.similarity - max) / model.temperature) / sum;
  rows.sort((a, b) => b.score - a.score);
  const top = rows[0];
  return {
    label: top.label,
    category: top.category,
    score: top.score,
    similarity: top.similarity,
    accepted:
      top.category !== "Unknown" &&
      top.similarity >= model.minimumSimilarity &&
      top.score >= model.minimumProbability &&
      top.score - rows[1].score >= model.minimumMargin,
    alternatives: rows
      .slice(0, 3)
      .map(({ label, score }) => ({ label, score })),
  };
}
const palette = {
  Black: [28, 28, 30],
  White: [240, 240, 235],
  Grey: [130, 130, 130],
  Navy: [35, 47, 76],
  Blue: [61, 119, 179],
  Brown: [104, 72, 48],
  Beige: [199, 180, 143],
  Red: [177, 45, 48],
  Pink: [220, 141, 165],
  Orange: [221, 122, 46],
  Yellow: [221, 197, 64],
  Green: [65, 113, 77],
  Purple: [120, 75, 145],
};
/** Approximate foreground colour on a plain background; not fabric/material inference. */
export function estimateColor(rgba, width, height) {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ].map(([x, y]) =>
    Array.from(rgba.slice((y * width + x) * 4, (y * width + x) * 4 + 3)),
  );
  const bg = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / 4);
  const counts = {};
  let total = 0,
    brightness = 0;
  for (let y = 0; y < height; y += 2)
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const p = Array.from(rgba.slice(i, i + 3));
      if (rgba[i + 3] < 200 || Math.hypot(...p.map((v, c) => v - bg[c])) < 45)
        continue;
      let best = "",
        distance = Infinity;
      for (const [name, color] of Object.entries(palette)) {
        const d = Math.hypot(...p.map((v, c) => v - color[c]));
        if (d < distance) {
          distance = d;
          best = name;
        }
      }
      counts[best] = (counts[best] || 0) + 1;
      total++;
      brightness += (p[0] + p[1] + p[2]) / 3;
    }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const fraction = total / (Math.ceil(width / 2) * Math.ceil(height / 2));
  return {
    color: total && fraction > 0.03 && fraction < 0.9 ? ranked[0][0] : "",
    coverage: fraction,
    brightness: total ? brightness / total / 255 : 0,
    share: total ? ranked[0][1] / total : 0,
  };
}
