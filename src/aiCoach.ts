import { mediaGuidance, currentMedia } from "./intelligence/observation";
import { exercises, recommend, type State } from "./coach";
import { stagePlan } from "./development";
import { learningProgress, validReflections } from "./learning";
import { coachDecisions } from "./intelligence/engine";
import {
  analysisSchema,
  type CoachingAnalysis,
  type StudioKind,
} from "./shared/analysis";
export function buildCoachAnalysis(
  state: State,
  kind: StudioKind = "coach",
  now = new Date(),
): CoachingAnalysis {
  if (!state.aiCoach?.consent)
    throw Error("Enable on-device AI Coach before generating analysis.");
  const progress = learningProgress(state, exercises, now);
  const rec = recommend(state, now),
    stage = stagePlan(state, now);
  const recent = validReflections(state, now).filter(
    (r) => Date.parse(r.at) >= now.getTime() - 7 * 86400000,
  );
  const decisions = coachDecisions(state, now);
  const accepted = decisions.filter((d) => d.value !== null);
  const guidance = mediaGuidance(state.aiCoach.mediaReports, now);
  const evidence = [
    `${currentMedia(state.aiCoach.mediaReports, now).length} media observations in the last 24 hours; raw files are not saved.`,
    `${recent.length} recorded real-world practices in the last seven days.`,
    `Stage ${stage.index + 1} of 8: ${stage.complete ? "the current curriculum is complete" : stage.remaining.length + " skills still need a qualifying reflection"}.`,
    `${accepted.length} of 50 experimental model decisions have sufficient current observations and confidence.`,
  ];
  const strengths = progress
    .filter((p) => p.status === "consistent_self_report")
    .slice(0, 4)
    .map(
      (p) =>
        `${p.title}: confidence at least 4/5 across three different practice days. This is self-report, not measured mastery.`,
    );
  const opportunities = progress
    .filter((p) => p.status === "needs_support" || p.due)
    .slice(0, 4)
    .map(
      (p) =>
        `${p.title}: ${p.status === "needs_support" ? "try a smaller repetition based on your latest difficult reflection" : "a spaced review is due"}.`,
    );
  opportunities.push(...guidance.slice(0, 2));
  const actions: CoachingAnalysis["actions"] = [
    {
      title: rec.exercise.title,
      when: `Next practice · ${rec.exercise.minutes} minutes`,
      steps: rec.exercise.steps,
      reflection: rec.exercise.challenge,
    },
  ];
  for (const d of accepted
    .filter((d) => d.action && d.id !== "next_exercise")
    .slice(0, 2))
    actions.push({
      title: d.title,
      when: "When relevant to your current occasion",
      steps: [d.action!],
      reflection:
        "After trying it, record what felt useful and what you would change.",
    });
  return analysisSchema.parse({
    version: 1,
    kind,
    title:
      kind === "weekly"
        ? "Your adaptive weekly review"
        : kind === "media"
          ? "Your presentation observations"
          : "Your AI Coach plan",
    summary: rec.reason,
    evidence,
    strengths,
    opportunities: opportunities.slice(0, 5),
    limitations: [
      "This small model was trained on synthetic examples. Its probabilities are not validated coaching accuracy.",
      "Confidence ratings describe your own experience; they do not measure skill mastery. Curriculum milestones still require real-world reflections.",
      "Media analysis measures camera setup and recording signals using pretrained pose and speech-activity models. It does not judge personality, emotion, attractiveness, speaking content, or skill mastery. Reliability thresholds and feature mappings are experimental.",
      `${50 - accepted.length} model decisions were withheld because consent, evidence, freshness or confidence requirements were not met.`,
    ],
    charts: recent.length
      ? [
          {
            title: "Recent practice confidence",
            type: "trend",
            unit: "confidence / 5",
            max: 5,
            basis: "self_reported",
            explanation:
              "Your last six reflections in the past seven days, ordered by time. A higher rating is not proof of better performance.",
            points: recent
              .slice(0, 6)
              .reverse()
              .map((r) => ({
                label: new Date(r.at).toLocaleDateString(),
                value: r.confidence,
              })),
          },
        ]
      : [],
    diagram: {
      title: "Your learning loop",
      steps: [
        {
          title: "Practice",
          detail: rec.exercise.description,
          image: "speaking",
        },
        {
          title: "Try it in real life",
          detail: rec.exercise.challenge,
          image: "conversation",
        },
        {
          title: "Reflect and adapt",
          detail:
            "Record confidence and context. Your next recommendation is recalculated from the new evidence.",
          image: "reflection",
        },
      ],
    },
    visualGuides: [
      {
        image:
          rec.exercise.area === "Personal style"
            ? "style"
            : rec.exercise.id === "posture"
              ? "posture"
              : "speaking",
        title: rec.exercise.title,
        caption: rec.exercise.description,
        tryThis: rec.exercise.steps[0],
      },
    ],
    actions,
  });
}
