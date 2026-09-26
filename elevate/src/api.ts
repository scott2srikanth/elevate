import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web" && typeof window !== "undefined"
    ? window.location.origin
    : "")
).replace(/\/$/, "");
let nativeToken: string | null = null;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL)
    throw new ApiError(
      503,
      "Configure EXPO_PUBLIC_API_URL for the deployed Cloudflare Worker.",
    );
  if (Platform.OS !== "web" && !nativeToken)
    nativeToken = await SecureStore.getItemAsync("elevate.session");
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Elevate-Request": "1",
      ...(Platform.OS !== "web"
        ? {
            "X-Elevate-Client": "native",
            ...(nativeToken ? { Authorization: `Bearer ${nativeToken}` } : {}),
          }
        : {}),
      ...options.headers,
    },
    signal: options.signal || AbortSignal.timeout(90000),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(
      503,
      "The cloud API is unavailable at this address. Run the Cloudflare preview or configure EXPO_PUBLIC_API_URL.",
    );
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(response.status, data.error || "Request failed.");
  return data as T;
}
export async function rememberSession(token?: string) {
  if (Platform.OS === "web") return;
  nativeToken = token || null;
  if (token) await SecureStore.setItemAsync("elevate.session", token);
  else await SecureStore.deleteItemAsync("elevate.session");
}
export async function uploadMedia(
  uri: string,
  mime: string,
  purpose: string,
  retention: number,
) {
  let bytes: Blob | Uint8Array;
  if (Platform.OS === "web") bytes = await (await fetch(uri)).blob();
  else {
    const { File } = await import("expo-file-system");
    bytes = await new File(uri).bytes();
  }
  return api<{ id: string; expiresAt: number }>("/media", {
    method: "POST",
    headers: {
      "Content-Type": mime,
      "X-Media-Consent": "yes",
      "X-Media-Purpose": purpose,
      "X-Retention-Days": String(retention),
    },
    body: bytes as BodyInit,
  });
}
export async function privateMediaUri(id: string) {
  const headers: Record<string, string> = {};
  if (Platform.OS !== "web") {
    const t = await SecureStore.getItemAsync("elevate.session");
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  return { uri: `${API_URL}/api/media/${id}`, headers };
}
