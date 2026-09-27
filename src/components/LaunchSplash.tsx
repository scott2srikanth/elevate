import SplashBackdrop from "./SplashBackdrop";
import WelcomeVideo from "./WelcomeVideo";
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
  return (
    <View testID="launch-splash" style={styles.root}>
      <StatusBar style="dark" />
      <SplashBackdrop />
      {reducedMotion ? (
        <Image
          source={require("../../assets/brand-splash.png")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityLabel="Elevate coaching companions"
        />
      ) : (
        <WelcomeVideo width={width} height={height} />
      )}
      <View style={[styles.content, { marginTop: height * 0.34 }]}>
        <View style={{ height: 32 }} accessible={false} />
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
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={onFinish}
        style={[styles.continue, !ready && { opacity: 0.55 }]}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E8D9C1",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 560,
    height: 297,
    paddingVertical: 18,
    flexShrink: 1,
    zIndex: 1,
  },
  wordWindow: { height: rowHeight, overflow: "hidden", width: "100%" },
  wordRow: {
    height: rowHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  word: { fontWeight: "600", lineHeight: 100, textAlign: "center" },
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
    zIndex: 1,
  },
  continueText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
