import React, { useEffect } from "react";
import { AppState, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
export default function FileVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => sub.remove();
  }, [player]);
  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 16 / 9,
        minHeight: 200,
        overflow: "hidden",
        backgroundColor: "#173B31",
      }}
    >
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}
