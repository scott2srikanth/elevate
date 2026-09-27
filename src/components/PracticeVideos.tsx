import React, { useState } from "react";
import { View } from "react-native";
import { Pressable, Text } from "../i18n";
import { videosForPractice } from "../coachingVideos";
import { VideoLibrary } from "./VideoLibrary";
import { k } from "./kit";
export function PracticeVideos({ exerciseId }: { exerciseId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[k.card, { padding: 16 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          exerciseId ? "Videos for this practice" : "Browse practice videos"
        }
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{ minHeight: 48, justifyContent: "center" }}
      >
        <Text style={k.label}>
          {exerciseId ? "Videos for this practice" : "Browse practice videos"}
        </Text>
        <Text style={k.muted}>
          {open ? "Hide video lessons" : "Show video lessons"}
        </Text>
      </Pressable>
      {open && (
        <VideoLibrary
          key={exerciseId || "all"}
          videos={exerciseId ? videosForPractice(exerciseId) : undefined}
          inPractice
        />
      )}
    </View>
  );
}
