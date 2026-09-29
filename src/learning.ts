/** Transparent progression analysis. Confidence is self-report, never measured mastery. */
import type { Exercise, State } from "./coach";
const DAY = 86400000;
export function validReflections(state: State, now = new Date()) {
  const seen = new Set<string>();
  return [...state.reflections]
    .filter(
      (r) =>
        Number.isFinite(Date.parse(r.at)) && Date.parse(r.at) <= now.getTime(),
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
}
export function learningProgress(
  state: State,
  catalog: readonly Exercise[],
  now = new Date(),
) {
  const reflections = validReflections(state, now);
  return catalog.map((exercise) => {
    const rows = reflections.filter((r) => r.exerciseId === exercise.id);
    // At most one reflection per calendar day contributes to progression evidence.
    const days = new Set<string>();
    const evidence = rows.filter((r) => {
      const date = new Date(r.at);
      const day = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (days.has(day)) return false;
      days.add(day);
      return true;
    });
    const average = (values: typeof evidence) =>
      values.reduce((n, r) => n + r.confidence, 0) / values.length;
    const recent = evidence.slice(0, 3),
      previous = evidence.slice(3, 6);
    const trend =
      recent.length >= 3 && previous.length >= 2
        ? Math.round((average(recent) - average(previous)) * 10) / 10
        : null;
    const latest = evidence[0];
    const interval = !latest
      ? null
      : latest.confidence <= 2
        ? 1
        : latest.confidence === 3
          ? 3
          : evidence.slice(0, 3).length === 3 &&
              evidence.slice(0, 3).every((r) => r.confidence >= 4)
            ? 14
            : 7;
    const dueAt =
      latest && interval
        ? new Date(Date.parse(latest.at) + interval * DAY).toISOString()
        : null;
    return {
      exerciseId: exercise.id,
      title: exercise.title,
      area: exercise.area,
      attempts: rows.length,
      evidenceDays: evidence.length,
      average: recent.length ? Math.round(average(recent) * 10) / 10 : null,
      latestConfidence: latest?.confidence ?? null,
      lastAt: latest?.at ?? null,
      trend,
      dueAt,
      due: !!dueAt && Date.parse(dueAt) <= now.getTime(),
      status: !latest
        ? "not_started"
        : latest.confidence <= 2
          ? "needs_support"
          : evidence.length >= 3 && recent.every((r) => r.confidence >= 4)
            ? "consistent_self_report"
            : "building",
    };
  });
}
