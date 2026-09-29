// Transparent signal transforms, shared by browser runtime and regression tests.
export const clamp = (x) => Math.max(0, Math.min(1, x));
export function exposure(data) {
  let sum = 0,
    extreme = 0;
  const count = data.length / 4;
  if (!count) return 0;
  for (let i = 0; i < data.length; i += 4) {
    const y =
      (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    sum += y;
    if (y < 0.025 || y > 0.975) extreme++;
  }
  // Broad exposure proxy; no skin-colour or beauty score.
  return clamp(
    Math.min(sum / count / 0.18, (1 - sum / count) / 0.08, 1 - extreme / count),
  );
}
export function poseSignals(poses) {
  if (poses.length !== 1) return null;
  const points = [poses[0][0], poses[0][11], poses[0][12]];
  if (
    points.some(
      (p) =>
        !p ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        (p.visibility ?? 0) < 0.75,
    )
  )
    return null;
  const [head, left, right] = points;
  if (points.some((p) => p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) return null;
  const margin = Math.min(head.y, left.x, 1 - left.x, right.x, 1 - right.x);
  const center = clamp(1 - Math.abs(head.x - 0.5) * 2);
  return {
    framing: clamp(margin / 0.08) * center,
    head_position: center,
    reliability: Math.min(...points.map((p) => p.visibility)),
  };
}
export function speechSignals(samples, rate, segments) {
  const valid = segments.filter((s) => s.end > s.start && s.start >= 0);
  if (!valid.length) return null;
  let sum = 0,
    clipped = 0,
    count = 0;
  for (const s of valid)
    for (
      let i = Math.floor((s.start * rate) / 1000);
      i < Math.min(samples.length, Math.floor((s.end * rate) / 1000));
      i++
    ) {
      const value = samples[i];
      sum += value * value;
      clipped += Math.abs(value) >= 0.99 ? 1 : 0;
      count++;
    }
  if (!count) return null;
  const seconds = count / rate;
  const gaps = valid
    .slice(1)
    .map((s, i) => Math.max(0, (s.start - valid[i].end) / 1000));
  return {
    volume: Math.max(-120, 20 * Math.log10(Math.sqrt(sum / count) || 1e-6)),
    clipping: clipped / count,
    speech_seconds: seconds,
    pause_seconds: gaps.length ? Math.max(...gaps) : null,
  };
}
