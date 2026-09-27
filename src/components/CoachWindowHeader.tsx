import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../i18n";

/** A foreground window lintel makes the video's upper crop intentional. */
export default function CoachWindowHeader() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 32,
        zIndex: 2,
        backgroundColor: "#425441",
        borderBottomWidth: 2,
        borderBottomColor: "#BCA078",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons
          name="leaf-outline"
          size={15}
          color="#E8D9C1"
          accessible={false}
        />
        <Text
          style={{
            color: "#FAF5EA",
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 0.5,
          }}
        >
          Meet your coaches
        </Text>
      </View>
      <Ionicons
        name="sparkles-outline"
        size={14}
        color="#D9C19B"
        accessible={false}
      />
    </View>
  );
}
