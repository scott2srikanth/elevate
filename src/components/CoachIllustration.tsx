import { Image, Pressable, Text } from "../i18n";
import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  View,
} from "react-native";

/** A short welcome animation; never loops indefinitely or overrides reduced motion. */
export function CoachIllustration({ size = 220 }: { size?: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [reducedMotion, setReducedMotion] = useState(true);
  const [greeting, setGreeting] = useState(0);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReducedMotion(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    progress.setValue(0);
    if (reducedMotion) return;
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 850,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
      Animated.timing(progress, {
        toValue: -0.5,
        duration: 850,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
      Animated.timing(progress, {
        toValue: 0,
        duration: 850,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, greeting]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Greet your coaching companions"
      onPress={() => setGreeting((n) => n + 1)}
      style={{ alignItems: "center" }}
    >
      <Animated.View
        style={{
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [3, 0, -7],
              }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: ["-1deg", "0deg", "1deg"],
              }),
            },
          ],
        }}
      >
        <Image
          source={require("../../assets/illustrations/companions.png")}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessible={false}
        />
      </Animated.View>
      <Text style={styles.caption}>
        {greeting
          ? "One small step. We’re with you."
          : "Your next chapter starts here."}
      </Text>
    </Pressable>
  );
}
export function PracticeScene() {
  return (
    <View style={styles.scene}>
      <Image
        accessibilityLabel="Professionals practicing a relaxed conversation together"
        source={require("../../assets/illustrations/practice.png")}
        style={{ width: "100%", height: "auto", aspectRatio: 1672 / 941 }}
        resizeMode="contain"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  caption: {
    fontSize: 11,
    color: "#526649",
    textAlign: "center",
    marginTop: 3,
  },
  scene: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#E8EBDD",
    marginBottom: 22,
  },
});
