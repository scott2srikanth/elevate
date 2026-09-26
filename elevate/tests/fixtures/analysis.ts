import type { CoachingAnalysis, StudioKind } from "../../src/shared/analysis";
export function exampleAnalysis(kind: StudioKind = "weekly"): CoachingAnalysis {
  return {
    version: 1,
    kind,
    title: "Make space for your next sentence",
    summary: "Use a short pause to make your introduction easier to follow.",
    evidence: ["You described rushing the end of your introduction."],
    strengths: ["You noticed a specific moment you can practice."],
    opportunities: ["Try a pause before your final point."],
    limitations: ["This example uses supplied notes, not an audio assessment."],
    charts: [
      {
        title: "Your suggested practice rhythm",
        type: "bar",
        unit: "minutes",
        max: 5,
        basis: "suggested",
        explanation: "Suggested practice times, not measured results.",
        points: [
          { label: "Prepare", value: 1 },
          { label: "Rehearse", value: 2 },
          { label: "Reflect", value: 1 },
        ],
      },
      {
        title: "Reported confidence over time",
        type: "trend",
        unit: "confidence / 5",
        max: 5,
        basis: "self_reported",
        explanation:
          "Example self-reports from Monday and Friday; not an objective assessment.",
        points: [
          { label: "Monday", value: 2 },
          { label: "Friday", value: 3 },
        ],
      },
    ],
    diagram: {
      title: "From preparation to real life",
      steps: [
        {
          title: "Choose a message",
          detail: "Write one sentence that names your main idea.",
          image: "reflection",
        },
        {
          title: "Say it out loud",
          detail: "Pause once before your final point.",
          image: "speaking",
        },
        {
          title: "Try it in conversation",
          detail: "Use your sentence in your next team conversation.",
          image: "conversation",
        },
      ],
    },
    visualGuides: [
      {
        image: "speaking",
        title: "Create space to speak",
        caption: "A simple recording setup gives you space to rehearse.",
        tryThis: "Keep the camera near eye level and practice one sentence.",
      },
      {
        image: "posture",
        title: "Choose a comfortable stance",
        caption: "A relaxed stance is one way to prepare for a conversation.",
        tryThis:
          "Let your shoulders rest comfortably; adapt this to your body.",
      },
    ],
    actions: [
      {
        title: "Practice one clear introduction",
        when: "Before your next meeting",
        steps: [
          "Write your opening sentence.",
          "Say it once, with a pause before the final point.",
        ],
        reflection: "What changed when you paused?",
      },
    ],
  };
}
