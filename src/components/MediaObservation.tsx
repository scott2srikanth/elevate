import React, { useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { API_URL } from "../api";
import { Text } from "../i18n";
import { k } from "./kit";
import { parseMediaMessage, type MediaReport } from "../shared/observation";
function allowedObservationUrl(value: string, base: string, session: string) {
  try {
    const url = new URL(value);
    return (
      url.origin === new URL(base).origin &&
      (url.pathname === "/observation/" ||
        /^\/observation\/offline\/[a-f0-9]{64}\/index.html$/.test(
          url.pathname,
        )) &&
      url.searchParams.get("session") === session
    );
  } catch {
    return false;
  }
}
export function MediaObservation({
  onReport,
}: {
  onReport: (report: MediaReport) => void;
}) {
  const [session] = useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [error, setError] = useState("");
  if (!API_URL)
    return (
      <Text style={k.body}>
        Media analysis needs the app server address. Configure
        EXPO_PUBLIC_API_URL and rebuild this app.
      </Text>
    );
  const uri = `${API_URL}/observation/?session=${session}`;
  return (
    <View style={{ height: 620 }}>
      {!!error && <Text style={k.message}>{error}</Text>}
      <WebView
        source={{ uri }}
        originWhitelist={[new URL(API_URL).origin]}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        onShouldStartLoadWithRequest={(request) =>
          allowedObservationUrl(request.url, API_URL, session)
        }
        onError={() =>
          setError(
            "The analysis page could not load. Check the connection and reopen AI Coach.",
          )
        }
        onMessage={(event) => {
          if (!allowedObservationUrl(event.nativeEvent.url, API_URL, session))
            return;
          const report = parseMediaMessage(event.nativeEvent.data, session);
          if (report) onReport(report);
        }}
        style={{ backgroundColor: "#faf8f2" }}
      />
    </View>
  );
}
