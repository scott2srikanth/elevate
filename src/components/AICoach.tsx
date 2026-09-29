import { CoachSpot } from "./CoachAvatar";
import { MediaObservation } from "./MediaObservation";
import { mediaGuidance } from "../intelligence/observation";
import React, { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Text, Pressable } from "../i18n";
import { exercises, recommend, type Exercise, type State } from "../coach";
import { learningProgress } from "../learning";
import { stagePlan } from "../development";
import { buildCoachAnalysis } from "../aiCoach";
import {
  coachDecisions,
  decisionModel,
  freshObservations,
} from "../intelligence/engine";
import type { StudioKind } from "../shared/analysis";
import { Action, Choice, Consent, k } from "./kit";
import { AnalysisView } from "./StudioVisuals";
const derived = new Set([
  "goal_presence",
  "goal_style",
  "goal_etiquette",
  "time_available",
  "practice_recent",
  "progress",
]);
const standard = [
  "posture",
  "intro_ready",
  "listening",
  "pace",
  "fit",
  "greeting",
  "fatigue",
  "evidence_quality",
];
export type CoachView =
  "overview" | "recordings" | "self-check" | "progress" | "settings" | "report";
export function AICoach({
  state,
  update,
  onPractice,
  view = "overview",
  onNavigate,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
  onPractice: (exercise: Exercise) => void;
  view?: CoachView;
  onNavigate: (view: CoachView) => void;
}) {
  const kind: StudioKind =
    view === "recordings" || view === "self-check" ? "media" : "coach";
  const wide = useWindowDimensions().width >= 1100;
  const [savedDetails, setSavedDetails] = useState(false);
  const [, setNow] = useState(() => new Date());
  const now = new Date();
  const [details, setDetails] = useState(false),
    [allInputs, setAllInputs] = useState(false),
    [notice, setNotice] = useState("");
  const [group, setGroup] = useState("Presentation");
  const consent = state.aiCoach?.consent === true;
  const observations = freshObservations(
    state.aiCoach?.observations ?? {},
    now,
  );
  const skills = learningProgress(state, exercises, now),
    stage = stagePlan(state, now),
    rec = recommend(state, now);
  const decisions = coachDecisions(state, now),
    accepted = decisions.filter((d) => d.value !== null);
  const analysis = consent ? buildCoachAnalysis(state, kind, now) : null;
  const latest = state.assessments.find(
    (a) => a.kind.startsWith("AI Coach") && a.analysis?.kind === kind,
  );
  function rating(key: string, value: number | null) {
    const at = new Date();
    setNow(at);
    setNotice("");
    update((s) => {
      const observations = { ...s.aiCoach.observations };
      if (value === null) delete observations[key];
      else observations[key] = { value, at: at.toISOString() };
      return { ...s, aiCoach: { ...s.aiCoach, observations } };
    });
  }
  function save() {
    if (!analysis) return;
    update((s) => {
      if (
        s.assessments.some(
          (a) =>
            a.kind.startsWith("AI Coach") &&
            JSON.stringify(a.analysis) === JSON.stringify(analysis),
        )
      )
        return s;
      const next = {
        ...s,
        assessments: [
          {
            id: `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            at: new Date().toISOString(),
            kind: `AI Coach · ${kind}`,
            feedback: analysis.summary,
            analysis,
          },
          ...s.assessments,
        ],
      };
      return new TextEncoder().encode(JSON.stringify(next)).length <= 900000
        ? next
        : s;
    });
    // The rendered history below is the durable confirmation; do not claim network sync.
    setNotice(
      "Save requested. Saved plans are available in Resources & settings.",
    );
  }
  const keys = allInputs
    ? Object.keys(decisionModel.features).filter(
        (key) =>
          !derived.has(key) && decisionModel.features[key].group === group,
      )
    : standard;
  const guidance = mediaGuidance(state.aiCoach.mediaReports, now);
  const practiced = skills.filter((skill) => skill.evidenceDays > 0).length;
  const consentControl = (
    <Consent
      label="Use my reflections and self-checks with on-device AI Coach"
      value={consent}
      onChange={(value) =>
        update((s) => ({ ...s, aiCoach: { ...s.aiCoach, consent: value } }))
      }
    />
  );
  return (
    <View style={{ gap: 18 }}>
      {!consent && (
        <View style={u.card}>
          <Text accessibilityRole="header" style={k.title}>
            Make this space yours
          </Text>
          <Text style={k.body}>
            Use your goals and reflections to personalise your next practice.
          </Text>
          {consentControl}
          <Text style={k.muted}>
            You can change this anytime in Coach settings.
          </Text>
        </View>
      )}
      {view === "overview" && (
        <>
          {consent && (
            <View style={u.hero}>
              <View style={u.between}>
                <Text style={u.heroLabel}>YOUR NEXT PRACTICE</Text>
                <Text style={u.time}>{rec.exercise.minutes} MIN</Text>
              </View>
              <Text accessibilityRole="header" style={u.heroTitle}>
                {rec.exercise.title}
              </Text>
              <Text style={u.heroBody}>{rec.reason}</Text>
              <CoachSpot
                id="coach-practice"
                label="Start practice"
                detail={rec.reason}
                priority={1}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Start recommended practice"
                  onPress={() => onPractice(rec.exercise)}
                  style={u.primary}
                >
                  <Text style={u.primaryText}>Start practice →</Text>
                </Pressable>
              </CoachSpot>
            </View>
          )}
          <View style={u.stats}>
            <View style={u.stat}>
              <Text style={u.statValue}>{stage.index + 1} / 8</Text>
              <Text style={k.muted}>Current stage</Text>
            </View>
            <View style={u.stat}>
              <Text style={u.statValue}>{practiced}</Text>
              <Text style={k.muted}>Skills practised</Text>
            </View>
            <View style={u.stat}>
              <Text style={u.statValue}>
                {skills.filter((skill) => skill.due).length}
              </Text>
              <Text style={k.muted}>Reviews due</Text>
            </View>
          </View>
          <View style={[{ gap: 14 }, wide && { flexDirection: "row" }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Check a recording"
              onPress={() => onNavigate("recordings")}
              style={[u.card, { flex: 1 }]}
            >
              <Text style={u.eyebrow}>OBSERVE</Text>
              <Text style={u.cardTitle}>Check a recording</Text>
              <Text style={k.body}>
                Get feedback on camera setup and voice from a photo, video or
                audio file.
              </Text>
              <Text style={u.link}>Open recording check →</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Update my self-check"
              onPress={() => onNavigate("self-check")}
              style={[u.card, { flex: 1 }]}
            >
              <Text style={u.eyebrow}>REFLECT</Text>
              <Text style={u.cardTitle}>How are you feeling?</Text>
              <Text style={k.body}>
                Add a quick self-check to give your coach more context.
              </Text>
              <Text style={u.link}>Update self-check →</Text>
            </Pressable>
          </View>
          {consent && (
            <View style={u.summaryRow}>
              <Action title="Save coaching plan" onPress={save} secondary />
              <Action
                title="View plan details"
                onPress={() => onNavigate("report")}
                secondary
              />
              {latest && (
                <Text style={k.muted}>
                  Last saved {new Date(latest.at).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
        </>
      )}
      {view === "recordings" && consent && (
        <>
          <View style={u.mediaCard}>
            <MediaObservation
              onReport={(report) =>
                update((s) =>
                  s.aiCoach.consent
                    ? {
                        ...s,
                        aiCoach: {
                          ...s.aiCoach,
                          mediaReports: [
                            report,
                            ...(s.aiCoach.mediaReports ?? []).filter(
                              (r) => r.id !== report.id,
                            ),
                          ].slice(0, 10),
                        },
                      }
                    : s,
                )
              }
            />
          </View>
          {guidance.length > 0 && (
            <View style={u.card}>
              <Text style={u.eyebrow}>TRY ON YOUR NEXT TAKE</Text>
              {guidance.map((note) => (
                <Text key={note} style={k.body}>
                  {note}
                </Text>
              ))}
            </View>
          )}
          {!!state.aiCoach.mediaReports?.length && (
            <View style={u.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Saved recording checks"
                accessibilityState={{ expanded: savedDetails }}
                onPress={() => setSavedDetails(!savedDetails)}
                style={u.between}
              >
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={u.cardTitle}>Saved recording checks</Text>
                  <Text style={k.muted}>
                    {state.aiCoach.mediaReports.length} saved · measurements
                    only
                  </Text>
                </View>
                <Text style={k.title}>{savedDetails ? "−" : "+"}</Text>
              </Pressable>
              {savedDetails && (
                <>
                  {state.aiCoach.mediaReports.map((report) => (
                    <View key={report.id} style={u.divider}>
                      <Text style={k.label}>
                        {report.kind.toUpperCase()} ·{" "}
                        {new Date(report.at).toLocaleString()}
                      </Text>
                      <Text style={k.muted}>
                        {now.getTime() - Date.parse(report.at) >= 86400000
                          ? "Expired for coaching"
                          : "Active for 24 hours"}
                      </Text>
                      <Text style={k.body}>
                        {report.metrics
                          .filter((m) => m.reliability >= 0.7)
                          .map(
                            (m) =>
                              `${m.key.replace(/_/g, " ")}: ${m.value.toFixed(2)} ${m.unit}`,
                          )
                          .join(" · ") || "No reliable measurements."}
                      </Text>
                    </View>
                  ))}
                  <Action
                    title="Clear saved media observations"
                    secondary
                    onPress={() =>
                      update((s) => ({
                        ...s,
                        aiCoach: { ...s.aiCoach, mediaReports: [] },
                      }))
                    }
                  />
                </>
              )}
            </View>
          )}
        </>
      )}
      {view === "progress" && (
        <View style={u.card}>
          <View style={u.between}>
            <Text accessibilityRole="header" style={k.title}>
              Your progression
            </Text>
            <Text style={u.badge}>Stage {stage.index + 1} of 8</Text>
          </View>
          <Text style={k.body}>
            {stage.complete
              ? "Current curriculum complete."
              : `${stage.remaining.length} skills to complete this stage.`}
          </Text>
          <View
            style={u.stageTrack}
            accessibilityLabel={`Stage ${stage.index + 1} of 8`}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <View
                key={i}
                style={[
                  u.stageStep,
                  i <= stage.index && { backgroundColor: "#56734D" },
                ]}
              />
            ))}
          </View>
          <Text style={k.muted}>
            Progress comes from real-world reflections. Confidence ratings
            describe your experience, not measured mastery.
          </Text>
          {skills.map((skill) => (
            <View key={skill.exerciseId} style={u.divider}>
              <View style={u.between}>
                <Text style={[k.label, { flex: 1 }]}>{skill.title}</Text>
                {skill.due && <Text style={u.badge}>Review due</Text>}
              </View>
              {skill.evidenceDays > 0 && (
                <Text style={k.body}>
                  {`${skill.evidenceDays} practice days · Recent confidence ${skill.average}/5`}
                </Text>
              )}
              {skill.trend !== null && (
                <Text style={k.muted}>
                  Confidence change: {skill.trend > 0 ? "+" : ""}
                  {skill.trend}/5
                </Text>
              )}
              {skill.dueAt && !skill.due && (
                <Text style={k.muted}>
                  Next review {new Date(skill.dueAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
      {view === "self-check" && consent && (
        <View style={u.card}>
          <Text accessibilityRole="header" style={k.title}>
            A quick check-in
          </Text>
          <Text style={k.body}>
            Rate what you know, from 1 (low) to 5 (high). Leave anything
            uncertain unanswered.
          </Text>
          <View style={u.between}>
            <Text style={u.badge}>Saves automatically</Text>
            <Action
              title={allInputs ? "Quick check" : "More topics"}
              secondary
              onPress={() => setAllInputs(!allInputs)}
            />
          </View>
          {allInputs && (
            <View style={k.row}>
              {[
                ...new Set(
                  Object.values(decisionModel.features).map((f) => f.group),
                ),
              ]
                .filter((name) => name !== "Goals")
                .map((name) => (
                  <Choice
                    key={name}
                    title={name}
                    selected={group === name}
                    onPress={() => setGroup(name)}
                  />
                ))}
            </View>
          )}
          {keys.map((key) => (
            <View key={key} style={u.divider}>
              <Text style={k.label}>{decisionModel.features[key].label}</Text>
              <View style={u.ratings}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`${decisionModel.features[key].label}: ${value}/5`}
                    accessibilityState={{
                      selected: observations[key] === (value - 1) / 4,
                    }}
                    aria-pressed={observations[key] === (value - 1) / 4}
                    onPress={() => rating(key, (value - 1) / 4)}
                    style={[
                      u.rating,
                      observations[key] === (value - 1) / 4 && u.ratingSelected,
                    ]}
                  >
                    <Text
                      style={[
                        k.label,
                        observations[key] === (value - 1) / 4 && {
                          color: "#fff",
                        },
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {observations[key] !== undefined && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Clear ${decisionModel.features[key].label}`}
                  onPress={() => rating(key, null)}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text style={u.link}>Reset answer</Text>
                </Pressable>
              )}
            </View>
          ))}
          <Text style={k.muted}>
            Context and fatigue reset after 24 hours; other answers after seven
            days.
          </Text>
          <Action
            title="Back to my plan"
            onPress={() => onNavigate("overview")}
          />
          <Action
            title="Clear saved self-checks"
            secondary
            onPress={() =>
              update((s) => ({
                ...s,
                aiCoach: { ...s.aiCoach, observations: {} },
              }))
            }
          />
        </View>
      )}
      {view === "settings" && (
        <View style={u.card}>
          <Text accessibilityRole="header" style={k.title}>
            Coach settings
          </Text>
          {consent && consentControl}
          <Text style={k.body}>
            Media stays on your device. Saved measurements and coaching history
            follow your account sync settings.
          </Text>
          <Text style={k.muted}>
            This experimental model uses synthetic training examples. Recording
            analysis measures camera setup and speech signals; it does not judge
            personality, emotions or attractiveness.
          </Text>
          <Action
            title={details ? "Hide model details" : "Model details"}
            secondary
            onPress={() => setDetails(!details)}
          />
          {details && (
            <>
              <Text style={k.label}>
                {accepted.length} of 50 decisions have enough evidence
              </Text>
              <Text style={k.muted}>
                The 70% model threshold is experimental, not validated coaching
                accuracy. Missing or uncertain inputs are withheld.
              </Text>
              {decisions.map((d) => (
                <View key={d.id} style={u.divider}>
                  <Text style={k.label}>{d.title}</Text>
                  <Text style={k.body}>
                    {d.value
                      ? `${d.value.replace(/_/g, " ")} · ${(d.confidence * 100).toFixed(1)}% model confidence`
                      : d.reasons.join(". ")}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
      {view === "report" && analysis && (
        <>
          <Action
            title="Back to overview"
            onPress={() => onNavigate("overview")}
            secondary
          />
          <AnalysisView analysis={analysis} />
          <Action title="Save coaching plan" onPress={save} />
        </>
      )}
      {!!notice && (
        <Text accessibilityRole="alert" style={k.message}>
          {notice}
        </Text>
      )}
    </View>
  );
}
const u = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E5DC",
    borderRadius: 18,
    padding: 22,
    gap: 14,
  },
  hero: { backgroundColor: "#304A3C", borderRadius: 22, padding: 26, gap: 18 },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "700",
    color: "#D2DFC7",
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: "#fff",
    maxWidth: 620,
  },
  heroBody: { fontSize: 14, lineHeight: 23, color: "#EDF2E8", maxWidth: 650 },
  time: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E4EEDB",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#43614E",
  },
  primary: {
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#E6EECB",
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  primaryText: { fontSize: 14, fontWeight: "700", color: "#2C4634" },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  stats: {
    flexDirection: "row",
    gap: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#DCE3D6",
  },
  stat: { flex: 1, padding: 16, gap: 5, backgroundColor: "#F0F3EB" },
  statValue: { fontSize: 24, fontWeight: "600", color: "#344C3D" },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "#69785F",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#304A3C",
    lineHeight: 26,
  },
  link: { fontSize: 13, fontWeight: "600", color: "#375C42" },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  mediaCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E5DC",
    overflow: "hidden",
  },
  divider: {
    borderTopWidth: 1,
    borderColor: "#E8ECE4",
    paddingTop: 16,
    gap: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#465E3D",
    backgroundColor: "#ECF1E6",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  stageTrack: { flexDirection: "row", gap: 5 },
  stageStep: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    backgroundColor: "#E7EBE2",
  },
  ratings: { flexDirection: "row", gap: 8 },
  rating: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F0",
    borderWidth: 1,
    borderColor: "#DCE4D5",
    borderRadius: 10,
  },
  ratingSelected: { backgroundColor: "#3E5B43", borderColor: "#3E5B43" },
});
