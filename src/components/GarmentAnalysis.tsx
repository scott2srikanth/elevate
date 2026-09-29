import React, { useRef, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { API_URL } from "../api";
import { Text } from "../i18n";
import { k } from "./kit";
import { parseGarmentMessage, type GarmentResult } from "../shared/garment";
function allowed(value: string, session: string) {
  try {
    const url = new URL(value);
    return (
      url.origin === new URL(API_URL).origin &&
      (url.pathname === "/observation/garment/index.html" ||
        /^\/observation\/offline\/[a-f0-9]{64}\/garment\/index.html$/.test(
          url.pathname,
        )) &&
      url.searchParams.get("session") === session
    );
  } catch {
    return false;
  }
}
export function GarmentAnalysis({
  onResult,
}: {
  onResult: (result: GarmentResult) => void;
}) {
  const ref = useRef<WebView>(null);
  const [session] = useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [error, setError] = useState("");
  if (!API_URL)
    return (
      <Text style={k.body}>
        Configure the app server address to download the offline garment model.
      </Text>
    );
  return (
    <View style={{ height: 850 }}>
      {!!error && <Text style={k.message}>{error}</Text>}
      <WebView
        ref={ref}
        source={{
          uri: `${API_URL}/observation/garment/index.html?session=${session}`,
        }}
        originWhitelist={[new URL(API_URL).origin]}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        onShouldStartLoadWithRequest={(r) => allowed(r.url, session)}
        onError={() =>
          setError(
            "The garment page could not load. Download the offline package while connected, then reopen My style.",
          )
        }
        onMessage={(event) => {
          if (!allowed(event.nativeEvent.url, session)) return;
          const result = parseGarmentMessage(event.nativeEvent.data, session);
          if (result) {
            onResult(result);
            ref.current?.postMessage(
              JSON.stringify({
                type: "elevate-garment-saved",
                session,
                id: result.id,
              }),
            );
          }
        }}
      />
    </View>
  );
}
