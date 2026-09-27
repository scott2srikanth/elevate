import React from "react";
import { availableLanguages } from "../contentRuntime";
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
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#344333" }}>
        Choose your language
      </Text>
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {availableLanguages().map(({ code, name: label }) => (
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
              borderColor: value === code ? "#526649" : "#DFE6DA",
              backgroundColor: value === code ? "#E2E8D8" : "#FFFFFF",
            }}
          >
            <Text
              raw
              style={{ color: "#344333", fontSize: 18, fontWeight: "600" }}
            >
              {value === code ? "✓  " : ""}
              {label}
            </Text>
            <Text raw style={{ fontSize: 12, color: "#56604F", marginTop: 6 }}>
              {code}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: "#56604F", fontSize: 13, lineHeight: 22 }}>
        You can change your language anytime in Profile.
      </Text>
    </View>
  );
}
