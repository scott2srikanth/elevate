import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { gcm } from "@noble/ciphers/aes.js";
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
const bytes = (value: string) =>
  Uint8Array.from(value.match(/.{2}/g) || [], (v) => parseInt(v, 16));
async function nativeKey() {
  let key = await SecureStore.getItemAsync("elevate.vault-key");
  if (!key) {
    key = hex(Crypto.getRandomBytes(32));
    await SecureStore.setItemAsync("elevate.vault-key", key);
  }
  return bytes(key);
}
let browserKeyPromise: Promise<CryptoKey> | undefined;
function browserKey() {
  return (browserKeyPromise ??= (async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("elevate-vault", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("keys");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const existing = await new Promise<CryptoKey | undefined>(
      (resolve, reject) => {
        const req = db.transaction("keys").objectStore("keys").get("profile");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      },
    );
    if (existing) {
      db.close();
      return existing;
    }
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    // Recheck in a write transaction so two tabs never choose different keys.
    const selected = await new Promise<CryptoKey>((resolve, reject) => {
      const tx = db.transaction("keys", "readwrite");
      const store = tx.objectStore("keys");
      const read = store.get("profile");
      let chosen = key;
      read.onsuccess = () => {
        if (read.result) chosen = read.result;
        else store.put(key, "profile");
      };
      tx.oncomplete = () => resolve(chosen);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return selected;
  })());
}
export async function seal(text: string) {
  const iv = Crypto.getRandomBytes(12);
  const plain = new TextEncoder().encode(text);
  const cipher =
    Platform.OS === "web"
      ? new Uint8Array(
          await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            await browserKey(),
            plain,
          ),
        )
      : gcm(await nativeKey(), iv).encrypt(plain);
  return JSON.stringify({ encrypted: 1, iv: hex(iv), cipher: hex(cipher) });
}
export async function unseal(raw: string) {
  const envelope = JSON.parse(raw);
  if (envelope.encrypted !== 1) return raw;
  const iv = bytes(envelope.iv),
    cipher = bytes(envelope.cipher);
  const plain =
    Platform.OS === "web"
      ? new Uint8Array(
          await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            await browserKey(),
            new Uint8Array(cipher),
          ),
        )
      : gcm(await nativeKey(), iv).decrypt(cipher);
  return new TextDecoder().decode(plain);
}
