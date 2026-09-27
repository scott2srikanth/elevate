import { Text, TextInput } from "../i18n";
import React, { useState } from "react";
import { Linking, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { State } from "../coach";
import { exportFile } from "../dataTools";
import { buildStudioRequest, studioNames } from "../studioExchange";
import {
  CoachingAnalysis,
  parseAnalysis,
  StudioKind,
} from "../shared/analysis";
import { Action, Choice, Consent, Input, k } from "./kit";
import { AnalysisView } from "./StudioVisuals";
export function StudioExchange({
  kind,
  state,
  update,
}: {
  kind: StudioKind;
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
}) {
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [mediaType, setMediaType] = useState("photo");
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeMemories, setIncludeMemories] = useState(true);
  const [packet, setPacket] = useState("");
  const [response, setResponse] = useState("");
  const [preview, setPreview] = useState<CoachingAnalysis | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showExport, setShowExport] = useState(false);
  const latest = state.assessments.find((a) => a.analysis?.kind === kind);
  function generate() {
    setPacket(
      JSON.stringify(
        buildStudioRequest(state, kind, {
          question: question.trim(),
          transcript: transcript.trim(),
          mediaType,
          includeProfile,
          includeHistory,
          includeMemories,
        }),
        null,
        2,
      ),
    );
    setShowExport(true);
    setNotice("JSON ready. Review it, then copy it to ChatGPT.");
    setError("");
  }
  async function run(task: () => Promise<void>) {
    setError("");
    try {
      await task();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to complete this action.",
      );
    }
  }
  return (
    <View style={{ gap: 14 }}>
      <View style={k.card}>
        <Text style={k.title}>
          1. Prepare your {studioNames[kind].toLowerCase()} JSON
        </Text>
        <Text style={k.body}>
          Choose what to share. Copy the generated JSON into ChatGPT, then bring
          its JSON response back here. No API key or cloud sign-in is needed.
        </Text>
        {kind === "weekly" && (
          <Text style={k.muted}>
            Save your weekly review above to include its new entries in this
            export.
          </Text>
        )}
        <Input
          label={
            kind === "weekly"
              ? "What should this review focus on? (optional)"
              : kind === "media"
                ? "Occasion and feedback context"
                : "What would you like help with?"
          }
          value={question}
          onChange={setQuestion}
          multiline
        />
        {kind === "media" && (
          <>
            <View style={k.row}>
              {["photo", "voice", "photo and voice"].map((item) => (
                <Choice
                  key={item}
                  title={item}
                  selected={mediaType === item}
                  onPress={() => setMediaType(item)}
                />
              ))}
            </View>
            <Text style={k.message}>
              Attach your photo directly in ChatGPT alongside the JSON. For
              voice, use a supported recording attachment or paste a transcript
              below. This app does not upload or process your media.
            </Text>
            <Text style={k.label}>Transcript or spoken script (optional)</Text>
            <TextInput
              accessibilityLabel="Transcript or spoken script (optional)"
              value={transcript}
              onChangeText={setTranscript}
              multiline
              maxLength={12000}
              style={[k.input, { minHeight: 120, textAlignVertical: "top" }]}
            />
            <Text style={k.muted}>
              A transcript can support feedback on wording and structure. Tone,
              pace, and delivery need an accessible recording; a filename alone
              is not enough.
            </Text>
          </>
        )}
        <Consent
          label="Include my goals and profile context (without my name)"
          value={includeProfile}
          onChange={setIncludeProfile}
        />
        <Consent
          label="Include recent reflections, weekly reviews and analysis summaries"
          value={includeHistory}
          onChange={setIncludeHistory}
        />
        <Consent
          label="Include my approved coach memories"
          value={includeMemories}
          onChange={setIncludeMemories}
        />
        <Text style={k.muted}>
          Free-text entries may contain personal details. Review the exact JSON
          before sharing. Changes to your inputs require generating a new JSON
          package.
        </Text>
        <Action
          title="Generate JSON for ChatGPT"
          onPress={generate}
          disabled={kind === "coach" && !question.trim()}
        />
        {!!packet && (
          <>
            <View style={k.row}>
              <Action
                title="Copy JSON"
                onPress={() =>
                  void run(async () => {
                    const copied = await Clipboard.setStringAsync(packet);
                    if (!copied)
                      throw new Error(
                        "Clipboard access is unavailable. Select and copy the JSON below or download it.",
                      );
                    setNotice("JSON copied. Paste it into ChatGPT.");
                  })
                }
              />
              <Action
                title="Download JSON"
                secondary
                onPress={() =>
                  void run(() =>
                    exportFile(`elevate-${kind}-request.json`, packet),
                  )
                }
              />
              <Action
                title="Open ChatGPT"
                secondary
                onPress={() =>
                  void run(async () => {
                    await Linking.openURL("https://chatgpt.com/");
                  })
                }
              />
            </View>
            <Action
              title={showExport ? "Hide request JSON" : "Review request JSON"}
              secondary
              onPress={() => setShowExport(!showExport)}
            />
            {showExport && (
              <TextInput
                accessibilityLabel="JSON to paste into ChatGPT"
                value={packet}
                editable={false}
                multiline
                selectTextOnFocus
                style={[
                  k.input,
                  { height: 210, fontFamily: "monospace", fontSize: 12 },
                ]}
              />
            )}
          </>
        )}
      </View>
      <View style={k.card}>
        <Text style={k.title}>2. Bring your analysis back</Text>
        <Text style={k.body}>
          Paste the full JSON response from ChatGPT. Preview the charts and
          illustrated guidance, then save it to your coaching history.
        </Text>
        <TextInput
          accessibilityLabel="Paste ChatGPT response JSON"
          placeholder="Paste the JSON response here…"
          placeholderTextColor="#59634F"
          value={response}
          onChangeText={(value) => {
            setResponse(value);
            setPreview(null);
            setError("");
          }}
          multiline
          maxLength={60001}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            k.input,
            {
              minHeight: 170,
              maxHeight: 320,
              textAlignVertical: "top",
              fontFamily: "monospace",
              fontSize: 13,
            },
          ]}
        />
        <Action
          title="Preview analysis"
          disabled={!response.trim()}
          onPress={() => {
            setError("");
            setNotice("");
            try {
              setPreview(parseAnalysis(response, kind));
            } catch (e) {
              setPreview(null);
              setError(e instanceof Error ? e.message : "Invalid response.");
            }
          }}
        />
        {!!error && (
          <Text accessibilityRole="alert" style={k.error}>
            {error}
          </Text>
        )}
        {!!notice && (
          <Text accessibilityRole="alert" style={k.message}>
            {notice}
          </Text>
        )}
        {preview && (
          <Action
            title="Save analysis to my history"
            onPress={() => {
              if (
                state.assessments.some(
                  (a) =>
                    a.analysis &&
                    JSON.stringify(a.analysis) === JSON.stringify(preview),
                )
              ) {
                setNotice("This analysis is already in your history.");
                return;
              }
              const nextState: State = {
                ...state,
                assessments: [
                  {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    at: new Date().toISOString(),
                    kind: `ChatGPT · ${studioNames[kind]}`,
                    feedback: preview.summary,
                    analysis: preview,
                  },
                  ...state.assessments,
                ],
              };
              if (
                new TextEncoder().encode(JSON.stringify(nextState)).length >
                900000
              ) {
                setError(
                  "Your history is nearly full. Export your profile in Profile, then delete older analyses in History before saving this one.",
                );
                return;
              }
              update(nextState);
              setPreview(null);
              setResponse("");
              setNotice(
                "Analysis saved. It will be here when you return, and in History.",
              );
            }}
          />
        )}
      </View>
      {preview ? (
        <>
          <Text style={k.label}>PREVIEW · NOT SAVED YET</Text>
          <AnalysisView analysis={preview} />
        </>
      ) : latest?.analysis ? (
        <>
          <Text style={k.muted}>
            Latest saved analysis · {new Date(latest.at).toLocaleDateString()}
          </Text>
          <AnalysisView analysis={latest.analysis} />
        </>
      ) : null}
    </View>
  );
}
