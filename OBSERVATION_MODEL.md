# Elevate Observe 0.1

Automatic observation is now available in **Coach → AI Coach**, after opting in. Select a photo, video or voice recording; analysis starts immediately and the derived report updates coaching without JSON exchange. Selecting existing recordings works in the browser and through the Android WebView file chooser. Live camera/microphone capture is not implemented.

## Architecture

```
Local selected file
  ├─ Photo / sampled video → MediaPipe Pose Landmarker Lite + exposure rules
  └─ Decoded audio        → Silero legacy VAD / ONNX Runtime + signal rules
          ↓
Typed observation report (source, time, metrics, reliability, limitations)
          ↓
Freshness and reliability gates → compatible Elevate One decision inputs
          ↓
Recording-specific guidance + adaptive practice recommendation
          ↓
Real-world reflection → existing learning progression
```

This is one observation service composed of two pretrained models and transparent signal transforms, not a newly trained general multimodal model. There is no generative language model, speech transcription, emotion inference, attractiveness scoring, clothing recognition or medical/posture diagnosis. Existing user self-checks remain necessary for semantic and contextual inputs.

## Measured outputs

| Input | Outputs | Gate / meaning |
|---|---|---|
| Photo | Overall exposure proxy, horizontal head centring, head/shoulder framing | Exactly one detected pose, visible in-frame head and shoulders, landmark visibility ≥ .75 |
| Video | Means across at most 12 evenly spaced frames; audio metrics when decodable | ≥70% of sampled frames must have usable landmarks; visibility × usable-frame proportion must reach .70 to affect coaching |
| Audio | Detected speech duration, digital RMS level in dBFS, clipped-sample fraction, longest internal inter-segment gap | Silero VAD positive threshold .70; ≥1 second detected speech; gap advice needs ≥3 seconds speech |

Exposure, audio and gap transforms use a declared heuristic reliability of .80; they are not calibrated probabilities or real-world accuracy scores. Pose reliability uses model landmark visibility and sampling coverage. Background music, noise, occlusion, multiple people, device gain, camera orientation and atypical framing can invalidate assumptions. Whole-frame exposure is not facial illumination or a skin/beauty score. Voice detection does not establish word rate, pronunciation, intent or vocal ability.

The current visual task assumes a solo camera presentation. It doesn't classify clothing, evaluate body shape or infer comfort. Exposure and framing can trigger a recording-setup check before introduction practice. Quiet detected speech, clipping or long gaps can suggest another take. Suggestions remain optional.

## Connection and data lifecycle

- `src/shared/observation.ts` validates messages and persisted reports; bridge messages require the current session token, correct source/origin and a recent timestamp.
- `src/intelligence/observation.ts` supplies compatible `lighting`, `framing`, `head_position`, `volume` features. A digital volume proxy maps [-45,-18] dBFS to [0,1]; this mapping is experimental. Pauses are retained as measurements/guidance, not mislabeled as intentional pauses or speech pace.
- The newest report for each modality supersedes older evidence, including abstentions. Reports expire as decision inputs after 24 hours. Explicit fresh self-checks take priority.
- Per-head evidence quality is bounded by the reliability of media measurements actually used by that head. No automatic global evidence-quality rating fills unrelated decisions.
- Recording guidance follows unfinished assignments, difficult reflections and due reviews in recommendation priority. It never advances curriculum stages or creates practice reflections.
- At most ten derived reports are retained in the existing device vault and optional account state sync. Clear them in AI Coach. Files, audio samples, video frames and landmarks are not persisted or uploaded. Browser model assets are ordinary cached resources.
- Input limit: 20 MB; audio 1–60 seconds, video ≤60 seconds, decoded image dimensions ≤40 MP. Browser codecs determine accepted formats; unsupported video audio produces a visible partial-result note. Use JPEG/PNG, MP4/H.264/AAC and WAV for broad compatibility.
- Disabling AI Coach unmounts the analyser; local analysis consent revocation prevents result delivery. Revoking use does not delete already saved measurements; use the clear control.

## Runtime and deployment

The platform components use a same-origin iframe on web and the existing `react-native-webview` module on Android. The runtime and all models are bundled under `public/observation/`, copied by Expo web export, and served by the existing Worker. About 37 MiB of assets are shipped; visual and audio runtimes load lazily. The native APK does **not** embed these assets: the first package installation requires connectivity to `EXPO_PUBLIC_API_URL`, with WebAssembly, service-worker and Cache Storage support in Android System WebView. The offline package now persists through normal restarts using service-worker Cache Storage; see [OFFLINE_MODELS.md](OFFLINE_MODELS.md). Android physical-device cold-start validation remains pending.

Deploy the updated web assets before distributing an Android build. Existing EAS preview/production profiles already point to `https://elevate.skrdy.com`; this implementation has not deployed there. A development build must use a reachable server URL. Android file chooser, codecs, memory and lifecycle still require physical-device acceptance testing; a successful Hermes export is not an installed-APK test.

The analyser has a path-specific CSP permitting same-origin embedding and WebAssembly compilation. It makes no third-party runtime requests. Existing global protections remain on other pages. No new native microphone permission was enabled.

## Pinned upstream components

- [MediaPipe web pose guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js): tasks-vision `0.10.22-rc.20250304`, Lite float16 model revision `1` (Apache 2.0).
- [VAD source](https://github.com/ricky0123/vad): `@ricky0123/vad-web` `0.0.30` (ISC), embedded Silero legacy model (MIT).
- [ONNX Runtime](https://github.com/microsoft/onnxruntime): `onnxruntime-web` `1.22.0` (MIT); WASM runs single-threaded, avoiding cross-origin isolation requirements.
- [Expo SDK 57 WebView](https://docs.expo.dev/versions/v57.0.0/sdk/webview/): existing `react-native-webview` `13.16.1`.

Licenses are retained in `public/observation/vendor/`; `asset-manifest.json` lists SHA-256 hashes for shipped vendor files. The optional test image is Google's public MediaPipe `pose.jpg` sample; the speech fixture is synthetic macOS narration, and the video combines those fixtures. Test fixtures are never served as user media.

## Validation

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build:web -- --clear`, and `npm run build:android -- --clear`.

`node scripts/test-observation.mjs` runs the browser model smoke tests against `OBSERVATION_TEST_URL` (default localhost:8788). It needs Chrome and the running web build. It checks actual pose inference, actual speech detection, silent-audio abstention and blank-video handling. Unit tests exercise schema rejection, timestamp/reliability gating, self-check priority, account-state roundtrip, consent and unchanged progression. These tests establish implementation behavior, not coaching efficacy or subgroup fairness.
