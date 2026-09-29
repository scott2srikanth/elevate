import { Image, Text } from "../i18n";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { State } from "../coach";
import { api, privateMediaUri } from "../api";
import { Cloud } from "../useCloud";
import { GarmentAnalysis } from "./GarmentAnalysis";
import { Action, Input, k } from "./kit";
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
          needs, goals, or lessons to keep as reference. The local decision
          model uses your structured profile and self-checks; it does not
          interpret these free-text notes.
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
  const [show, setShow] = useState(false);
  const [media, setMedia] = useState<
    { id: string; purpose: string; expires_at: number }[]
  >([]);
  const [message, setMessage] = useState("");
  return (
    <View style={k.card}>
      <GarmentAnalysis
        onResult={(garment) =>
          update((s) =>
            s.wardrobe.some((g) => g.id === garment.id)
              ? s
              : { ...s, wardrobe: [...s.wardrobe, garment] },
          )
        }
      />
      {cloud.user && (
        <Action
          title="Manage older cloud photos"
          secondary
          onPress={async () => {
            setShow(!show);
            if (!show)
              try {
                setMedia(await api("/media"));
              } catch {
                setMessage(
                  "Unable to load older photos. Try again when connected.",
                );
              }
          }}
        />
      )}
      {show && (
        <>
          <Text style={k.muted}>
            These files were uploaded using the previous photo-storage feature.
            New garment photos are never uploaded. You can remove older uploads
            here.
          </Text>
          {media.map((m) => (
            <View key={m.id}>
              <Text style={k.body}>
                {m.purpose} · Expires{" "}
                {new Date(m.expires_at * 1000).toLocaleDateString()}
              </Text>
              <Action
                title={`Delete upload ${m.id.slice(0, 8)}`}
                secondary
                onPress={async () => {
                  try {
                    await api(`/media/${m.id}`, { method: "DELETE" });
                    setMedia(await api("/media"));
                  } catch {
                    setMessage(
                      "Unable to delete this older upload. Try again when connected.",
                    );
                  }
                }}
              />
            </View>
          ))}
        </>
      )}
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
            borderColor: "#E5DFD3",
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
