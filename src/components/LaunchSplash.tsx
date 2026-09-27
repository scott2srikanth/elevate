import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, Pressable, Image } from "../i18n";

const names = [
  { text: "Elevate", language: "English", color: "#425441" },
  { text: "एलिवेट", language: "हिन्दी", color: "#9A5438" },
  { text: "ఎలివేట్", language: "తెలుగు", color: "#53644B" },
  { text: "எலிவேட்", language: "தமிழ்", color: "#855A46" },
  { text: "എലിവേറ്റ്", language: "മലയാളം", color: "#425441" },
];
const rowHeight = 108;
export function LaunchSplash({
  ready,
  onFinish,
}: {
  ready: boolean;
  onFinish: () => void;
}) {
  const { height, width } = useWindowDimensions();
  const [offset] = useState(() => new Animated.Value(0));
  const [reveals] = useState(() =>
    [...names, names[0]].map(() => new Animated.Value(0)),
  );
  const wordWidth = Math.min(560, width - 48);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setReducedMotion(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    offset.setValue(0);
    reveals.forEach((value) => value.setValue(reducedMotion ? 1 : 0));
    if (reducedMotion) return;
    let stopped = false;
    let animation: Animated.CompositeAnimation;
    const cycle = () => {
      // The duplicate first row is still blank here, so resetting the track is invisible.
      offset.setValue(0);
      reveals.forEach((value) => value.setValue(0));
      animation = Animated.sequence(
        names.flatMap((_, index) => [
          Animated.timing(reveals[index], {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.delay(1100),
          Animated.timing(offset, {
            toValue: -(index + 1) * rowHeight,
            duration: 500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
      );
      animation.start(({ finished }) => {
        if (finished && !stopped) cycle();
      });
    };
    cycle();
    return () => {
      stopped = true;
      animation?.stop();
    };
  }, [offset, reveals, reducedMotion]);
  const artworkSize = Math.max(100, Math.min(260, height * 0.32, width * 0.65));
  return (
    <View testID="launch-splash" style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text raw style={styles.eyebrow}>
          YOUR PERSONAL COACH
        </Text>
        <Image
          source={require("../../assets/brand-splash.png")}
          style={{ width: artworkSize, height: artworkSize }}
          resizeMode="contain"
          accessibilityLabel="Elevate coaching companions"
        />
        <View
          accessible
          accessibilityLabel="Elevate — English, Hindi, Telugu, Tamil, Malayalam"
          style={styles.wordWindow}
        >
          <Animated.View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ transform: [{ translateY: offset }] }}
          >
            {[...names, names[0]].map((name, index) => (
              <View key={index} style={[styles.wordRow, { width: wordWidth }]}>
                <Animated.View
                  style={{
                    overflow: "hidden",
                    width: reveals[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, wordWidth],
                    }),
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    raw
                    style={[
                      styles.word,
                      {
                        color: name.color,
                        fontSize:
                          Math.min(68, width * 0.145) *
                          (index === 4 ? 0.82 : index === 3 ? 0.92 : 1),
                        width: wordWidth,
                      },
                    ]}
                  >
                    {name.text}
                  </Text>
                </Animated.View>
              </View>
            ))}
          </Animated.View>
        </View>
        <View style={styles.languages}>
          {names.map((name) => (
            <Text raw key={name.language} style={styles.language}>
              {name.language}
            </Text>
          ))}
        </View>
        {reducedMotion && (
          <Text raw style={styles.staticNames}>
            {names
              .slice(1)
              .map((name) => name.text)
              .join(" · ")}
          </Text>
        )}
        <Text style={styles.tagline}>Your personal coach, every day.</Text>
        <View style={styles.rule} />
        <Text raw style={styles.caption}>
          A little practice. A lasting difference.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={onFinish}
        style={[styles.continue, !ready && { opacity: 0.55 }]}
      >
        <Text style={styles.continueText}>
          {ready ? "Continue" : "Getting your coach ready…"}
        </Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F3EC",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 560,
    flexShrink: 1,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "600",
    color: "#59634F",
    marginBottom: 12,
  },
  wordWindow: { height: rowHeight, overflow: "hidden", width: "100%" },
  wordRow: {
    height: rowHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  word: { fontWeight: "600", lineHeight: 100, textAlign: "center" },
  languages: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  language: { fontSize: 12, lineHeight: 22, color: "#59634F" },
  staticNames: {
    fontSize: 14,
    lineHeight: 28,
    textAlign: "center",
    color: "#425441",
    marginBottom: 12,
  },
  tagline: {
    fontSize: 17,
    lineHeight: 26,
    color: "#344333",
    textAlign: "center",
  },
  rule: {
    width: 36,
    height: 2,
    backgroundColor: "#AA7254",
    marginVertical: 18,
  },
  caption: { fontSize: 12, color: "#59634F", textAlign: "center" },
  continue: {
    minHeight: 52,
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    backgroundColor: "#425441",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  continueText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
