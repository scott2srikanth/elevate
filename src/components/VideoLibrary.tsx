import React, { useState } from "react";
import { Linking, View } from "react-native";
import { router } from "expo-router";
import { Image, Text, useLanguage } from "../i18n";
import {
  coachingVideos,
  videoTopics,
  videoUrl,
  type CoachingVideo,
} from "../coachingVideos";
import CoachingVideoPlayer from "./CoachingVideoPlayer";
import { Action, Choice, k } from "./kit";
export function VideoLibrary() {
  const { language } = useLanguage();
  const [topic, setTopic] = useState<string>("All videos");
  const [selected, setSelected] = useState<CoachingVideo | null>(null);
  const [error, setError] = useState("");
  const local = (en: string, te: string) => (language === "te" ? te : en);
  return (
    <View style={{ gap: 16 }}>
      <Text style={k.title}>Watch. Try. Grow.</Text>
      <Text style={k.body}>
        Expert lessons from TED and Stanford, chosen for clear advice you can
        practice today.
      </Text>
      <Text style={k.muted}>
        English audio. Telugu guidance available. Caption languages depend on
        the video. Internet required; videos play through YouTube.
      </Text>
      <View style={k.row}>
        {videoTopics.map((item) => (
          <Choice
            key={item}
            title={item}
            selected={topic === item}
            onPress={() => {
              setTopic(item);
              setSelected(null);
              setError("");
            }}
          />
        ))}
      </View>
      {coachingVideos
        .filter((video) => topic === "All videos" || video.topic === topic)
        .map((video) => (
          <View
            key={video.id}
            style={[k.card, { padding: 16, marginBottom: 0 }]}
          >
            {selected?.id === video.id ? (
              <CoachingVideoPlayer
                key={video.id}
                id={video.id}
                title={video.title}
              />
            ) : (
              <Image
                accessible={false}
                source={{
                  uri: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
                }}
                style={{
                  width: "100%",
                  aspectRatio: 16 / 9,
                  borderRadius: 10,
                  backgroundColor: "#E3ECD9",
                }}
                resizeMode="cover"
              />
            )}
            <Text raw style={k.title}>
              {local(video.title, video.te)}
            </Text>
            {language === "te" && (
              <Text raw style={k.muted}>
                {video.title}
              </Text>
            )}
            <Text raw style={k.label}>
              {video.author}
            </Text>
            <Text raw style={k.body}>
              {local(video.note, video.noteTe)}
            </Text>
            <View style={k.row}>
              <Action
                title={
                  selected?.id === video.id ? "Close video" : "Watch lesson"
                }
                onPress={() => {
                  setSelected(selected?.id === video.id ? null : video);
                  setError("");
                }}
              />
              <Action
                title="Open on YouTube"
                secondary
                onPress={() => {
                  setSelected(null);
                  void Linking.openURL(videoUrl(video.id)).catch(() =>
                    setError(
                      "Could not open YouTube. Check your connection and try again.",
                    ),
                  );
                }}
              />
            </View>
            {selected?.id === video.id && (
              <View style={{ gap: 10 }}>
                <Text style={k.muted}>
                  If playback is blocked or unavailable, open the official video
                  on YouTube.
                </Text>
                <Text style={k.label}>Try it in real life</Text>
                <Text raw style={k.body}>
                  {local(video.practice, video.practiceTe)}
                </Text>
                <Text style={k.muted}>
                  Watching is preparation. Log your real-world practice and
                  reflection in Practice.
                </Text>
                <Action
                  title="Go to practice"
                  secondary
                  onPress={() => {
                    setSelected(null);
                    router.push("/practice");
                  }}
                />
              </View>
            )}
          </View>
        ))}
      {!!error && (
        <Text accessibilityRole="alert" style={k.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
