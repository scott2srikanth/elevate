import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import {
  contentSchema,
  emptyContent,
  type ContentSnapshot,
} from "./shared/content";
import { installLanguages } from "./contentRuntime";
import { installLessons } from "./coach";
const initial = { revision: 0, document: emptyContent() };
const Context = createContext<ContentSnapshot>(initial);
export const useContent = () => useContext(Context);
const cacheKey = "elevate.published-content.v1";
export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<ContentSnapshot>(initial);
  useEffect(() => {
    let live = true,
      busy = false,
      revision = -1;
    const apply = (value: ContentSnapshot) => {
      if (
        !live ||
        !Number.isSafeInteger(value.revision) ||
        value.revision < 0 ||
        value.revision <= revision
      )
        return false;
      const document = contentSchema.parse(value.document);
      installLanguages(document.languages);
      installLessons(document.lessons);
      revision = value.revision;
      setSnapshot({ revision, document });
      return true;
    };
    const sync = async () => {
      if (busy || !live || AppState.currentState === "background") return;
      busy = true;
      try {
        const value = await api<ContentSnapshot>("/content", {
          signal: AbortSignal.timeout(15000),
        });
        const changed = apply(value);
        if (live && changed)
          await AsyncStorage.setItem(cacheKey, JSON.stringify(value));
      } catch {
        /* Keep the last valid catalog when offline or a release is invalid. */
      } finally {
        busy = false;
      }
    };
    void (async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) apply(JSON.parse(cached));
      } catch {
        /* Ignore corrupt cache. */
      }
      await sync();
    })();
    const timer = setInterval(() => void sync(), 60000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync();
    });
    return () => {
      live = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return <Context.Provider value={snapshot}>{children}</Context.Provider>;
}
