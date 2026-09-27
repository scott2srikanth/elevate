import React, { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { WebView } from "react-native-webview";
import { Text, useLanguage } from "../i18n";
import { embedUrl } from "../coachingVideos";
import { k } from "./kit";
export default function CoachingVideoPlayer({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const { language } = useLanguage();
  const [active, setActive] = useState(AppState.currentState === "active");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => sub.remove();
  }, []);
  return (
    <View
      style={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        aspectRatio: 16 / 9,
        minHeight: 200,
      }}
    >
      {active && !failed ? (
        <WebView
          accessibilityLabel={title}
          source={{
            uri: embedUrl(id, language),
            headers: { Referer: "https://com.elevate.presencecoach/" },
          }}
          style={{ flex: 1, backgroundColor: "#173B31" }}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          onError={() => setFailed(true)}
          onHttpError={() => setFailed(true)}
        />
      ) : (
        <Text style={k.body}>
          {failed
            ? "Video unavailable. Use Open on YouTube below."
            : "Playback paused while the app is in the background."}
        </Text>
      )}
    </View>
  );
}
