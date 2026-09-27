import { Image, Text } from "../i18n";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { State } from "../coach";
import { api, privateMediaUri, uploadMedia } from "../api";
import { Cloud } from "../useCloud";
import { compressImage } from "../mediaTools";
import { Action, Choice, Consent, Input, k } from "./kit";
import { AnalysisView } from "./StudioVisuals";
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
type Update = React.Dispatch<React.SetStateAction<State>>;
export function CoachMemory({
  state,
  update,
}: {
  state: State;
  update: Update;
}) {
  const [memory, setMemory] = useState("");
  return (
    <>
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
            <Text raw style={k.body}>
              {m.text}
            </Text>
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
  update,
  cloud,
}: {
  state: State;
  update: Update;
  cloud: Cloud;
  wardrobe?: boolean;
}) {
  const [uri, setUri] = useState("");
  const [pieceName, setPieceName] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState("Tops");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<
    { id: string; purpose: string; expires_at: number }[]
  >([]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save your photo.");
    } finally {
      setBusy(false);
    }
  }
  async function pick(camera = false) {
    if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted)
      throw new Error("Camera permission was not granted.");
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.8,
    };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) setUri(await compressImage(result.assets[0].uri));
  }
  return (
    <View style={k.card}>
      <Text style={k.title}>Photograph a wardrobe piece</Text>
      <Text style={k.body}>
        Keep an optional private wardrobe photo. This is storage only; photos
        are never sent to an AI service by Elevate.
      </Text>
      <View style={k.row}>
        <Action
          title="Choose photo"
          disabled={busy}
          onPress={() => void run(() => pick())}
        />
        {Platform.OS !== "web" && (
          <Action
            title="Use camera"
            disabled={busy}
            secondary
            onPress={() => void run(() => pick(true))}
          />
        )}
      </View>
      {!!uri && (
        <Image
          accessibilityLabel="Selected wardrobe photo"
          source={{ uri }}
          style={{ width: 150, height: 180, borderRadius: 12 }}
        />
      )}
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
        {["Tops", "Bottoms", "Shoes", "Layers", "Accessories"].map((c) => (
          <Choice
            key={c}
            title={c}
            selected={c === category}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>
      <Consent
        label="I consent to storing this wardrobe photo privately in R2 for 30 days"
        value={consent}
        onChange={setConsent}
      />
      <Action
        title="Save photo & wardrobe piece"
        disabled={
          busy ||
          !cloud.user ||
          !uri ||
          !consent ||
          !pieceName.trim() ||
          !color.trim()
        }
        onPress={() =>
          void run(async () => {
            const uploaded = await uploadMedia(
              uri,
              "image/jpeg",
              "wardrobe",
              30,
            );
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
            setUri("");
            setPieceName("");
            setMessage(
              "Wardrobe piece saved. Its private photo expires after 30 days.",
            );
          })
        }
      />
      {!cloud.user && (
        <Text style={k.muted}>
          Sign in under Profile to enable optional photo storage.
        </Text>
      )}
      <Text style={k.muted}>
        Photos expire after 30 days. Refresh to manage stored files, including
        older analysis uploads.
      </Text>
      <Action
        title="Refresh uploaded media"
        secondary
        disabled={busy || !cloud.user}
        onPress={() => void run(async () => setMedia(await api("/media")))}
      />
      {media.map((m) => (
        <View key={m.id} style={{ gap: 8 }}>
          <Text style={k.body}>
            {m.purpose} · Expires{" "}
            {new Date(m.expires_at * 1000).toLocaleDateString()}
          </Text>
          <Action
            title={`Delete upload ${m.id.slice(0, 8)}`}
            secondary
            disabled={busy}
            onPress={() =>
              void run(async () => {
                await api(`/media/${m.id}`, { method: "DELETE" });
                setMedia(await api("/media"));
              })
            }
          />
        </View>
      ))}
      {!!message && (
        <Text accessibilityRole="alert" style={k.message}>
          {message}
        </Text>
      )}
    </View>
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
          {a.analysis ? (
            <AnalysisView analysis={a.analysis} />
          ) : (
            <Text raw selectable style={k.body}>
              {a.feedback}
            </Text>
          )}
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
