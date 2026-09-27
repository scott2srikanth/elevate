import React, { useState } from "react";
import { Linking, View } from "react-native";
import { router } from "expo-router";
import { Image, Text, useLanguage } from "../i18n";
import {
  coachingVideos,
  videoTopics,
  videoUrl,
  matchesVideoTopic,
  type CoachingVideo,
} from "../coachingVideos";
import CoachingVideoPlayer from "./CoachingVideoPlayer";
import { Action, Choice, k } from "./kit";
export function VideoLibrary({
  videos = coachingVideos,
  inPractice = false,
}: {
  videos?: CoachingVideo[];
  inPractice?: boolean;
}) {
  const { language } = useLanguage();
  const [topic, setTopic] = useState<string>("All videos");
  const [selected, setSelected] = useState<CoachingVideo | null>(null);
  const [audio, setAudio] = useState<string>("All audio languages");
  const [error, setError] = useState("");
  const local = (en: string, te: string) => (language === "te" ? te : en);
  return (
    <View style={{ gap: 16 }}>
      <Text style={k.title}>Watch. Try. Grow.</Text>
      <Text style={k.body}>
        Lessons on communication, dressing, dining and everyday presence, with a
        practical next step.
      </Text>
      <Text style={k.muted}>
        Choose English or Telugu audio. Telugu videos appear first when your app
        language is Telugu. Captions depend on the publisher. Internet required.
      </Text>
      <Text style={k.muted}>
        Adapt advice to your culture, comfort and the occasion. Personal style
        is a choice, not a measure of your worth.
      </Text>
      <Text style={k.label}>Video language</Text>
      <View style={k.row}>
        {["All audio languages", "Telugu audio", "English audio"].map(
          (item) => (
            <Choice
              key={item}
              title={item}
              selected={audio === item}
              onPress={() => {
                setAudio(item);
                setSelected(null);
                setError("");
              }}
            />
          ),
        )}
      </View>
      <Text style={k.label}>Video topic</Text>
      <View style={k.row}>
        {videoTopics
          .filter(
            (topic) =>
              topic === "All videos" ||
              videos.some((video) => matchesVideoTopic(video, topic)),
          )
          .map((item) => (
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
      {videos
        .filter(
          (video) =>
            (topic === "All videos" || matchesVideoTopic(video, topic)) &&
            (audio === "All audio languages" ||
              video.audio === (audio === "Telugu audio" ? "te" : "en")),
        )
        .sort((a, b) =>
          language === "te"
            ? Number(b.audio === "te") - Number(a.audio === "te")
            : 0,
        )
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
            <Text style={k.muted}>
              {video.audio === "te" ? "Telugu audio" : "English audio"}
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
                {!inPractice && (
                  <Action
                    title="Go to practice"
                    secondary
                    onPress={() => {
                      setSelected(null);
                      router.push("/practice");
                    }}
                  />
                )}
              </View>
            )}
          </View>
        ))}
      {!videos.some(
        (video) =>
          (topic === "All videos" || matchesVideoTopic(video, topic)) &&
          (audio === "All audio languages" ||
            video.audio === (audio === "Telugu audio" ? "te" : "en")),
      ) && (
        <View style={k.card}>
          <Text style={k.body}>
            No videos match this topic and audio language yet. Try all audio
            languages or another topic.
          </Text>
          <Action
            title="Reset video filters"
            secondary
            onPress={() => {
              setAudio("All audio languages");
              setTopic("All videos");
              setSelected(null);
            }}
          />
        </View>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={k.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
