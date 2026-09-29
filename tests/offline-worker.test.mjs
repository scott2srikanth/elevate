import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { webcrypto, createHash } from "node:crypto";
import * as policy from "../public/offline-policy.mjs";
const digest = (text) => createHash("sha256").update(text).digest("hex");
function release(version, entries) {
  const files = Object.entries(entries).map(([path, text]) => ({
    path,
    bytes: Buffer.byteLength(text),
    sha256: digest(text),
  }));
  return { protocol: 1, version, id: digest(JSON.stringify(files)), files };
}
function storage() {
  const caches = new Map();
  return {
    keys: async () => [...caches.keys()],
    has: async (name) => caches.has(name),
    delete: async (name) => caches.delete(name),
    open: async (name) => {
      if (!caches.has(name)) caches.set(name, new Map());
      const items = caches.get(name);
      return {
        match: async (key) => items.get(key)?.clone(),
        put: async (key, value) => items.set(key, value.clone()),
      };
    },
  };
}
async function harness(store, network) {
  const events = {};
  const context = {
    ...policy,
    URL,
    Response,
    Headers,
    TextEncoder,
    Uint8Array,
    AbortSignal,
    crypto: webcrypto,
    caches: store,
    fetch: async (path) => {
      if (!network.has(path)) throw Error("Offline");
      return new Response(network.get(path));
    },
    self: {
      location: { origin: "https://test.local" },
      addEventListener: (name, handler) => {
        events[name] = handler;
      },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
    },
  };
  const code = (
    await fs.readFile(
      new URL("../public/elevate-offline-sw.js", import.meta.url),
      "utf8",
    )
  ).replace(/^import[\s\S]*?;\n/, "");
  vm.runInNewContext(code, context);
  return {
    call: async (type, expected) => {
      const messages = [];
      let task;
      events.message({
        source: { url: "https://test.local/observation/" },
        ports: [{ postMessage: (value) => messages.push(value) }],
        data: { type, expected },
        waitUntil: (promise) => {
          task = promise;
        },
      });
      await task;
      return messages.at(-1);
    },
  };
}
test("offline install survives worker restart and a corrupted update leaves the old package usable", async () => {
  const store = storage(),
    network = new Map();
  const one = release("0.1.1", { "/observation/index.html": "model one" });
  const shell = release("app-1", { "/index.html": "app shell" });
  network.set("/observation/model-release.json", JSON.stringify(one));
  network.set("/offline-app.json", JSON.stringify(shell));
  network.set("/observation/index.html", "model one");
  network.set("/index.html", "app shell");
  const worker = await harness(store, network);
  assert.equal((await worker.call("INSTALL")).result.ready, true);
  network.clear();
  const restarted = await harness(store, network);
  assert.equal((await restarted.call("STATUS")).result.installed, "0.1.1");
  assert.equal((await restarted.call("STATUS")).result.ready, true);
  assert.ok((await restarted.call("CHECK")).error);
  const two = release("0.1.2", { "/observation/index.html": "model two" });
  network.set("/observation/model-release.json", JSON.stringify(two));
  network.set("/offline-app.json", JSON.stringify(shell));
  network.set("/observation/index.html", "CORRUPTED");
  assert.match(
    (await restarted.call("INSTALL", two.id)).error,
    /verification failed/,
  );
  assert.equal((await restarted.call("STATUS")).result.installed, "0.1.1");
  assert.equal((await restarted.call("STATUS")).result.ready, true);
  network.set("/observation/index.html", "model two");
  assert.equal(
    (await restarted.call("INSTALL", two.id)).result.installed,
    "0.1.2",
  );
  assert.equal((await restarted.call("STATUS")).result.ready, true);
  assert.equal(
    (await store.keys()).filter((k) => k.startsWith(policy.PREFIX)).length,
    2,
  );
});
