import type { MediaReport } from "../shared/observation";
import { mediaFeatures } from "./observation";
import model from "./model";
import type { State } from "../coach";
import { validReflections } from "../learning";
export type Observation = { value: number; at: string };
export type CoachState = {
  consent: boolean;
  mediaReports?: MediaReport[];
  observations: Record<string, Observation>;
};
export type DecisionModel = {
  version: string;
  features: Record<
    string,
    {
      label: string;
      group: string;
      default: number;
      min: number;
      max: number;
      description: string;
    }
  >;
  heads: {
    id: string;
    title: string;
    family: string;
    inputs: string[];
    options: string[];
    threshold: number;
    actions: Record<string, string>;
    weights: number[][];
    temperature: number;
  }[];
};
export type Decision = {
  id: string;
  title: string;
  family: string;
  value: string | null;
  confidence: number;
  probabilities: Record<string, number> | null;
  reasons: string[];
  action: string | null;
};
export const decisionModel = model;
export function freshObservations(
  observations: CoachState["observations"],
  now = new Date(),
) {
  const features: Record<string, number> = {};
  for (const [key, observation] of Object.entries(observations)) {
    if (!Object.prototype.hasOwnProperty.call(model.features, key)) continue;
    const age = now.getTime() - Date.parse(observation.at);
    const expiry =
      model.features[key].group === "Context" ||
      key === "evidence_quality" ||
      key === "fatigue"
        ? 86400000
        : 7 * 86400000;
    if (
      age >= 0 &&
      age < expiry &&
      typeof observation.value === "number" &&
      Number.isFinite(observation.value) &&
      observation.value >= 0 &&
      observation.value <= 1
    )
      features[key] = observation.value;
  }
  return features;
}
export function featureState(state: State, now = new Date()) {
  const features = Object.fromEntries(
    Object.entries(mediaFeatures(state.aiCoach?.mediaReports, now)).map(
      ([k, v]) => [k, v.value],
    ),
  );
  Object.assign(
    features,
    freshObservations(state.aiCoach?.observations ?? {}, now),
  );
  const rows = validReflections(state, now).filter(
    (r) => Date.parse(r.at) >= now.getTime() - 7 * 86400000,
  );
  features.practice_recent = Math.min(
    1,
    new Set(rows.map((r) => r.at.slice(0, 10))).size / 7,
  );
  if (rows.length)
    features.progress =
      rows.reduce((n, r) => n + (r.confidence - 1) / 4, 0) / rows.length;
  if (state.profile) {
    features.time_available = Math.min(1, state.profile.minutes / 20);
    features.goal_presence = Number(
      ["Executive presence", "Communication"].includes(state.profile.focus),
    );
    features.goal_style = Number(state.profile.focus === "Personal style");
    features.goal_etiquette = Number(state.profile.focus === "Etiquette");
  }
  return features;
}
/** Uses exported learned weights; no defaults or imagined media observations. */
export function inferDecisions(
  features: Record<string, number>,
  consent: boolean,
  threshold = 0.7,
  heads: DecisionModel["heads"] = model.heads,
): Decision[] {
  if (!Number.isFinite(threshold) || threshold < 0.7 || threshold > 0.99)
    throw Error("Confidence threshold must be between 0.70 and 0.99.");
  for (const [key, value] of Object.entries(features))
    if (
      !Object.prototype.hasOwnProperty.call(model.features, key) ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    )
      throw Error("Invalid observation: " + key);
  return heads.map((head) => {
    const reasons: string[] = [];
    if (!consent) reasons.push("Consent is off");
    const missing = [...new Set([...head.inputs, "evidence_quality"])].filter(
      (key) => features[key] === undefined,
    );
    if (missing.length)
      reasons.push(
        "Missing: " +
          missing.map((key) => model.features[key].label).join(", "),
      );
    if (
      features.evidence_quality !== undefined &&
      features.evidence_quality < 0.35
    )
      reasons.push("Observation quality is too low");
    let value: string | null = null,
      probabilities: Record<string, number> | null = null,
      confidence = 0;
    if (!reasons.length) {
      const x = [1, ...head.inputs.map((key) => 2 * features[key] - 1)];
      const logits = head.weights.map(
        (w) => w.reduce((n, v, i) => n + v * x[i], 0) / head.temperature,
      );
      const exp = logits.map((z) => Math.exp(z - Math.max(...logits))),
        sum = exp.reduce((a, b) => a + b, 0);
      probabilities = Object.fromEntries(
        head.options.map((option, i) => [option, exp[i] / sum]),
      );
      confidence = Math.max(...Object.values(probabilities));
      if (confidence >= Math.max(threshold, head.threshold))
        value = head.options[exp.indexOf(Math.max(...exp))];
      else reasons.push("Below the confidence threshold");
      if (
        head.id === "blazer_recommendation" &&
        value === "add" &&
        (features.blazer_available ?? 0) < 0.5
      ) {
        value = null;
        reasons.push("No suitable blazer is available");
      }
    }
    return {
      id: head.id,
      title: head.title,
      family: head.family,
      value,
      confidence,
      probabilities,
      reasons,
      action: value ? (head.actions[value] ?? null) : null,
    };
  });
}
export function coachDecisions(state: State, now = new Date()) {
  const features = featureState(state, now);
  const manual = freshObservations(state.aiCoach?.observations ?? {}, now);
  const media = mediaFeatures(state.aiCoach?.mediaReports, now);
  return decisionModel.heads.map((head) => {
    const measured = head.inputs.filter(
      (key) => manual[key] === undefined && media[key],
    );
    const perHead = { ...features };
    if (measured.length)
      perHead.evidence_quality = Math.min(
        features.evidence_quality ?? 1,
        ...measured.map((key) => media[key].reliability),
      );
    return inferDecisions(perHead, state.aiCoach?.consent === true, 0.7, [
      head,
    ])[0];
  });
}
export function suggestedExercise(state: State, now = new Date()) {
  if (!state.aiCoach?.consent) return null;
  const next = coachDecisions(state, now).find((d) => d.id === "next_exercise");
  const map: Record<string, string> = {
    posture_reset: "posture",
    short_introduction: "introduction",
    listening_drill: "listening",
  };
  return next?.value
    ? { id: map[next.value], confidence: next.confidence }
    : null;
}
