import { Text } from "../i18n";
import React, { useState } from "react";
import { View, Linking, Platform } from "react-native";
import { State } from "../coach";
import {
  brandStatement,
  cultureGuides,
  diningScenarios,
  outfitSuggestion,
} from "../development";
import { setReminder } from "../dataTools";
import { Action, Choice, Input, k } from "./kit";
export function Dining({
  state,
  update,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
}) {
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState<number | null>(null);
  const scenario = diningScenarios[index];
  return (
    <View style={k.card}>
      <Text style={k.title}>At ease at the table</Text>
      <View
        accessibilityLabel="Illustrative place setting: forks to the left, plate in the center, knife and spoon to the right, water above"
        style={{
          backgroundColor: "#EFE4D5",
          padding: 24,
          borderRadius: 14,
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text style={k.body}>Water ◯</Text>
        <Text style={{ fontSize: 30, color: "#526649" }}>♜ ║ ◯ │ ♧</Text>
        <Text style={k.muted}>Forks · Plate · Knife · Spoon</Text>
      </View>
      <Text style={k.muted}>
        Illustrative formal setting. Actual settings and conventions vary by
        meal and host.
      </Text>
      <Text style={k.label}>
        Scenario {index + 1} / {diningScenarios.length}
      </Text>
      <Text style={k.body}>{scenario.question}</Text>
      {scenario.options.map((option, i) => (
        <Choice
          key={option}
          title={option}
          selected={answer === i}
          onPress={() => {
            if (answer !== null) return;
            setAnswer(i);
            update((s) => ({
              ...s,
              scenarioResults: [
                ...s.scenarioResults,
                {
                  id: scenario.id,
                  correct: i === scenario.answer,
                  at: new Date().toISOString(),
                },
              ],
            }));
          }}
        />
      ))}
      {answer !== null && (
        <>
          <Text style={k.message}>
            {answer === scenario.answer
              ? "A thoughtful choice. "
              : "Here is another approach. "}
            {scenario.explanation}
          </Text>
          <Action
            title="Try another scenario"
            onPress={() => {
              setIndex((index + 1) % diningScenarios.length);
              setAnswer(null);
            }}
          />
        </>
      )}
      <Text style={k.muted}>
        {state.scenarioResults.length} scenario attempts saved. These are
        learning checks, not real-world practice credits.
      </Text>
    </View>
  );
}
export function Culture({
  state,
  update,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
}) {
  const guide =
    cultureGuides[state.preferences.culture] || cultureGuides["Ask the host"];
  return (
    <View style={k.card}>
      <Text style={k.title}>Context before convention</Text>
      <View style={k.row}>
        {Object.keys(cultureGuides).map((c) => (
          <Choice
            key={c}
            title={c}
            selected={c === state.preferences.culture}
            onPress={() =>
              update((s) => ({
                ...s,
                preferences: { ...s.preferences, culture: c },
              }))
            }
          />
        ))}
      </View>
      <Text style={k.body}>{guide.note}</Text>
      {guide.tips.map((t) => (
        <Text key={t} style={k.body}>
          • {t}
        </Text>
      ))}
      <Action
        title="Read background guidance"
        secondary
        onPress={() => void Linking.openURL(guide.source)}
      />
      <Text style={k.muted}>
        Practical starting points, not rules about every person. Check with your
        host. Background references reviewed September 2026.
      </Text>
    </View>
  );
}
export function Brand({
  state,
  update,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
}) {
  const [audience, setAudience] = useState(state.brand.audience),
    [expertise, setExpertise] = useState(state.brand.expertise),
    [value, setValue] = useState(state.brand.value);
  return (
    <View style={k.card}>
      <Text style={k.title}>Build your professional story</Text>
      <Input label="Who do you help?" value={audience} onChange={setAudience} />
      <Input label="Your expertise" value={expertise} onChange={setExpertise} />
      <Input
        label="The outcome you help create"
        value={value}
        onChange={setValue}
      />
      <Action
        title="Build my brand statement"
        disabled={
          !audience.trim() ||
          !expertise.trim() ||
          !value.trim() ||
          !state.profile
        }
        onPress={() =>
          update((s) => ({
            ...s,
            brand: {
              audience,
              expertise,
              value,
              statement: brandStatement(
                s.profile?.name || "",
                s.profile?.role || "",
                audience,
                expertise,
                value,
                s.preferences.language,
              ),
            },
          }))
        }
      />
      {!!state.brand.statement && (
        <>
          <Text raw selectable style={k.message}>
            {state.brand.statement}
          </Text>
          <Text style={k.label}>LinkedIn headline draft</Text>
          <Text raw selectable style={k.body}>
            {state.preferences.language === "te"
              ? `${state.brand.expertise} | ${state.brand.audience} కోసం ${state.brand.value}`
              : `${state.brand.expertise} | Helping ${state.brand.audience} ${state.brand.value}`}
          </Text>
          <Text style={k.label}>Networking introduction</Text>
          <Text raw selectable style={k.body}>
            {state.preferences.language === "te"
              ? `నమస్కారం, నా పేరు ${state.profile?.name}. ${state.brand.audience}తో ${state.brand.value} విషయంపై పనిచేస్తున్నాను. ప్రస్తుతం మీరు ఏ పని చేస్తున్నారు?`
              : `Hi, I’m ${state.profile?.name}. I work with ${state.brand.audience} on ${state.brand.value}. What are you working on at the moment?`}
          </Text>
          <Text style={k.muted}>
            Use specific evidence in your bio: one project, your contribution,
            and its outcome. Keep claims accurate and ask permission before
            naming clients.
          </Text>
        </>
      )}
    </View>
  );
}
export function Outfit({ state }: { state: State }) {
  const [occasion, setOccasion] = useState("Client meeting");
  const suggestion = outfitSuggestion(state, occasion);
  return (
    <View style={k.card}>
      <Text style={k.title}>An outfit from your wardrobe</Text>
      <View style={k.row}>
        {["Client meeting", "Business dinner", "Networking event"].map((o) => (
          <Choice
            key={o}
            title={o}
            selected={occasion === o}
            onPress={() => setOccasion(o)}
          />
        ))}
      </View>
      {suggestion.pieces.map((p) => (
        <Text key={p.id} style={k.label}>
          {p.name} · {p.color}
        </Text>
      ))}
      {!!suggestion.missing.length && (
        <Text style={k.body}>
          Add these categories to complete the combination:{" "}
          {suggestion.missing.join(", ")}.
        </Text>
      )}
      <Text style={k.muted}>{suggestion.reason}</Text>
    </View>
  );
}
export function Preferences({
  state,
  update,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
}) {
  const [hour, setHour] = useState(String(state.preferences.reminderHour)),
    [minute, setMinute] = useState(String(state.preferences.reminderMinute)),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const valid =
    /^\d{1,2}$/.test(hour) &&
    Number(hour) < 24 &&
    /^\d{1,2}$/.test(minute) &&
    Number(minute) < 60;
  async function schedule(enabled: boolean) {
    setBusy(true);
    try {
      await setReminder(
        enabled,
        Number(hour),
        Number(minute),
        state.preferences.language,
      );
      update((s) => ({
        ...s,
        preferences: {
          ...s.preferences,
          reminderHour: Number(hour),
          reminderMinute: Number(minute),
          reminders: Platform.OS === "web" ? false : enabled,
        },
      }));
      setMessage(
        Platform.OS === "web"
          ? "Import the downloaded calendar file to activate reminders. Remove the event in your calendar to stop them."
          : enabled
            ? "Daily practice and Sunday review reminders scheduled on this device."
            : "Device reminders cancelled.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to schedule.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={k.card}>
      <Text style={k.title}>A rhythm that works for you</Text>
      <Input label="Reminder hour (0–23)" value={hour} onChange={setHour} />
      <Input
        label="Reminder minute (0–59)"
        value={minute}
        onChange={setMinute}
      />
      <View style={k.row}>
        <Action
          title={
            Platform.OS === "web"
              ? "Add daily calendar reminder"
              : "Enable daily & weekly reminders"
          }
          disabled={!valid || busy}
          onPress={() => void schedule(true)}
        />
        {Platform.OS !== "web" && (
          <Action
            title="Turn reminders off"
            secondary
            disabled={busy}
            onPress={() => void schedule(false)}
          />
        )}
      </View>
      <Text style={k.muted}>
        Times use this device’s local timezone. Browser reminders use your
        calendar; native notifications require a development or production
        build.
      </Text>
      <Text style={k.muted}>
        AI Coach uses saved practice history and optional self-checks on this
        device. Elevate does not upload studio photos or voice recordings.
        Garment photos are analysed on-device and discarded after review.
        Only confirmed wardrobe details follow account sync. Older uploaded
        photos can be managed in My style.
      </Text>
      {!!message && (
        <Text accessibilityRole="alert" style={k.message}>
          {message}
        </Text>
      )}
    </View>
  );
}
