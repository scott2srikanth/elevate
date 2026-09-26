import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { api, ApiError, rememberSession } from "./api";
import { State, initialState } from "./coach";
import { stateSchema } from "./shared/schema";
import { setReminder } from "./dataTools";
export type CloudUser = { id: string; email: string };
const META = "elevate.cloud-sync";
type SyncMeta = { userId: string; revision: number; hash: string };
const fingerprint = (state: State) =>
  Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    // Schema parsing gives object keys a stable order across local reloads.
    JSON.stringify(stateSchema.parse(state)),
  );
async function writeMeta(userId: string, revision: number, state: State) {
  await AsyncStorage.setItem(
    META,
    JSON.stringify({ userId, revision, hash: await fingerprint(state) }),
  );
}
export function useCloud(
  state: State,
  onReplace: (state: State) => void,
  loaded: boolean,
) {
  const [user, setUser] = useState<CloudUser | null>(null),
    [status, setStatus] = useState("Not connected"),
    [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState(false);
  const revision = useRef(0),
    last = useRef(""),
    current = useRef(state),
    operation = useRef(false),
    active = useRef(false),
    owner = useRef(""),
    generation = useRef(0),
    resumeChecked = useRef("");
  useEffect(() => {
    current.current = state;
  }, [state]);
  useEffect(() => {
    let mounted = true;
    api<{ user: CloudUser }>("/me")
      .then((r) => {
        if (mounted) {
          setUser(r.user);
          setStatus("Signed in. Checking this device’s sync history…");
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!user || !loaded || resumeChecked.current === user.id) return;
    resumeChecked.current = user.id;
    const epoch = generation.current;
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(META);
        const meta: SyncMeta | undefined = raw ? JSON.parse(raw) : undefined;
        if (!meta || meta.userId !== user.id) {
          setStatus("Choose a sync direction to connect this device.");
          return;
        }
        const remote = await api<{ state: State; revision: number }>("/state");
        if (cancelled || epoch !== generation.current) return;
        const localUnchanged =
          (await fingerprint(current.current)) === meta.hash;
        if (remote.revision !== meta.revision && !localUnchanged) {
          setConflict(true);
          setStatus(
            "Both this device and the cloud have changes. Export your local copy, then choose which profile to keep.",
          );
          return;
        }
        revision.current = remote.revision;
        owner.current = user.id;
        if (remote.revision !== meta.revision) {
          const parsed = stateSchema.parse(remote.state);
          last.current = JSON.stringify(parsed);
          onReplace(parsed);
          await writeMeta(user.id, remote.revision, parsed);
        } else if (localUnchanged)
          last.current = JSON.stringify(current.current);
        if (cancelled || epoch !== generation.current) return;
        active.current = true;
        setConnected(true);
        setStatus("Cloud sync resumed.");
      } catch {
        if (!cancelled)
          setStatus(
            "Offline or session expired. Your device copy is safe. Restore or back up to reconnect.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loaded, onReplace]);
  const sync = useCallback(async () => {
    if (operation.current || !active.current) return false;
    operation.current = true;
    setBusy(true);
    const snapshot = current.current,
      epoch = generation.current;
    setStatus("Saving to D1…");
    try {
      const result = await api<{ revision: number }>("/state", {
        method: "PUT",
        body: JSON.stringify({ state: snapshot, revision: revision.current }),
      });
      if (epoch !== generation.current) return false;
      revision.current = result.revision;
      last.current = JSON.stringify(snapshot);
      await writeMeta(owner.current, result.revision, snapshot);
      if (epoch !== generation.current) {
        await AsyncStorage.removeItem(META);
        return false;
      }
      setStatus("Saved to D1");
      return true;
    } catch (e) {
      if (epoch === generation.current) {
        setStatus(e instanceof Error ? e.message : "Cloud save failed.");
        active.current = false;
        setConnected(false);
        setConflict(e instanceof ApiError && e.status === 409);
      }
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (!connected || !loaded || JSON.stringify(state) === last.current) return;
    const timer = setTimeout(() => void sync(), 800);
    return () => clearTimeout(timer);
  }, [state, connected, loaded, sync, busy]);
  async function authenticate(
    mode: string,
    email: string,
    password: string,
    recoveryCode?: string,
  ) {
    if (operation.current)
      throw new Error("Wait for the current sync to finish.");
    setBusy(true);
    try {
      const result = await api<{
        user: CloudUser;
        token?: string;
        recoveryCode?: string;
      }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password, recoveryCode }),
      });
      await rememberSession(result.token);
      generation.current++;
      active.current = false;
      setConnected(false);
      resumeChecked.current = result.user.id;
      setUser(result.user);
      setStatus(
        "Choose whether to restore your cloud profile or upload this device’s profile.",
      );
      return result.recoveryCode;
    } finally {
      setBusy(false);
    }
  }
  async function connect(direction: "download" | "upload") {
    if (operation.current)
      throw new Error("Wait for the current sync to finish.");
    if (!user) throw new Error("Sign in first.");
    setBusy(true);
    operation.current = true;
    const epoch = generation.current;
    try {
      const remote = await api<{ state: State; revision: number }>("/state");
      if (epoch !== generation.current) return;
      revision.current = remote.revision;
      owner.current = user.id;
      if (direction === "download") {
        const parsed = stateSchema.parse(remote.state);
        last.current = JSON.stringify(parsed);
        onReplace(parsed);
        await writeMeta(user.id, remote.revision, parsed);
      } else {
        const snapshot = current.current;
        const result = await api<{ revision: number }>("/state", {
          method: "PUT",
          body: JSON.stringify({ state: snapshot, revision: remote.revision }),
        });
        if (epoch !== generation.current) return;
        revision.current = result.revision;
        last.current = JSON.stringify(snapshot);
        await writeMeta(user.id, result.revision, snapshot);
      }
      if (epoch !== generation.current) {
        await AsyncStorage.removeItem(META);
        return;
      }
      active.current = true;
      setConnected(true);
      setConflict(false);
      setStatus("Connected. Changes save automatically to D1.");
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  async function disconnect() {
    generation.current++;
    active.current = false;
    setConnected(false);
    await AsyncStorage.removeItem(META);
    setStatus("Cloud sync paused. Restore or back up to reconnect.");
  }
  async function logout() {
    if (operation.current)
      throw new Error("Wait for the current sync to finish.");
    await disconnect();
    await api("/auth/logout", { method: "POST" });
    await rememberSession();
    await setReminder(false, 9, 0);
    setUser(null);
    onReplace(initialState());
    setStatus("Signed out; local coaching data cleared.");
  }
  async function removeAccount(password: string) {
    if (operation.current)
      throw new Error("Wait for the current sync to finish.");
    setBusy(true);
    operation.current = true;
    try {
      await api("/account", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      });
      await disconnect();
      await rememberSession();
      await setReminder(false, 9, 0);
      setUser(null);
      onReplace(initialState());
      setStatus("Account and private media deleted.");
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  return {
    user,
    status,
    connected,
    busy,
    conflict,
    authenticate,
    connect,
    sync,
    logout,
    removeAccount,
    disconnect,
  };
}
export type Cloud = ReturnType<typeof useCloud>;
