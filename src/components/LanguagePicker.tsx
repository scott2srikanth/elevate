import React from "react";
import { View } from "react-native";
import { Text, Pressable, type Language } from "../i18n";
export function LanguagePicker({
  value,
  onChange,
}: {
  value: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#203E36" }}>
        Choose your language
      </Text>
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {(
          [
            ["en", "English"],
            ["te", "తెలుగు"],
          ] as const
        ).map(([code, label]) => (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: value === code }}
            onPress={() => onChange(code)}
            style={{
              flexGrow: 1,
              minWidth: 125,
              padding: 17,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: value === code ? "#456B49" : "#DFE6DA",
              backgroundColor: value === code ? "#DAECCC" : "#FFFFFF",
            }}
          >
            <Text
              raw
              style={{ color: "#203E36", fontSize: 18, fontWeight: "600" }}
            >
              {value === code ? "✓  " : ""}
              {label}
            </Text>
            <Text raw style={{ fontSize: 12, color: "#52665C", marginTop: 6 }}>
              {code === "en" ? "English" : "Telugu"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: "#52665C", fontSize: 13, lineHeight: 22 }}>
        You can change your language anytime in Profile.
      </Text>
    </View>
  );
}
