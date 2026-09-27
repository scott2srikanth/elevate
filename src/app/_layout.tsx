import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { Slot } from "expo-router";
import App from "../../App";
import { ErrorBoundary } from "../components/ErrorBoundary";
SplashScreen.setOptions({ duration: 350, fade: true });
export default function RootLayout() {
  return (
    <>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Slot />
    </>
  );
}
