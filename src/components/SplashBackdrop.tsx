import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";

/** Static concentric color bands approximate the web radial wash on native. */
export default function SplashBackdrop() {
  const { width, height } = useWindowDimensions();
  const outer = [219, 197, 164],
    inner = [245, 237, 219];
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "#DBC5A4", overflow: "hidden" },
      ]}
    >
      {Array.from({ length: 48 }, (_, index) => {
        const progress = (index + 1) / 48;
        const w = width * 2.5 * (1 - progress * 0.98);
        const h = height * 2 * (1 - progress * 0.98);
        const color = outer.map((value, channel) =>
          Math.round(value + (inner[channel] - value) * progress),
        );
        return (
          <View
            key={index}
            style={{
              position: "absolute",
              width: w,
              height: h,
              left: (width - w) / 2,
              top: height * 0.32 - h / 2,
              borderRadius: Math.max(w, h),
              backgroundColor: `rgb(${color.join(",")})`,
            }}
          />
        );
      })}
    </View>
  );
}
