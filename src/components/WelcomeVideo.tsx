import { useEvent } from "expo";
import React, { useEffect } from "react";
import { AppState, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "../i18n";

export default function WelcomeVideo({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const videoHeight = Math.min((width * 9) / 16, height * 0.64);
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
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      <Image
        source={require("../../assets/brand-splash.png")}
        style={{
          width,
          height: videoHeight,
          position: "absolute",
          top: height * 0.1,
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
          position: "absolute",
          top: height * 0.1,
          left: 0,
          width,
          height: videoHeight,
          opacity: visible ? 1 : 0,
        }}
      />
    </View>
  );
}
