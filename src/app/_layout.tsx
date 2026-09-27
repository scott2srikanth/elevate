import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { Slot, usePathname } from "expo-router";
import { ContentProvider } from "../ContentProvider";
import { Platform } from "react-native";
import AdminEntry from "../components/AdminEntry";
import App from "../../App";
import { ErrorBoundary } from "../components/ErrorBoundary";
SplashScreen.setOptions({ duration: 350, fade: true });
export default function RootLayout() {
  const admin = usePathname() === "/admin" && Platform.OS === "web";
  return (
    <>
      <ErrorBoundary>
        <ContentProvider>
          {admin ? <AdminEntry full /> : <App />}
        </ContentProvider>
      </ErrorBoundary>
      <Slot />
    </>
  );
}
