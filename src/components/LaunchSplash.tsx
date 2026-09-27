import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, Pressable } from "../i18n";

export function LaunchSplash({
  ready,
  onFinish,
}: {
  ready: boolean;
  onFinish: () => void;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    let alive = true;
    let animation: Animated.CompositeAnimation | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const complete = () => {
      if (alive) setFinished(true);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!alive) return;
        if (reduced) {
          progress.setValue(1);
          timer = setTimeout(complete, 250);
          return;
        }
        animation = Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        });
        animation.start(({ finished }) => {
          if (finished) complete();
        });
      })
      .catch(() => {
        progress.setValue(1);
        complete();
      });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduced) => {
        if (reduced) {
          animation?.stop();
          progress.setValue(1);
          complete();
        }
      },
    );
    return () => {
      alive = false;
      clearTimeout(timer);
      animation?.stop();
      subscription.remove();
    };
  }, [progress]);
  useEffect(() => {
    if (ready && finished) onFinish();
  }, [ready, finished, onFinish]);
  return (
    <View testID="launch-splash" style={styles.root}>
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        style={[styles.orbit, { width: 340, height: 340 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.orbit, { width: 270, height: 270 }]}
      />
      <Animated.View
        style={{
          alignItems: "center",
          gap: 22,
          opacity: progress.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 1, 1],
          }),
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        }}
      >
        <View style={styles.mark}>
          <Ionicons name="leaf-outline" size={54} color="#D9EDBD" />
        </View>
        <Text raw style={styles.logo}>
          elevate.
        </Text>
        <Text style={styles.tagline}>Your personal coach, every day.</Text>
        <View style={styles.rule} />
        <Text raw style={styles.bilingual}>
          A little practice. A lasting difference.{"\n"}చిన్న సాధన. నిలిచిపోయే
          మార్పు.
        </Text>
      </Animated.View>
      <View style={styles.bottom}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue"
          disabled={!ready}
          onPress={onFinish}
          style={{ padding: 18 }}
        >
          <Text style={{ color: "#DBE9D0", fontSize: 14 }}>
            {ready ? "Continue" : "Getting your coach ready…"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#173B31",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  orbit: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#325347",
    transform: [{ translateY: -55 }],
  },
  mark: {
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: "#254C3E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#537451",
  },
  logo: {
    fontSize: 64,
    color: "#F6F7EE",
    letterSpacing: -2,
    fontWeight: "500",
  },
  tagline: {
    fontSize: 17,
    color: "#E0EBDD",
    textAlign: "center",
    maxWidth: 300,
  },
  rule: { width: 42, height: 2, backgroundColor: "#A9CA8B", marginTop: 16 },
  bilingual: {
    fontSize: 13,
    lineHeight: 25,
    color: "#B9CEB7",
    textAlign: "center",
  },
  bottom: { position: "absolute", bottom: 40 },
});
