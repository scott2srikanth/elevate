import { stagePlan, practiceForTime, reflectionSignals } from "./development";
export { weeks } from "./curriculum";
export const AREAS = [
  "Executive presence",
  "Communication",
  "Personal style",
  "Etiquette",
] as const;
export type Area = (typeof AREAS)[number];
export type Profile = {
  name: string;
  role: string;
  goal: string;
  context: string;
  minutes: number;
  focus: Area;
  confidence: number;
  startedAt: string;
};
export type Reflection = {
  id: string;
  exerciseId: string;
  at: string;
  confidence: number;
  note: string;
  next: string;
  situation: string;
};
export type Assignment = { exerciseId: string; rehearsedAt: string };
export type Garment = {
  id: string;
  name: string;
  category: string;
  color: string;
  mediaId?: string;
};
export type Occasion = {
  id: string;
  title: string;
  date: string;
  checked: string[];
};
export type State = {
  version: 1;
  profile: Profile | null;
  reflections: Reflection[];
  assignment: Assignment | null;
  learned: string[];
  wardrobe: Garment[];
  occasions: Occasion[];
  reviews: {
    id: string;
    at: string;
    win: string;
    obstacle: string;
    commitment: string;
    focus: Area;
  }[];
  memories: { id: string; text: string; at: string }[];
  assessments: {
    id: string;
    at: string;
    kind: string;
    feedback: string;
    mediaId?: string;
  }[];
  brand: {
    audience: string;
    expertise: string;
    value: string;
    statement: string;
  };
  preferences: {
    reminderHour: number;
    reminderMinute: number;
    reminders: boolean;
    retentionDays: number;
    culture: string;
  };
  scenarioResults: { id: string; correct: boolean; at: string }[];
};
export type Exercise = {
  id: string;
  title: string;
  area: Area;
  minutes: number;
  description: string;
  lesson: string;
  steps: string[];
  challenge: string;
  icon: string;
};
export const exercises: Exercise[] = [
  {
    id: "introduction",
    title: "An introduction that feels like you",
    area: "Executive presence",
    minutes: 5,
    description: "Make your first 30 seconds clear, calm, and memorable.",
    lesson:
      "A useful introduction gives people three things: your name, what you contribute, and a reason to connect. Presence comes from clarity and attention—not a particular accent, body type, or personality.",
    steps: [
      "Write one sentence about the work you do and who it helps.",
      "Say your name, your contribution, and one question for the other person.",
      "Rehearse twice. Pause before you begin and leave room for a response.",
    ],
    challenge:
      "Use your introduction with a colleague or someone new. Notice which part opens a conversation.",
    icon: "mic-outline",
  },
  {
    id: "listening",
    title: "Make space for the other voice",
    area: "Communication",
    minutes: 4,
    description: "Listen fully. Respond with intention.",
    lesson:
      "Active listening is observable: let someone finish, reflect one idea back, and ask a relevant question. Eye contact is optional; choose attentive behaviors that work for your comfort and accessibility needs.",
    steps: [
      "Think of a conversation you have today.",
      "Practice: “What I’m hearing is…” followed by a short summary.",
      "Prepare one open question that starts with what or how.",
    ],
    challenge:
      "In your next conversation, summarize the other person’s point before adding your own.",
    icon: "chatbubbles-outline",
  },
  {
    id: "wardrobe",
    title: "Build your reliable outfit",
    area: "Personal style",
    minutes: 6,
    description: "Less second-guessing. More feeling prepared.",
    lesson:
      "An effective outfit suits the occasion, your comfort, and your actual wardrobe. Start with the stated dress code, then check fit and condition. Professional presentation does not require expensive brands or gendered rules.",
    steps: [
      "Choose an upcoming occasion and check its dress code.",
      "Combine a comfortable top, bottom, and appropriate shoes from your wardrobe.",
      "Check movement, clothing condition, and whether you feel at ease.",
    ],
    challenge:
      "Wear your combination to a relevant occasion. Record what felt comfortable and what you would adjust.",
    icon: "shirt-outline",
  },
  {
    id: "dining",
    title: "Feel at ease at the table",
    area: "Etiquette",
    minutes: 5,
    description: "Bring attention to the people, not just the place setting.",
    lesson:
      "Dining conventions vary by host, venue, and culture. In a formal multi-course setting, cutlery often follows the order of service from outside inward. When uncertain, observe the host or quietly ask the staff.",
    steps: [
      "Picture arriving at a hosted dinner; prepare a warm greeting.",
      "Rehearse asking staff a discreet question about a dish or utensil.",
      "Prepare two inclusive conversation questions.",
    ],
    challenge:
      "At your next shared meal, put your phone away and ask a thoughtful question. Follow your host’s cues.",
    icon: "restaurant-outline",
  },
  {
    id: "posture",
    title: "Find your grounded presence",
    area: "Executive presence",
    minutes: 3,
    description: "A small reset before a meaningful moment.",
    lesson:
      "A comfortable, supported position can help you focus. There is no single correct posture for every body. Adapt this exercise seated or standing and use movement that feels comfortable.",
    steps: [
      "Find a supported seated or standing position.",
      "Let your shoulders settle and take three comfortable breaths.",
      "Rehearse one opening sentence with a brief pause before speaking.",
    ],
    challenge:
      "Use your reset before your next meeting, then notice whether it helped you feel ready.",
    icon: "body-outline",
  },
  {
    id: "story",
    title: "Say the point, then the story",
    area: "Communication",
    minutes: 5,
    description: "Give your ideas a shape people can follow.",
    lesson:
      "Lead with the main point, add one concrete example, then explain the next step. A simple structure helps your listener follow your thinking without forcing a particular speaking style.",
    steps: [
      "Choose one update you need to share.",
      "Draft your point, a short example, and the next step.",
      "Say it aloud and remove any detail that distracts from your point.",
    ],
    challenge:
      "Use this structure in one real update. Ask a listener what they understood as the main point.",
    icon: "megaphone-outline",
  },
  {
    id: "grooming",
    title: "Create your ready-to-go ritual",
    area: "Personal style",
    minutes: 4,
    description: "A repeatable checklist for busy mornings.",
    lesson:
      "A preparation ritual reduces last-minute decisions. Focus on clothing condition, shoes, and the grooming choices that fit your preferences. Keep fragrance considerate of shared spaces and sensitivities.",
    steps: [
      "Pick three preparation checks that matter to you.",
      "Place the items you need together.",
      "Rehearse the routine and simplify one step.",
    ],
    challenge:
      "Use your ritual before leaving home. Note one change that made getting ready easier.",
    icon: "sparkles-outline",
  },
  {
    id: "network",
    title: "Turn a greeting into a connection",
    area: "Etiquette",
    minutes: 5,
    description: "One good question can be enough.",
    lesson:
      "Networking works best as a reciprocal conversation. Ask about the other person’s work, offer a relevant detail, and respect their time. Ask before exchanging contact information.",
    steps: [
      "Prepare an open question about a shared context.",
      "Practice sharing one relevant experience in two sentences.",
      "Rehearse a polite exit: “It was lovely talking with you.”",
    ],
    challenge:
      "Start one conversation at a meeting or event, and ask permission before following up.",
    icon: "people-outline",
  },
];
export function initialState(): State {
  return {
    version: 1,
    profile: null,
    reflections: [],
    assignment: null,
    learned: [],
    wardrobe: [],
    occasions: [],
    reviews: [],
    memories: [],
    assessments: [],
    scenarioResults: [],
    brand: { audience: "", expertise: "", value: "", statement: "" },
    preferences: {
      reminderHour: 9,
      reminderMinute: 0,
      reminders: false,
      retentionDays: 0,
      culture: "Ask the host",
    },
  };
}
export function dayKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function weekIndex(profile: Profile | null, now = new Date()) {
  if (!profile) return 0;
  return Math.min(
    7,
    Math.max(
      0,
      Math.floor(
        (now.getTime() - new Date(profile.startedAt).getTime()) / 604800000,
      ),
    ),
  );
}
export function recommend(state: State): {
  exercise: Exercise;
  reason: string;
} {
  if (state.assignment)
    return {
      exercise: exercises.find((e) => e.id === state.assignment!.exerciseId)!,
      reason:
        "You have rehearsed this. Your next step is to try it in real life.",
    };
  const last = state.reflections[0];
  if (last && last.confidence <= 2)
    return {
      exercise: practiceForTime(
        exercises.find((e) => e.id === last.exerciseId)!,
        state.profile?.minutes || 5,
      ),
      reason:
        "Your last reflection said this still felt difficult. Let’s try a smaller repetition.",
    };
  const signal = reflectionSignals(state).find(
    (signal) =>
      !state.profile ||
      exercises.find((e) => e.id === signal.id)?.area === state.profile.focus,
  );
  if (signal)
    return {
      exercise: practiceForTime(
        exercises.find((e) => e.id === signal.id)!,
        state.profile?.minutes || 5,
      ),
      reason: `Your recent reflections mention ${signal.label.toLowerCase()}. This is a transparent keyword-based suggestion; choose a different practice if it misses your meaning.`,
    };
  if (state.reflections.length > 0) {
    const plan = stagePlan(state);
    const stage = plan.index;
    const needed = plan.remaining[0];
    if (needed)
      return {
        exercise: practiceForTime(
          exercises.find((e) => e.id === needed)!,
          state.profile?.minutes || 5,
        ),
        reason: `This skill rounds out stage ${stage + 1} of your coaching path. You can choose another practice at any time.`,
      };
  }
  const pool = exercises.filter((e) => e.area === state.profile?.focus);
  const candidates = pool.length ? pool : exercises;
  const ranked = [...candidates].sort(
    (a, b) =>
      state.reflections.filter((r) => r.exerciseId === a.id).length -
      state.reflections.filter((r) => r.exerciseId === b.id).length,
  );
  return {
    exercise: practiceForTime(ranked[0], state.profile?.minutes || 5),
    reason: `Chosen for your focus on ${(state.profile?.focus || "executive presence").toLowerCase()} and your practice history.`,
  };
}
export function streak(reflections: Reflection[], now = new Date()) {
  const days = new Set(reflections.map((r) => dayKey(r.at)));
  let count = 0;
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
export function addReflection(state: State, reflection: Reflection): State {
  if (
    !state.assignment ||
    state.assignment.exerciseId !== reflection.exerciseId ||
    !reflection.note.trim() ||
    !reflection.situation.trim()
  )
    throw new Error(
      "Complete rehearsal and add a real-world reflection first.",
    );
  return {
    ...state,
    reflections: [reflection, ...state.reflections],
    assignment: null,
  };
}
export function occasionChecklist(title: string) {
  const dinner = /dinner/i.test(title);
  const interview = /interview/i.test(title);
  return [
    {
      time: "THE DAY BEFORE",
      items: [
        dinner
          ? "Check the venue and dietary arrangements"
          : "Confirm the location, time, and dress code",
        "Choose a comfortable outfit from your wardrobe",
        interview
          ? "Prepare two examples of your work"
          : "Rehearse your 30-second introduction",
      ],
    },
    {
      time: "BEFORE YOU LEAVE",
      items: [
        "Check clothing and shoes",
        "Review your route and allow arrival time",
        dinner
          ? "Prepare two inclusive conversation questions"
          : "Write down three useful talking points",
      ],
    },
    {
      time: "IN THE MOMENT",
      items: [
        "Pause and settle before you begin",
        dinner
          ? "Observe your host and ask when unsure"
          : "Listen fully before responding",
        "Notice one moment to reflect on afterward",
      ],
    },
  ];
}
