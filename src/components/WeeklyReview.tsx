import { Text } from "../i18n";
import React, { useState } from "react";
import { View } from "react-native";
import { AREAS, Area, State } from "../coach";
import { weeklySummary, adaptiveStage } from "../development";
import { Action, Input, Choice, k } from "./kit";
export function WeeklyReview({
  state,
  update,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
}) {
  const summary = weeklySummary(state);
  const [win, setWin] = useState(""),
    [obstacle, setObstacle] = useState(""),
    [commitment, setCommitment] = useState(""),
    [focus, setFocus] = useState<Area>(
      state.profile?.focus || "Executive presence",
    ),
    [saved, setSaved] = useState(false);
  return (
    <View style={k.card}>
      <Text style={k.title}>Your weekly review</Text>
      <Text style={k.body}>
        {summary.count} real-world practices across {summary.days} days this
        week.{" "}
        {summary.average !== null
          ? `Average self-reported confidence: ${summary.average}/5.`
          : "Your first practice will start the story."}
      </Text>
      <Text style={k.muted}>
        Stage {adaptiveStage(state) + 1} of 8. A stage advances when both skills
        have a real-world reflection rated at least 3/5. Repeated stages need
        fresh practice.
      </Text>
      {summary.signals.length > 0 && (
        <Text style={k.body}>
          Themes mentioned: {summary.signals.map((s) => s.label).join(", ")}.
          These are keyword matches you can correct through your next focus.
        </Text>
      )}
      <Input
        label="One win this week"
        value={win}
        onChange={setWin}
        multiline
      />
      <Input
        label="What got in the way?"
        value={obstacle}
        onChange={setObstacle}
        multiline
      />
      <Input
        label="My next small commitment"
        value={commitment}
        onChange={setCommitment}
        multiline
      />
      <View style={k.row}>
        {AREAS.map((a) => (
          <Choice
            key={a}
            title={a}
            selected={focus === a}
            onPress={() => setFocus(a)}
          />
        ))}
      </View>
      <Action
        title="Save weekly review"
        disabled={!win.trim() || !commitment.trim() || !state.profile}
        onPress={() => {
          update((s) => ({
            ...s,
            reviews: [
              {
                id: String(Date.now()),
                at: new Date().toISOString(),
                win,
                obstacle,
                commitment,
                focus,
              },
              ...s.reviews,
            ],
            profile: s.profile ? { ...s.profile, focus } : null,
          }));
          setWin("");
          setObstacle("");
          setCommitment("");
          setSaved(true);
        }}
      />
      {saved && (
        <Text accessibilityRole="alert" style={k.message}>
          Review saved. Your chosen focus will guide your next practices.
        </Text>
      )}
      {state.reviews.slice(0, 4).map((r) => (
        <View
          key={r.id}
          style={{
            gap: 5,
            paddingTop: 12,
            borderTopWidth: 1,
            borderColor: "#DDE4D9",
          }}
        >
          <Text style={k.label}>
            {new Date(r.at).toLocaleDateString()} · {r.focus}
          </Text>
          <Text raw style={k.body}>
            Win: {r.win}
          </Text>
          <Text raw style={k.body}>
            Next: {r.commitment}
          </Text>
        </View>
      ))}
    </View>
  );
}
