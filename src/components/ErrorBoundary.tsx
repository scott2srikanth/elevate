import { Text } from "../i18n";
import React from "react";
import { View } from "react-native";
import { api } from "../api";
import { Action, k } from "./kit";
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    void api("/telemetry", {
      method: "POST",
      body: JSON.stringify({ code: "ui_render" }),
    }).catch(() => {});
  }
  render() {
    return this.state.failed ? (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 30,
          gap: 20,
          backgroundColor: "#F7F3EC",
        }}
      >
        <Text style={k.title}>Let’s get your coach back.</Text>
        <Text style={k.body}>
          Something interrupted this screen. Your saved data has not been
          deleted.
        </Text>
        <Action
          title="Try opening the app again"
          onPress={() => this.setState({ failed: false })}
        />
      </View>
    ) : (
      this.props.children
    );
  }
}
