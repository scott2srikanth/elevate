import {
  PREFIX,
  META,
  ACTIVE,
  validateManifest,
  virtualPath,
} from "./offline-policy.mjs";
let installing = false;
const absolute = (path) => {
  const url = new URL(path, self.location.origin);
  url.pathname = url.pathname
    .split("/")
    .map((part) => encodeURIComponent(decodeURIComponent(part)))
    .join("/");
  return url.href;
};
const json = (data) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
async function active() {
  const entry = await (await caches.open(META)).match(absolute(ACTIVE));
  return entry ? entry.json() : null;
}
async function complete(state) {
  if (!state || !(await caches.has(state.cache))) return false;
  const cache = await caches.open(state.cache);
  for (const file of [...state.model.files, ...state.shell.files])
    if (!(await cache.match(absolute(file.path)))) return false;
  return true;
}
async function status() {
  const state = await active();
  return {
    ready: await complete(state),
    installed: state?.model.version ?? null,
    id: state?.model.id ?? null,
  };
}
async function remote(path) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok)
    throw Error(
      "Unable to reach the model server. Your installed copy is unchanged.",
    );
  return response;
}
async function manifest(path, kind) {
  const response = await remote(path);
  const data = await response.text();
  if (data.length > 100000) throw Error("Invalid package manifest.");
  const result = validateManifest(JSON.parse(data), kind);
  const digest = await hash(
    new TextEncoder().encode(JSON.stringify(result.files)),
  );
  if (digest !== result.id)
    throw Error("Package manifest fingerprint mismatch.");
  return result;
}
async function hash(data) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
async function install(expected, send) {
  if (installing)
    throw Error("Another download is in progress. Wait for it to finish.");
  installing = true;
  let staging;
  try {
    const model = await manifest("/observation/model-release.json", "model");
    if (expected && expected !== model.id)
      throw Error("The published release changed. Check for updates again.");
    const shell = await manifest("/offline-app.json", "shell");
    const old = await active();
    if (
      old?.model.id === model.id &&
      old?.shell.id === shell.id &&
      (await complete(old))
    )
      return { ...(await status()), unchanged: true };
    staging = PREFIX + model.id + "-" + crypto.randomUUID();
    const cache = await caches.open(staging);
    const oldCache =
      old && (await caches.has(old.cache))
        ? await caches.open(old.cache)
        : null;
    const files = [...model.files, ...shell.files];
    let done = 0;
    for (const file of files) {
      let response;
      const previous = [
        ...(old?.model.files ?? []),
        ...(old?.shell.files ?? []),
      ].find((f) => f.path === file.path && f.sha256 === file.sha256);
      if (previous && oldCache)
        response = await oldCache.match(absolute(file.path));
      if (!response) response = await remote(file.path);
      const bytes = await response.clone().arrayBuffer();
      if (
        bytes.byteLength !== file.bytes ||
        (await hash(bytes)) !== file.sha256
      )
        throw Error(
          "Download verification failed. The working version has been kept.",
        );
      const headers = new Headers(response.headers);
      headers.delete("content-encoding");
      headers.delete("content-length");
      await cache.put(
        absolute(file.path),
        new Response(bytes, { status: 200, headers }),
      );
      done += file.bytes;
      send({
        progress: Math.round((done / (model.bytes + shell.bytes)) * 100),
      });
    }
    const state = {
      cache: staging,
      model,
      shell,
      previous: old?.cache ?? null,
    };
    if (!(await complete(state)))
      throw Error(
        "Offline storage is incomplete. Free some space and try again.",
      );
    // Single pointer write commits only a complete, hash-verified package.
    await cache.put(absolute("/__release__"), json(state));
    await (await caches.open(META)).put(absolute(ACTIVE), json(state));
    staging = null;
    // Keep the previous package for open pinned sessions. Reclaim older generations only.
    for (const name of await caches.keys())
      if (
        name.startsWith(PREFIX) &&
        name !== state.cache &&
        name !== state.previous
      )
        await caches.delete(name);
    return { ...(await status()), updated: true };
  } finally {
    if (staging) await caches.delete(staging);
    installing = false;
  }
}
self.addEventListener("install", (event) =>
  event.waitUntil(self.skipWaiting()),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("message", (event) => {
  const port = event.ports[0];
  if (
    !port ||
    !event.source?.url ||
    new URL(event.source.url).origin !== self.location.origin
  )
    return;
  const send = (data) => port.postMessage(data);
  event.waitUntil(
    (async () => {
      try {
        switch (event.data?.type) {
          case "STATUS":
            send({ result: await status() });
            break;
          case "CHECK": {
            const release = await manifest(
              "/observation/model-release.json",
              "model",
            );
            send({
              result: {
                ...(await status()),
                available: release.version,
                availableId: release.id,
                bytes: release.bytes,
              },
            });
            break;
          }
          case "INSTALL":
            send({ result: await install(event.data.expected, send) });
            break;
          default:
            throw Error("Unknown offline operation.");
        }
      } catch (error) {
        send({
          error:
            error.message ||
            "Offline operation failed. Your installed copy is unchanged.",
        });
      }
    })(),
  );
});
async function pinnedCache(id) {
  const state = await active();
  if (state?.model.id === id && (await caches.has(state.cache)))
    return caches.open(state.cache);
  for (const name of await caches.keys())
    if (name.startsWith(PREFIX + id + "-")) return caches.open(name);
  return null;
}
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.origin !== self.location.origin ||
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/offline-app.json" ||
    url.pathname === "/observation/model-release.json" ||
    url.pathname === "/elevate-offline-sw.js" ||
    url.pathname === "/offline-policy.mjs"
  )
    return;
  event.respondWith(
    (async () => {
      const pinned = virtualPath(url.pathname);
      if (pinned) {
        const cache = await pinnedCache(pinned.id);
        const response = await cache?.match(absolute(pinned.path));
        // Never fall through to a different network model in a pinned analysis session.
        return (
          response ||
          new Response(
            "Offline package missing. Reopen AI Coach and download the package again.",
            { status: 503, headers: { "Content-Type": "text/plain" } },
          )
        );
      }
      const state = await active();
      if (state) {
        const cache = await caches.open(state.cache);
        if (
          url.pathname === "/observation/" ||
          url.pathname === "/observation/index.html" ||
          url.pathname === "/observation/garment/index.html"
        ) {
          if (
            await cache.match(
              absolute(
                url.pathname.includes("/garment/")
                  ? "/observation/garment/index.html"
                  : "/observation/index.html",
              ),
            )
          )
            return Response.redirect(
              absolute(
                "/observation/offline/" +
                  state.model.id +
                  (url.pathname.includes("/garment/")
                    ? "/garment/index.html"
                    : "/index.html"),
              ) + url.search,
              302,
            );
        }
        const stored = await cache.match(absolute(url.pathname));
        if (stored) return stored;
        if (
          event.request.mode === "navigate" &&
          !url.pathname.startsWith("/observation/")
        ) {
          const shell = await cache.match(absolute("/index.html"));
          if (shell) return shell;
        }
      }
      return fetch(event.request);
    })(),
  );
});
