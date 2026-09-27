import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { State } from "../coach";
import { WeeklyReview } from "./WeeklyReview";
import { AssessmentHistory, CoachMemory } from "./Studio";
import { StudioExchange } from "./StudioExchange";
import { StudioBanner } from "./StudioVisuals";
import { Brand, Culture, Dining } from "./CoachingTools";
import { Choice, k } from "./kit";
export function CoachHub({
  state,
  update,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
}) {
  const [more, setMore] = useState(false);
  const [section, setSection] = useState("Weekly review");
  return (
    <View style={{ gap: 18 }}>
      <Text style={k.title}>Your coaching studio</Text>
      <Text style={k.body}>
        Your life, your context, your next step. Exchange JSON with ChatGPT and
        bring your insights to life here.
      </Text>
      <View style={k.row}>
        {["Weekly review", "My coach", "Photo & voice"].map((s) => (
          <Choice
            key={s}
            title={s}
            selected={section === s}
            onPress={() => setSection(s)}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More coaching tools"
        accessibilityState={{ expanded: more }}
        onPress={() => setMore(!more)}
        style={{
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: "#DDE4D9",
        }}
      >
        <Text style={k.label}>
          {more ? "−" : "+"} More coaching tools · Dining, culture & brand
        </Text>
      </Pressable>
      {more && (
        <View style={k.row}>
          {["Dining", "Cultural context", "Personal brand", "History"].map(
            (item) => (
              <Choice
                key={item}
                title={item}
                selected={section === item}
                onPress={() => setSection(item)}
              />
            ),
          )}
        </View>
      )}
      <View
        style={{
          display: section === "Weekly review" ? "flex" : "none",
          gap: 14,
        }}
      >
        <StudioBanner
          image="reflection"
          title="Turn your week into a way forward"
          subtitle="Notice the wins. Learn from difficult moments. Choose one next step."
        />
        <WeeklyReview state={state} update={update} />
        <StudioExchange kind="weekly" state={state} update={update} />
      </View>
      <View
        style={{ display: section === "My coach" ? "flex" : "none", gap: 14 }}
      >
        <StudioBanner
          image="conversation"
          title="A coach with your context"
          subtitle="Bring your goals, real experiences and a question to your next ChatGPT conversation."
        />
        <StudioExchange kind="coach" state={state} update={update} />
        <CoachMemory state={state} update={update} />
      </View>
      <View
        style={{
          display: section === "Photo & voice" ? "flex" : "none",
          gap: 14,
        }}
      >
        <StudioBanner
          image="speaking"
          title="See and hear your progress"
          subtitle="Get guidance on your presentation, spoken message and next rehearsal."
        />
        <StudioExchange kind="media" state={state} update={update} />
      </View>
      {section === "Dining" ? (
        <Dining state={state} update={update} />
      ) : section === "Cultural context" ? (
        <Culture state={state} update={update} />
      ) : section === "Personal brand" ? (
        <Brand state={state} update={update} />
      ) : section === "History" ? (
        <AssessmentHistory state={state} update={update} />
      ) : null}
    </View>
  );
}
