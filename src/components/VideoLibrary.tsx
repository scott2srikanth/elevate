import React, { useState } from "react";
import { Linking, View } from "react-native";
import { router } from "expo-router";
import { Image, Text, useLanguage } from "../i18n";
import {
  coachingVideos,
  videoTopics,
  videoUrl,
  matchesVideoTopic,
  practiceVideoTopics,
  type CoachingVideo,
} from "../coachingVideos";
import { useContent } from "../ContentProvider";
import { youtubeId } from "../shared/content";
import { API_URL } from "../api";
import { availableLanguages } from "../contentRuntime";
import FileVideo from "./FileVideo";
import CoachingVideoPlayer from "./CoachingVideoPlayer";
import { Action, Choice, k } from "./kit";
export function VideoLibrary({
  exerciseId,
  inPractice = false,
}: {
  exerciseId?: string;
  inPractice?: boolean;
}) {
  const { language, t } = useLanguage();
  const { document, revision } = useContent();
  const managed: CoachingVideo[] = document.videos
    .filter((v) => v.format === "lesson")
    .map((v) => ({
      ...v,
      te: t(v.title),
      noteTe: t(v.note),
      practiceTe: t(v.practice),
    }));
  const catalog = [
    ...coachingVideos.filter((v) => !managed.some((m) => m.id === v.id)),
    ...managed,
  ];
  const videos = exerciseId
    ? catalog.filter((v) =>
        v.lessonIds
          ? v.lessonIds.includes(exerciseId)
          : (practiceVideoTopics[exerciseId] || []).some((topic) =>
              matchesVideoTopic(v, topic),
            ),
      )
    : catalog;
  const topics = [...new Set([...videoTopics, ...catalog.map((v) => v.topic)])];
  const audioLanguages = [...new Set(catalog.map((v) => v.audio))];
  const audioLabel = (code: string) =>
    code === "en"
      ? "English audio"
      : code === "te"
        ? "Telugu audio"
        : `${availableLanguages().find((p) => p.code === code)?.name || code} audio`;
  const playUrl = (video: CoachingVideo) =>
    video.url?.startsWith("/")
      ? `${API_URL}${video.url}`
      : video.url || videoUrl(video.id);
  const [topic, setTopic] = useState<string>("All videos");
  const [selected, setSelected] = useState<CoachingVideo | null>(null);
  const [audio, setAudio] = useState<string>("all");
  const [error, setError] = useState("");
  return (
    <View style={{ gap: 16 }}>
      <Text style={k.title}>Watch. Try. Grow.</Text>
      <Text style={k.body}>
        Lessons on communication, dressing, dining and everyday presence, with a
        practical next step.
      </Text>
      <Text style={k.muted}>
        Choose a video language. Lessons in your selected language appear first
        when available. Captions depend on the publisher. Internet required.
      </Text>
      <Text style={k.muted}>
        Adapt advice to your culture, comfort and the occasion. Personal style
        is a choice, not a measure of your worth.
      </Text>
      <Text style={k.label}>Video language</Text>
      <View style={k.row}>
        {["all", ...audioLanguages].map((item) => (
          <Choice
            key={item}
            title={item === "all" ? "All audio languages" : audioLabel(item)}
            selected={audio === item}
            onPress={() => {
              setAudio(item);
              setSelected(null);
              setError("");
            }}
          />
        ))}
      </View>
      {!exerciseId && (
        <>
          <Text style={k.label}>Video topic</Text>
          <View style={k.row}>
            {topics
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
        </>
      )}
      {videos
        .filter(
          (video) =>
            (topic === "All videos" || matchesVideoTopic(video, topic)) &&
            (audio === "all" || video.audio === audio),
        )
        .sort((a, b) =>
          language !== "en"
            ? Number(b.audio === language) - Number(a.audio === language)
            : 0,
        )
        .map((video) => (
          <View
            key={`${revision}-${video.id}`}
            style={[
              k.card,
              {
                padding: 16,
                marginBottom: 0,
                width: "100%",
                overflow: "hidden",
              },
            ]}
          >
            {selected?.id === video.id ? (
              video.url && !youtubeId(video.url) ? (
                <FileVideo url={playUrl(video)} />
              ) : (
                <CoachingVideoPlayer
                  key={`${revision}-${video.id}`}
                  id={video.url ? youtubeId(video.url)! : video.id}
                  title={video.title}
                />
              )
            ) : video.url && !youtubeId(video.url) ? (
              <View
                style={{
                  width: "100%",
                  aspectRatio: 16 / 9,
                  backgroundColor: "#E3ECD9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={k.title}>Video lesson</Text>
              </View>
            ) : (
              <Image
                accessible={false}
                source={{
                  uri: `https://i.ytimg.com/vi/${video.url ? youtubeId(video.url) : video.id}/hqdefault.jpg`,
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
              {language === "te" && !video.url ? video.te : t(video.title)}
            </Text>
            {language === "te" && (
              <Text raw style={k.muted}>
                {video.title}
              </Text>
            )}
            <Text raw style={k.label}>
              {video.author}
            </Text>
            <Text style={k.muted}>{audioLabel(video.audio)}</Text>
            <Text raw style={k.body}>
              {language === "te" && !video.url ? video.noteTe : t(video.note)}
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
                title={
                  video.url && !youtubeId(video.url)
                    ? "Open video link"
                    : "Open on YouTube"
                }
                secondary
                onPress={() => {
                  setSelected(null);
                  void Linking.openURL(playUrl(video)).catch(() =>
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
                  If playback is unavailable, open the original video link.
                </Text>
                <Text style={k.label}>Try it in real life</Text>
                <Text raw style={k.body}>
                  {language === "te" && !video.url
                    ? video.practiceTe
                    : t(video.practice)}
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
          (audio === "all" || video.audio === audio),
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
              setAudio("all");
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
