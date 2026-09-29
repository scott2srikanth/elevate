import type { MediaReport } from "../shared/observation";
export function currentMedia(reports: MediaReport[] = [], now = new Date()) {
  return reports
    .filter((r) => {
      const age = now.getTime() - Date.parse(r.at);
      return age >= 0 && age < 86400000;
    })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
/** Only directly compatible measurements enter the decision model. Manual ratings win. */
export function mediaFeatures(reports: MediaReport[] = [], now = new Date()) {
  const features: Record<string, { value: number; reliability: number }> = {};
  let visualSeen = false,
    audioSeen = false;
  for (const report of currentMedia(reports, now)) {
    const useVisual = report.kind !== "audio" && !visualSeen;
    const useAudio = report.kind !== "photo" && !audioSeen;
    if (report.kind !== "audio") visualSeen = true;
    if (report.kind !== "photo") audioSeen = true;
    for (const metric of report.metrics) {
      if (metric.key === "volume" ? !useAudio : !useVisual) continue;
      if (features[metric.key] || metric.reliability < 0.7) continue;
      if (
        ["lighting", "framing", "head_position"].includes(metric.key) &&
        metric.unit === "score"
      )
        features[metric.key] = {
          value: metric.value,
          reliability: metric.reliability,
        };
      if (metric.key === "volume" && metric.unit === "dBFS")
        features.volume = {
          value: Math.max(0, Math.min(1, (metric.value + 45) / 27)),
          reliability: metric.reliability,
        };
    }
  }
  return features;
}
export function mediaGuidance(reports: MediaReport[] = [], now = new Date()) {
  const latest = currentMedia(reports, now)[0];
  if (!latest) return [];
  const find = (key: string) =>
    latest.metrics.find((m) => m.key === key && m.reliability >= 0.7)?.value;
  const advice: string[] = [];
  if ((find("lighting") ?? 1) < 0.4)
    advice.push(
      "Try a softly lit position and compare another recording. Camera exposure measures the image, not your appearance.",
    );
  if ((find("framing") ?? 1) < 0.5)
    advice.push(
      "For a solo presentation, centre your head and leave space around your shoulders before recording again.",
    );
  if ((find("volume") ?? 0) < -35)
    advice.push(
      "Your detected speech is quiet in this recording. Try a closer microphone and record another short introduction.",
    );
  if ((find("clipping") ?? 0) > 0.01)
    advice.push(
      "This recording clips. Reduce microphone gain or move slightly farther away, then compare another take.",
    );
  if ((find("pause_seconds") ?? 0) > 3)
    advice.push(
      "There is a long gap between detected speech segments. Replay it to decide whether it was intentional, then rehearse a short introduction if useful.",
    );
  return advice;
}
