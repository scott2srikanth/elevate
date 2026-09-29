import { Pressable, Text, TextInput } from "../i18n";
import React from "react";
import { View, StyleSheet } from "react-native";
export const k = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5DFD3",
    borderRadius: 14,
    padding: 22,
    gap: 15,
    marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: "600", color: "#344333" },
  body: { fontSize: 14, lineHeight: 23, color: "#56604F" },
  label: { fontSize: 13, fontWeight: "600", color: "#344333" },
  input: {
    borderWidth: 1,
    borderColor: "#D4D7C9",
    borderRadius: 8,
    padding: 13,
    minHeight: 48,
    color: "#344333",
    backgroundColor: "#fff",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#344333",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    alignSelf: "flex-start",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  muted: { fontSize: 12, color: "#59634F", lineHeight: 19 },
  error: { color: "#9D3829", lineHeight: 22 },
  pill: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C4D5B9",
    backgroundColor: "#F7F3EC",
  },
  message: {
    padding: 14,
    backgroundColor: "#E2E8D8",
    borderRadius: 8,
    color: "#344333",
    lineHeight: 22,
  },
});
export function Action({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={[
        k.button,
        secondary && { backgroundColor: "#E3ECD9" },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[k.buttonText, secondary && { color: "#344333" }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Input({
  label,
  value,
  onChange,
  secret = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secret?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={k.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secret}
        multiline={multiline}
        autoCapitalize={
          secret || label.toLowerCase().includes("email") ? "none" : "sentences"
        }
        maxLength={multiline ? 2000 : secret ? 128 : 254}
        style={[
          k.input,
          multiline && { minHeight: 90, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Choice({
  title,
  accessibilityLabel,
  selected,
  onPress,
}: {
  title: string;
  accessibilityLabel?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={[k.pill, selected && { backgroundColor: "#D5E9C6" }]}
    >
      <Text style={k.body}>{title}</Text>
    </Pressable>
  );
}
export function Consent({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onChange(!value)}
      style={[
        k.row,
        { flexWrap: "nowrap", alignItems: "flex-start", minHeight: 44 },
      ]}
    >
      <Text style={{ fontSize: 23, color: "#526649" }}>
        {value ? "☑" : "☐"}
      </Text>
      <Text style={[k.body, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}
