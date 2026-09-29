import { CoachSpot } from "./CoachAvatar";
import React, { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Text, Pressable } from "../i18n";
import type { Exercise, State } from "../coach";
import { WeeklyReview } from "./WeeklyReview";
import { AssessmentHistory, CoachMemory } from "./Studio";
import { AICoach, type CoachView } from "./AICoach";
import { Brand, Culture, Dining } from "./CoachingTools";
import { VideoLibrary } from "./VideoLibrary";
import { Choice, k } from "./kit";
const tabs = [
  ["Overview", "overview"],
  ["Recordings", "recordings"],
  ["Self-check", "self-check"],
  ["Progress", "progress"],
] as const;
export function CoachHub({
  state,
  update,
  onPractice,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
  onPractice: (exercise: Exercise) => void;
}) {
  const [section, setSection] = useState<
    | CoachView
    | "Videos"
    | "Weekly review"
    | "Dining"
    | "Cultural context"
    | "Personal brand"
    | "History"
    | "Memory"
  >("overview");
  const compact = useWindowDimensions().width < 600;
  const [more, setMore] = useState(false);
  const core = [
    "overview",
    "recordings",
    "self-check",
    "progress",
    "settings",
    "report",
  ].includes(section);
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Text style={s.eyebrow}>YOUR PERSONAL STUDIO</Text>
        <Text accessibilityRole="header" style={s.title}>
          AI coaching studio
        </Text>
        <Text style={k.body}>A clear next step, at your pace.</Text>
      </View>
      <View style={s.tabs}>
        {tabs.map(([label, value]) => (
          <CoachSpot
            key={value}
            id={`coach-${value}`}
            label={label}
            priority={value === "overview" ? 20 : 30}
            detail={
              value === "overview"
                ? "Overview explains your next recommended practice using your goals and recent reflections."
                : value === "recordings"
                  ? "Open Recordings for on-device photo, voice or video checks. The recording is not uploaded."
                  : value === "self-check"
                    ? "Use Self-check to tell your coach what feels comfortable and what needs practice."
                    : "Progress tracks your real-world reflections and learning stage. It is not a measured mastery score."
            }
            style={{ flexGrow: 1, flexBasis: compact ? "45%" : 105 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: section === value }}
              aria-pressed={section === value}
              onPress={() => setSection(value)}
              style={[s.tab, section === value && s.active]}
            >
              <Text style={[s.tabText, section === value && { color: "#fff" }]}>
                {label}
              </Text>
            </Pressable>
          </CoachSpot>
        ))}
      </View>
      {core && (
        <AICoach
          key={section}
          view={section as CoachView}
          onNavigate={setSection}
          state={state}
          update={update}
          onPractice={onPractice}
        />
      )}
      {section === "Weekly review" && (
        <WeeklyReview state={state} update={update} />
      )}
      {section === "Videos" && <VideoLibrary />}
      {section === "Dining" && <Dining state={state} update={update} />}
      {section === "Cultural context" && (
        <Culture state={state} update={update} />
      )}
      {section === "Personal brand" && <Brand state={state} update={update} />}
      {section === "History" && (
        <AssessmentHistory state={state} update={update} />
      )}
      {section === "Memory" && <CoachMemory state={state} update={update} />}
      <View style={s.tools}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More coaching tools"
          accessibilityState={{ expanded: more }}
          onPress={() => setMore(!more)}
          style={s.toolHeading}
        >
          <Text style={k.label}>Resources & settings</Text>
          <Text style={k.body}>{more ? "−" : "+"}</Text>
        </Pressable>
        {more && (
          <View style={k.row}>
            {(
              [
                ["Videos", "Videos"],
                ["Weekly review", "Weekly review"],
                ["Saved plans", "History"],
                ["Coach memory", "Memory"],
                ["Dining", "Dining"],
                ["Cultural context", "Cultural context"],
                ["Personal brand", "Personal brand"],
                ["Coach settings", "settings"],
              ] as const
            ).map(([label, value]) => (
              <Choice
                key={value}
                title={label}
                selected={section === value}
                onPress={() => setSection(value)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#61705B",
  },
  title: { fontSize: 32, fontWeight: "700", lineHeight: 40, color: "#283C32" },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 5,
    gap: 4,
    backgroundColor: "#EBEEE6",
    borderRadius: 14,
  },
  tab: {
    flexGrow: 1,

    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
  },
  active: { backgroundColor: "#344C3D" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#435540" },
  tools: { borderTopWidth: 1, borderColor: "#DDE2D7", gap: 12 },
  toolHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
});
