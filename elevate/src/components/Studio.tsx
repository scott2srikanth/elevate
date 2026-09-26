import React, { useEffect, useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { State } from "../coach";
import { api, privateMediaUri, uploadMedia } from "../api";
import { Cloud } from "../useCloud";
import { compressImage, videoFrames } from "../mediaTools";
import { Action, Choice, Consent, Input, k } from "./kit";
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
type Update = React.Dispatch<React.SetStateAction<State>>;
export function CoachConversation({
  state,
  update,
  cloud,
}: {
  state: State;
  update: Update;
  cloud: Cloud;
}) {
  const [message, setMessage] = useState(""),
    [memory, setMemory] = useState(""),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function ask() {
    setBusy(true);
    setError("");
    try {
      if (!cloud.connected)
        throw new Error(
          "Connect your cloud profile in Profile before using AI coaching.",
        );
      if (!(await cloud.sync()))
        throw new Error(
          "Sync your latest profile successfully before asking your coach.",
        );
      const result = await api<{ feedback: string }>("/coach", {
        method: "POST",
        body: JSON.stringify({ message, consent }),
      });
      update((s) => ({
        ...s,
        assessments: [
          {
            id: id(),
            at: new Date().toISOString(),
            kind: `Coach: ${message.slice(0, 100)}`,
            feedback: result.feedback,
          },
          ...s.assessments,
        ],
      }));
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coaching is unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <View style={k.card}>
        <Text style={k.title}>A coach with context</Text>
        <Text style={k.body}>
          Your saved goals, recent reflections, weekly reviews, wardrobe, and
          approved memories help your coach make a practical next suggestion.
        </Text>
        <Input
          label="What would you like help with?"
          value={message}
          onChange={setMessage}
          multiline
        />
        <Consent
          label="Share my saved coaching context with Cloudflare Workers AI for this request"
          value={consent}
          onChange={setConsent}
        />
        <Action
          title={busy ? "Your coach is thinking…" : "Ask my coach"}
          disabled={
            busy ||
            cloud.busy ||
            !message.trim() ||
            !consent ||
            !cloud.connected
          }
          onPress={() => void ask()}
        />
        {!cloud.connected && (
          <Text style={k.muted}>
            Sign in and connect your profile in Profile to enable cloud
            coaching.
          </Text>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={k.error}>
            {error}
          </Text>
        )}
      </View>
      <View style={k.card}>
        <Text style={k.title}>What your coach should remember</Text>
        <Text style={k.muted}>
          You choose the facts that persist. Add preferences, accessibility
          needs, goals, or lessons you want carried forward.
        </Text>
        <Input
          label="A useful fact or preference"
          value={memory}
          onChange={setMemory}
          multiline
        />
        <Action
          title="Save to coach memory"
          disabled={!memory.trim() || state.memories.length >= 100}
          onPress={() => {
            update((s) => ({
              ...s,
              memories: [
                { id: id(), text: memory.trim(), at: new Date().toISOString() },
                ...s.memories,
              ],
            }));
            setMemory("");
          }}
        />
        {state.memories.map((m) => (
          <View key={m.id} style={{ gap: 8 }}>
            <Text style={k.body}>{m.text}</Text>
            <Action
              title={`Forget: ${m.text.slice(0, 35)}`}
              secondary
              onPress={() =>
                update((s) => ({
                  ...s,
                  memories: s.memories.filter((x) => x.id !== m.id),
                }))
              }
            />
          </View>
        ))}
      </View>
    </>
  );
}
export function PrivateImage({ mediaId }: { mediaId: string }) {
  const [source, setSource] = useState<{
      uri: string;
      headers: Record<string, string>;
    } | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    privateMediaUri(mediaId).then((s) => {
      if (active) setSource(s);
    });
    return () => {
      active = false;
    };
  }, [mediaId]);
  return source && !failed ? (
    <Image
      accessibilityLabel="Private wardrobe photograph"
      source={source}
      style={{ width: 120, height: 120, borderRadius: 10 }}
      onError={() => setFailed(true)}
    />
  ) : (
    <Text style={k.muted}>Photo unavailable or expired</Text>
  );
}
export function MediaStudio({
  state,
  update,
  cloud,
  wardrobe = false,
}: {
  state: State;
  update: Update;
  cloud: Cloud;
  wardrobe?: boolean;
}) {
  const [kind, setKind] = useState(wardrobe ? "wardrobe" : "photo"),
    [uris, setUris] = useState<string[]>([]),
    [context, setContext] = useState("Professional introduction"),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [duration, setDuration] = useState(0),
    [pieceName, setPieceName] = useState(""),
    [category, setCategory] = useState("Tops"),
    [color, setColor] = useState(""),
    [media, setMedia] = useState<
      { id: string; mime: string; purpose: string; expires_at: number }[]
    >([]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recording = useAudioRecorderState(recorder);
  useEffect(() => {
    if (recording.isRecording && recording.durationMillis >= 120000) {
      void recorder
        .stop()
        .then(() => {
          setDuration(120);
          setUris(recorder.uri ? [recorder.uri] : []);
          setMessage("Recording stopped at two minutes.");
        })
        .catch(() => setMessage("Unable to finish recording."));
    }
  }, [recording.isRecording, recording.durationMillis, recorder]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Media operation failed.");
    } finally {
      setBusy(false);
    }
  }
  async function pick(camera = false) {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: kind === "video" ? ["videos"] : ["images"],
      quality: 0.8,
      videoMaxDuration: 120,
    };
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted)
        throw new Error("Camera permission was not granted.");
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    if (kind === "video") {
      if ((asset.duration || 0) > 120000)
        throw new Error("Choose a video of two minutes or less.");
      setUris(await videoFrames(asset.uri));
      setMessage(
        "Three still frames extracted locally. The original video will not be uploaded.",
      );
    } else setUris([await compressImage(asset.uri)]);
  }
  async function record() {
    if (recording.isRecording) {
      setDuration(Math.max(1, Math.round(recording.durationMillis / 1000)));
      await recorder.stop();
      if (recorder.uri) setUris([recorder.uri]);
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted)
      throw new Error("Microphone permission was not granted.");
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setUris([]);
  }
  async function analyze() {
    if (!cloud.user) throw new Error("Sign in before uploading media.");
    if (kind === "wardrobe") {
      const uploaded = await uploadMedia(uris[0], "image/jpeg", "wardrobe", 30);
      update((s) => ({
        ...s,
        wardrobe: [
          ...s.wardrobe,
          {
            id: id(),
            name: pieceName.trim(),
            category,
            color: color.trim(),
            mediaId: uploaded.id,
          },
        ],
      }));
      setUris([]);
      setPieceName("");
      setMessage(
        "Wardrobe piece saved. Its private photo expires after 30 days.",
      );
      return;
    }
    const outputs: string[] = [];
    let retainedId: string | undefined;
    for (let i = 0; i < uris.length; i++) {
      const mime =
        kind === "voice"
          ? Platform.OS === "web"
            ? "audio/webm"
            : "audio/mp4"
          : "image/jpeg";
      const uploaded = await uploadMedia(
        uris[i],
        mime,
        kind === "voice" ? "voice" : "photo",
        state.preferences.retentionDays,
      );
      if (state.preferences.retentionDays > 0) retainedId = uploaded.id;
      const result = await api<{ feedback: string; transcript?: string }>(
        "/analyze",
        {
          method: "POST",
          body: JSON.stringify({
            mediaId: uploaded.id,
            context:
              kind === "video"
                ? `Still frame ${i + 1} of 3 from a practice video. ${context}`
                : context,
            consent: true,
            deleteAfter: state.preferences.retentionDays === 0,
            ...(kind === "voice" ? { duration } : {}),
          }),
        },
      );
      outputs.push(
        `${kind === "video" ? `Frame ${i + 1}\n` : ""}${result.feedback}${result.transcript ? `\n\nTranscript (review for accuracy):\n${result.transcript}` : ""}`,
      );
    }
    update((s) => ({
      ...s,
      assessments: [
        {
          id: id(),
          at: new Date().toISOString(),
          kind:
            kind === "video"
              ? "Video still-frame review"
              : kind === "voice"
                ? "Voice and transcript review"
                : "Photo presentation review",
          feedback: outputs.join("\n\n"),
          ...(retainedId ? { mediaId: retainedId } : {}),
        },
        ...s.assessments,
      ],
    }));
    setUris([]);
    setMessage(
      "Feedback saved in your coaching history. Choose one suggestion to practice in real life.",
    );
  }
  async function refresh() {
    setMedia(await api("/media"));
  }
  return (
    <>
      <View style={k.card}>
        <Text style={k.title}>
          {wardrobe
            ? "Photograph a wardrobe piece"
            : "See and hear your practice"}
        </Text>
        {!wardrobe && (
          <View style={k.row}>
            {[
              ["photo", "Photo"],
              ["voice", "Voice"],
              ["video", "Video frames"],
            ].map(([value, label]) => (
              <Choice
                key={value}
                title={label}
                selected={kind === value}
                onPress={() => {
                  if (recording.isRecording || busy) return;
                  setKind(value);
                  setUris([]);
                  setMessage("");
                }}
              />
            ))}
          </View>
        )}
        <Text style={k.body}>
          {kind === "voice"
            ? "Record up to two minutes. Your coach reviews the transcript’s structure and wording. It does not measure pitch, volume, or vocal confidence."
            : kind === "video"
              ? "Choose a short practice video. Three still frames are extracted on your device for visual coaching. This is not continuous motion tracking or a clinical posture assessment."
              : "Review visible presentation choices, lighting, clothing, and background. No attractiveness or personality scores."}
        </Text>
        {kind === "voice" ? (
          <Action
            title={
              recording.isRecording
                ? `Stop recording (${Math.round(recording.durationMillis / 1000)}s)`
                : "Record my introduction"
            }
            disabled={busy}
            onPress={() => void run(record)}
          />
        ) : (
          <View style={k.row}>
            <Action
              title={
                kind === "video" ? "Choose practice video" : "Choose photo"
              }
              disabled={busy}
              onPress={() => void run(() => pick())}
            />
            {Platform.OS !== "web" && (
              <Action
                title="Use camera"
                secondary
                disabled={busy}
                onPress={() => void run(() => pick(true))}
              />
            )}
          </View>
        )}
        {uris.length > 0 && (
          <View style={k.row}>
            {kind === "voice" ? (
              <Text style={k.message}>
                Recording ready · {duration} seconds
              </Text>
            ) : (
              uris.map((uri, i) => (
                <Image
                  accessibilityLabel={`Selected preview ${i + 1}`}
                  key={uri}
                  source={{ uri }}
                  style={{ width: 120, height: 150, borderRadius: 10 }}
                />
              ))
            )}
          </View>
        )}
        {wardrobe ? (
          <>
            <Input
              label="Photographed piece name"
              value={pieceName}
              onChange={setPieceName}
            />
            <Input
              label="Photographed piece color"
              value={color}
              onChange={setColor}
            />
            <View style={k.row}>
              {["Tops", "Bottoms", "Shoes", "Layers", "Accessories"].map(
                (c) => (
                  <Choice
                    key={c}
                    title={c}
                    selected={category === c}
                    onPress={() => setCategory(c)}
                  />
                ),
              )}
            </View>
          </>
        ) : (
          <Input
            label="Occasion and feedback context"
            value={context}
            onChange={setContext}
            multiline
          />
        )}
        <Consent
          label={
            wardrobe
              ? "I consent to storing this wardrobe photo privately in R2 for 30 days"
              : "I consent to uploading this media privately and processing it with Cloudflare Workers AI"
          }
          value={consent}
          onChange={setConsent}
        />
        <Action
          title={
            busy
              ? "Working…"
              : wardrobe
                ? "Save photo & wardrobe piece"
                : "Get coaching feedback"
          }
          disabled={
            busy ||
            recording.isRecording ||
            !uris.length ||
            !consent ||
            !cloud.user ||
            (wardrobe && (!pieceName.trim() || !color.trim()))
          }
          onPress={() => void run(analyze)}
        />
        {!cloud.user && (
          <Text style={k.muted}>Sign in under Profile to enable uploads.</Text>
        )}
        <Text style={k.muted}>
          Nothing is uploaded until you give consent and press the button.{" "}
          {wardrobe
            ? "Photo storage is private."
            : state.preferences.retentionDays === 0
              ? "Media is deleted after analysis; interrupted uploads expire after one hour."
              : `New uploads expire after ${state.preferences.retentionDays} days.`}
        </Text>
        {!!message && (
          <Text accessibilityRole="alert" style={k.message}>
            {message}
          </Text>
        )}
      </View>
      {!wardrobe && (
        <View style={k.card}>
          <Text style={k.title}>Your private media library</Text>
          <Action
            title="Refresh uploaded media"
            secondary
            disabled={busy || !cloud.user}
            onPress={() => void run(refresh)}
          />
          {media.map((m) => (
            <View key={m.id} style={{ gap: 10 }}>
              <Text style={k.body}>
                {m.purpose} · {m.mime} · Expires{" "}
                {new Date(m.expires_at * 1000).toLocaleString()}
              </Text>
              <Action
                title={`Delete upload ${m.id.slice(0, 8)}`}
                secondary
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await api(`/media/${m.id}`, { method: "DELETE" });
                    await refresh();
                  })
                }
              />
            </View>
          ))}
        </View>
      )}
    </>
  );
}
export function AssessmentHistory({
  state,
  update,
}: {
  state: State;
  update: Update;
}) {
  return (
    <View style={k.card}>
      <Text style={k.title}>Your coaching history</Text>
      {!state.assessments.length && (
        <Text style={k.body}>
          Your saved coaching and media feedback will appear here.
        </Text>
      )}
      {state.assessments.map((a) => (
        <View
          key={a.id}
          style={{
            gap: 12,
            paddingTop: 14,
            borderTopWidth: 1,
            borderColor: "#DDE4D9",
          }}
        >
          <Text style={k.label}>
            {a.kind} · {new Date(a.at).toLocaleDateString()}
          </Text>
          <Text selectable style={k.body}>
            {a.feedback}
          </Text>
          <Action
            title={`Delete feedback ${a.id.slice(0, 13)}`}
            secondary
            onPress={() =>
              update((s) => ({
                ...s,
                assessments: s.assessments.filter((x) => x.id !== a.id),
              }))
            }
          />
        </View>
      ))}
    </View>
  );
}
