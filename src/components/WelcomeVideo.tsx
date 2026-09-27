import CoachWindowHeader from "./CoachWindowHeader";
import { useEvent } from "expo";
import React, { useEffect } from "react";
import { AppState, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "../i18n";

export default function WelcomeVideo({ size }: { size: number }) {
  const player = useVideoPlayer(
    require("../../assets/video/welcome.mp4"),
    (player) => {
      player.muted = true;
      player.loop = true;
    },
  );
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  const visible = status === "readyToPlay";
  useEffect(() => {
    if (AppState.currentState === "active") player.play();
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") player.play();
      else player.pause();
    });
    return () => {
      app.remove();
      // useVideoPlayer releases playback when this component unmounts.
    };
  }, [player]);
  return (
    <View
      accessibilityLabel="Welcome to Elevate. Tap Continue below to begin."
      accessible
      style={{
        width: size,
        height: (size * 9) / 16 + 40,
        paddingTop: 30,
        paddingBottom: 10,
        backgroundColor: "#E8D9C1",
        borderRadius: 24,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      <Image
        source={require("../../assets/brand-splash.png")}
        style={{
          width: size,
          height: (size * 9) / 16,
          position: "absolute",
          top: 30,
          opacity: visible ? 0 : 1,
        }}
        resizeMode="contain"
        accessible={false}
      />
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="contain"
        surfaceType="textureView"
        style={{
          width: size,
          height: (size * 9) / 16,
          opacity: visible ? 1 : 0,
        }}
      />
      <CoachWindowHeader />
    </View>
  );
}
