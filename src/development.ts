import type { Exercise, State } from "./coach";
import { weeks } from "./curriculum";
export function stagePlan(state: State) {
  let after = 0;
  for (let index = 0; index < weeks.length; index++) {
    const week = weeks[index];
    const remaining = week.ids.filter(
      (id) =>
        !state.reflections.some(
          (r) =>
            r.exerciseId === id &&
            r.confidence >= 3 &&
            Date.parse(r.at) >= after,
        ),
    );
    if (remaining.length) return { index, after, remaining, complete: false };
    const dates = week.ids.map((id) =>
      Math.min(
        ...state.reflections
          .filter(
            (r) =>
              r.exerciseId === id &&
              r.confidence >= 3 &&
              Date.parse(r.at) >= after,
          )
          .map((r) => Date.parse(r.at)),
      ),
    );
    after = Math.max(...dates) + 1;
  }
  return { index: 7, after, remaining: [] as string[], complete: true };
}
export function adaptiveStage(state: State) {
  return stagePlan(state).index;
}
export function practiceForTime(exercise: Exercise, minutes: number): Exercise {
  return minutes >= exercise.minutes
    ? exercise
    : {
        ...exercise,
        minutes,
        steps: [
          exercise.steps[0],
          `Try one short repetition of this step: ${exercise.steps[exercise.steps.length - 1]}`,
        ],
        description: `A ${minutes}-minute version. ${exercise.description}`,
      };
}
export function reflectionSignals(state: State) {
  const text = [
    ...state.reflections
      .slice(0, 8)
      .map((r) => `${r.confidence <= 3 ? r.note : ""} ${r.next}`),
    ...state.reviews.slice(0, 2).map((r) => `${r.obstacle} ${r.commitment}`),
  ]
    .join(" ")
    .toLowerCase();
  const signals: { label: string; id: string; re: RegExp }[] = [
    {
      label: "Speaking pace and clarity",
      id: "story",
      re: /\b(rush|rushed|rushing|fast|rambl|clarity|unclear)/,
    },
    {
      label: "Listening and turn-taking",
      id: "listening",
      re: /\b(interrupt|interrupted|listen|listening)/,
    },
    {
      label: "Introductions",
      id: "introduction",
      re: /\b(introduction|introduce|intro)\b/,
    },
    {
      label: "Preparation and clothing",
      id: "wardrobe",
      re: /\b(outfit|clothing|wardrobe|dress)\b/,
    },
    {
      label: "Dining confidence",
      id: "dining",
      re: /\b(dining|utensil|dinner)\b/,
    },
  ];
  return signals.filter((x) => x.re.test(text));
}
export function weeklySummary(state: State, now = new Date()) {
  const recent = state.reflections.filter(
    (r) =>
      Date.parse(r.at) >= now.getTime() - 7 * 86400000 &&
      Date.parse(r.at) <= now.getTime(),
  );
  return {
    count: recent.length,
    days: new Set(recent.map((r) => new Date(r.at).toDateString())).size,
    average: recent.length
      ? Math.round(
          (recent.reduce((n, r) => n + r.confidence, 0) / recent.length) * 10,
        ) / 10
      : null,
    signals: reflectionSignals(state),
    reviewDue:
      !state.reviews[0] ||
      now.getTime() - Date.parse(state.reviews[0].at) >= 7 * 86400000,
  };
}
export function outfitSuggestion(state: State, occasion: string) {
  const pick = (category: string) =>
    state.wardrobe.find((g) => g.category === category);
  const pieces = [
    "Tops",
    "Bottoms",
    "Shoes",
    ...(/meeting|interview|presentation/i.test(occasion) ? ["Layers"] : []),
  ]
    .map(pick)
    .filter((g) => !!g);
  return {
    pieces,
    missing: ["Tops", "Bottoms", "Shoes"].filter((c) => !pick(c)),
    reason: `A starting combination from pieces you own for ${occasion.toLowerCase()}. Confirm the actual dress code, comfort, and weather; garment names alone cannot establish fit or formality.`,
  };
}
export function brandStatement(
  name: string,
  role: string,
  audience: string,
  expertise: string,
  value: string,
) {
  return `${name}${role ? `, ${role},` : ""} helps ${audience.trim()} ${value.trim()} through ${expertise.trim()}.`;
}
export const diningScenarios = [
  {
    id: "host",
    question:
      "At a hosted dinner, your plate arrives first. What is a thoughtful next step?",
    options: [
      "Begin immediately",
      "Look to the host and wait for a cue",
      "Tell everyone to start",
    ],
    answer: 1,
    explanation:
      "Observe the host. They may invite you to begin while your food is hot; customs and circumstances vary.",
  },
  {
    id: "cutlery",
    question:
      "At a formal multi-course setting, you are unsure which utensil to use.",
    options: [
      "Quietly ask the staff",
      "Copy a rule even if the course differs",
      "Avoid eating",
    ],
    answer: 0,
    explanation:
      "Asking discreetly is appropriate. Outside-in often follows course order, but the menu and setting matter.",
  },
  {
    id: "diet",
    question:
      "You have a dietary restriction before a business dinner. What helps?",
    options: [
      "Assume the venue knows",
      "Tell the host or venue privately beforehand",
      "Explain everyone’s diet at the table",
    ],
    answer: 1,
    explanation:
      "Advance, private communication helps the host and venue plan without drawing unnecessary attention.",
  },
  {
    id: "phone",
    question: "You expect an urgent call during a shared meal.",
    options: [
      "Leave the phone on speaker",
      "Briefly explain, keep it silent, and step away if needed",
      "Keep checking every minute",
    ],
    answer: 1,
    explanation:
      "A brief explanation and discreet exit balance your responsibilities with attention to others.",
  },
];
export const cultureGuides: Record<
  string,
  { note: string; tips: string[]; source: string }
> = {
  "Ask the host": {
    note: "People and organizations vary more than a country label can capture.",
    tips: [
      "Ask about dress, timing, dietary needs, and accessibility.",
      "Observe and politely check unfamiliar conventions.",
      "Use the name, title, greeting, and pronouns a person prefers.",
    ],
    source: "https://www.trade.gov/country-commercial-guides",
  },
  Japan: {
    note: "Formal business settings may place particular emphasis on introductions and respectful handling of business cards.",
    tips: [
      "Let your host guide introductions and seating.",
      "Receive a business card attentively and take a moment to read it.",
      "Confirm expectations with your local contact rather than assuming.",
    ],
    source:
      "https://www.trade.gov/country-commercial-guides/japan-business-travel",
  },
  India: {
    note: "Language, region, organization, religion, and individual preference all affect the context.",
    tips: [
      "Confirm dietary preferences without making assumptions.",
      "Ask how your contact prefers to be addressed.",
      "Check the venue’s dress and timing expectations in advance.",
    ],
    source:
      "https://www.trade.gov/country-commercial-guides/india-business-travel",
  },
  "United States": {
    note: "Business conventions differ by industry, region, and organization.",
    tips: [
      "Arrive at the agreed time and communicate delays.",
      "Keep an introduction concise and invite questions.",
      "Check the dress code with the organizer.",
    ],
    source: "https://www.trade.gov/country-commercial-guides",
  },
  "United Kingdom": {
    note: "Follow the host’s level of formality and avoid assumptions about individual preferences.",
    tips: [
      "Use a polite introduction and let familiarity develop.",
      "Respect conversational turns and personal space.",
      "Ask your host about unfamiliar meal conventions.",
    ],
    source:
      "https://www.trade.gov/country-commercial-guides/united-kingdom-business-travel",
  },
};
