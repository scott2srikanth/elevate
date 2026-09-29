import test from "node:test";
import assert from "node:assert/strict";
import { validateManifest, virtualPath } from "../public/offline-policy.mjs";
const file = {
  path: "/observation/index.html",
  bytes: 100,
  sha256: "a".repeat(64),
};
const valid = {
  protocol: 1,
  id: "b".repeat(64),
  version: "0.1.1",
  files: [file],
};
test("offline manifests reject remote paths, traversal, duplicates, incompatible versions and unbounded downloads", () => {
  assert.equal(validateManifest(valid, "model").bytes, 100);
  for (const patch of [
    { protocol: 2 },
    { files: [{ ...file, path: "https://example.com/model" }] },
    { files: [{ ...file, path: "/observation/../api/me" }] },
    { files: [{ ...file, path: "/api/me" }] },
    { files: [file, file] },
    { files: [{ ...file, bytes: Infinity }] },
    { files: [{ ...file, bytes: 30000000 }] },
    { files: [{ ...file, sha256: "bad" }] },
  ])
    assert.throws(() => validateManifest({ ...valid, ...patch }, "model"));
});
test("offline shell permits static app files only; API data cannot enter the cache manifest", () => {
  assert.ok(
    validateManifest(
      { ...valid, files: [{ ...file, path: "/index.html" }] },
      "shell",
    ),
  );
  assert.throws(() =>
    validateManifest(
      { ...valid, files: [{ ...file, path: "/api/state" }] },
      "shell",
    ),
  );
});
test("virtual analyser URLs pin every dependency to one verified model generation", () => {
  const id = "a".repeat(64);
  assert.deepEqual(
    virtualPath(`/observation/offline/${id}/vendor/model.wasm`),
    { id, path: "/observation/vendor/model.wasm" },
  );
  assert.equal(virtualPath(`/observation/offline/${id}/../api/me`), null);
  assert.equal(virtualPath("/observation/offline/latest/runtime.mjs"), null);
});
