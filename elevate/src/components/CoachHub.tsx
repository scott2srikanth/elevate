import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { State } from "../coach";
import { Cloud } from "../useCloud";
import { WeeklyReview } from "./WeeklyReview";
import { AssessmentHistory, CoachConversation, MediaStudio } from "./Studio";
import { Brand, Culture, Dining } from "./CoachingTools";
import { Choice, k } from "./kit";
export function CoachHub({
  state,
  update,
  cloud,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
  cloud: Cloud;
}) {
  const [more, setMore] = useState(false);
  const [section, setSection] = useState("Weekly review");
  return (
    <View style={{ gap: 18 }}>
      <Text style={k.title}>Your coaching studio</Text>
      <Text style={k.body}>
        Review what happened, prepare for your next moment, and carry the
        learning forward.
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
      {section === "Weekly review" ? (
        <WeeklyReview state={state} update={update} />
      ) : section === "My coach" ? (
        <CoachConversation state={state} update={update} cloud={cloud} />
      ) : section === "Photo & voice" ? (
        <MediaStudio state={state} update={update} cloud={cloud} />
      ) : section === "Dining" ? (
        <Dining state={state} update={update} />
      ) : section === "Cultural context" ? (
        <Culture state={state} update={update} />
      ) : section === "Personal brand" ? (
        <Brand state={state} update={update} />
      ) : (
        <AssessmentHistory state={state} update={update} />
      )}
    </View>
  );
}
