import React from "react";
import { Slot } from "expo-router";
import App from "../../App";
import { ErrorBoundary } from "../components/ErrorBoundary";
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
