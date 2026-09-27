import { Text } from "../i18n";
import React, { useState } from "react";
import { View } from "react-native";
import { State } from "../coach";
import { Cloud } from "../useCloud";
import { api } from "../api";
import { exportFile } from "../dataTools";
import { Action, Choice, Consent, Input, k } from "./kit";
export function Account({ cloud, state }: { cloud: Cloud; state: State }) {
  const [mode, setMode] = useState("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [recovery, setRecovery] = useState(""),
    [newRecovery, setNewRecovery] = useState(""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false),
    [replace, setReplace] = useState<"download" | "upload" | null>(null),
    [working, setWorking] = useState(false);
  async function run(fn: () => Promise<unknown>) {
    setError("");
    setWorking(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The request failed.");
    } finally {
      setWorking(false);
    }
  }
  const disabled = working || cloud.busy;
  return (
    <View style={k.card}>
      <Text style={k.title}>Your cloud account</Text>
      <Text style={k.body}>{cloud.status}</Text>
      {!cloud.user && (
        <Text style={k.muted}>
          Ask your administrator for an account and password.
        </Text>
      )}
      {!cloud.user ? (
        <>
          <View style={k.row}>
            {[
              ["login", "Sign in"],
              ["recover", "Recover account"],
            ].map(([id, title]) => (
              <Choice
                key={id}
                title={title}
                selected={mode === id}
                onPress={() => setMode(id)}
              />
            ))}
          </View>
          <Input label="Email address" value={email} onChange={setEmail} />
          <Input
            label={
              mode === "recover"
                ? "New password (12+ characters)"
                : "Password (12+ characters)"
            }
            value={password}
            onChange={setPassword}
            secret
          />
          {mode === "recover" && (
            <Input
              label="Recovery code"
              value={recovery}
              onChange={setRecovery}
              secret
            />
          )}
          <Action
            title={mode === "recover" ? "Reset password" : "Sign in to cloud"}
            disabled={disabled || !email || password.length < 12}
            onPress={() =>
              void run(async () => {
                const code = await cloud.authenticate(
                  mode,
                  email,
                  password,
                  recovery,
                );
                setPassword("");
                setRecovery("");
                if (code) setNewRecovery(code);
              })
            }
          />
          <Text style={k.muted}>
            Your recovery code replaces email-based password reset. Store it
            privately; we cannot recover an account without its password or
            recovery code.
          </Text>
        </>
      ) : (
        <>
          <Text raw style={k.label}>
            {cloud.user.email}
          </Text>
          {!!newRecovery && (
            <View style={{ gap: 10 }}>
              <Text style={k.label}>
                Save this recovery code now. It is only shown once.
              </Text>
              <Text raw selectable style={k.message}>
                {newRecovery}
              </Text>
              <Action
                title="I saved my recovery code"
                secondary
                onPress={() => setNewRecovery("")}
              />
            </View>
          )}
          <View style={k.row}>
            <Action
              title="Restore cloud profile"
              secondary
              disabled={disabled}
              onPress={() => setReplace("download")}
            />
            <Action
              title="Back up this device to cloud"
              disabled={disabled}
              onPress={() => setReplace("upload")}
            />
          </View>
          {replace && (
            <View style={{ gap: 12 }}>
              <Text style={k.body}>
                {replace === "download"
                  ? "Replace this device’s profile with the saved cloud copy? Export this device first if you need to keep its changes."
                  : "Replace the cloud profile with this device’s current profile? Other devices will see a sync conflict until they restore the latest cloud copy."}
              </Text>
              <View style={k.row}>
                <Action
                  title="Confirm sync direction"
                  disabled={disabled}
                  onPress={() =>
                    void run(async () => {
                      await cloud.connect(replace);
                      setReplace(null);
                    })
                  }
                />
                <Action
                  title="Cancel sync"
                  secondary
                  onPress={() => setReplace(null)}
                />
              </View>
            </View>
          )}
          <Action
            title="Export cloud data"
            secondary
            disabled={disabled}
            onPress={() =>
              void run(async () =>
                exportFile(
                  "elevate-cloud-export.json",
                  JSON.stringify(await api("/export"), null, 2),
                ),
              )
            }
          />
          <Action
            title="Sign out and clear this device"
            secondary
            disabled={disabled}
            onPress={() => void run(() => cloud.logout())}
          />
          <Consent
            label="I want to permanently delete my cloud account and all uploaded media"
            value={confirm}
            onChange={setConfirm}
          />
          {confirm && (
            <>
              <Input
                label="Current password to confirm deletion"
                value={password}
                onChange={setPassword}
                secret
              />
              <Action
                title="Permanently delete cloud account"
                disabled={disabled || !password}
                onPress={() =>
                  void run(async () => {
                    await cloud.removeAccount(password);
                    setPassword("");
                    setConfirm(false);
                  })
                }
              />
            </>
          )}
        </>
      )}
      <Action
        title="Export this device’s data"
        secondary
        onPress={() =>
          void run(() =>
            exportFile(
              "elevate-device-export.json",
              JSON.stringify(
                { exportedAt: new Date().toISOString(), state },
                null,
                2,
              ),
            ),
          )
        }
      />
      <Text style={k.muted}>
        Exports are readable JSON containing your private coaching history.
        Store them somewhere you trust.
      </Text>
      {!!error && (
        <Text accessibilityRole="alert" style={k.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
