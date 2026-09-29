# Offline models and admin releases

In **Coach → AI Coach**, choose **Download for offline use** once while connected. The app verifies and saves the observation models, runtimes and web application files. The status becomes **Offline ready**, and the analyser reloads into the installed generation. Photo, video and voice analysis then work with the server unavailable, including a fresh page load. Media files remain on the device.

The same service-worker and Cache Storage implementation runs in the web app and the Android WebView. Native WebView persistent DOM storage and caching are enabled; incognito mode is not used. Android needs a current System WebView with service-worker, Cache Storage and WebAssembly support, and an HTTPS `EXPO_PUBLIC_API_URL`. Unsupported devices show an explicit message rather than claiming readiness. Android physical-device restart/airplane-mode acceptance testing remains necessary.

## User updates

1. **Check for model updates** fetches only the small release manifest. It reports the installed and available versions.
2. **Sync update** installs the selected release. No model is silently replaced on launch. Files unchanged from the installed package are reused without downloading them again.
3. Every file is checked against its declared byte length and SHA-256 digest. Only a complete package becomes active. Interrupted, oversized, incompatible or corrupted releases preserve the working installed copy.
4. The analyser reloads after activation. Other open analysers remain pinned to their previous generation, so a running inference cannot mix old code with new weights. One previous generation is retained; older generations are reclaimed after successful updates.

A normal reopening reads the saved package without downloading models. The browser may make a small request to check the service-worker software itself. Model-release checks are user initiated. Account sync and curated online content still need connectivity; the service worker never caches API responses or media uploads.

## Admin publishing

Publishing uses the existing trusted deployment process; no public upload endpoint or extra admin credential is introduced.

1. Replace the reviewed model assets in `public/observation/vendor/` and adjust signal transforms if needed. Preserve upstream licenses.
2. Update `public/observation/release-config.json` to a new semantic version.
3. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build:web -- --clear`. The build generates `public/observation/model-release.json` and `dist/offline-app.json` automatically. `npm run models:release` can generate just the model manifest.
4. Deploy that complete web build through the existing authenticated deployment workflow. Do not hand-edit generated digests. Local implementation and testing do not publish a production release.
5. Users choose **Check for model updates → Sync update**. Existing installed versions keep working until they sync. Model changes compatible with protocol 1 do not require an APK rebuild after this offline-enabled app version is installed.

Model manifests are content-addressed: the generation ID is SHA-256 of the canonical ordered file list. Changing only the display version without changing any assets does not create a different model generation. The release protocol is independent of the observation report schema. Incompatible report/runtime changes require an app update; the installer rejects unsupported protocol versions. Reports record the model-generation digest for provenance.

The exported app shell is included in the same atomic installation, so a web user can reopen the Coach route offline. This also means installed web app code updates when the user syncs the offline copy. **Repair / sync offline copy** refreshes the shell even if the model generation is unchanged.

## Storage and privacy boundaries

Cache Storage is explicit persistent application storage, not the ordinary HTTP cache. Cache-first reads do not obey the server's `no-cache` header by re-downloading model files. The app requests `navigator.storage.persist()` during installation; browsers may grant or deny the request. Saved packages survive normal reloads and app restarts, but no website can promise storage forever: clearing site/app data, uninstalling, private browsing, quota pressure or browser eviction can remove it. Re-download is required if it is removed. Initial download also requires enough space for the package plus a staged update and retained previous generation.

The analyser refuses to report **Offline ready** unless every declared model and app-shell file exists. A pinned session never falls through to network weights if its package is missing. Model packages contain only static application assets. API responses, session tokens, user photos, video frames, decoded samples and recordings are not added to these caches. Derived coaching measurements continue to follow the user's existing account sync setting.

Integrity checks protect against interrupted/mixed/corrupted deployments. They are not independent signatures: the release manifest and assets are trusted from the app's HTTPS origin and its authorized deployment administrators.

## Implementation and tests

- `public/elevate-offline-sw.js`: staged download, SHA-256 verification, atomic active pointer, cache-first routing and version-pinned observation paths.
- `public/offline-policy.mjs`: protocol, size and path validation; API paths are forbidden.
- `public/observation/offline.mjs`: readiness, persistence request, progress, explicit update check and sync controls.
- `scripts/build-model-release.mjs`, `scripts/build-offline-shell.mjs`, `scripts/build-web.mjs`: reproducible release and app manifests.
- `tests/offline*.test.mjs`: worker restart with stored caches, corrupted-update rollback, successful replacement, schema/path/size rejection and generation routing.

Manual web validation: installed version 0.1.1, stopped the local server, closed the page, opened a fresh Coach page and successfully ran video-frame and voice inference. Restarted the server with 0.1.2; update check offered the new release without replacing 0.1.1, then explicit sync activated 0.1.2. Repeat on an actual Android device before releasing an APK.
