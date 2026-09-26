# Elevate — persistent personal coaching

React Native / Expo SDK 57 mobile app, with an Expo Router web build served by a Cloudflare Worker. D1 stores accounts and versioned coaching profiles. Private R2 objects hold optional media; Workers AI powers opt-in text, photo, and voice feedback.

## Run locally

Use Node 22 LTS (22.13+) or a supported newer LTS. The project includes a local Node 22 runtime for npm scripts.

```sh
npm install
npm run build:web
npm run db:migrate:local
npm run dev:cloud
```

Open http://localhost:8787. The local Worker emulates D1 and R2 with no Cloudflare credentials. AI is deliberately disabled, and the UI reports that fact. Local data is under `.wrangler/state/` (ignored by Git).

For hot reload, run `npm run web` in another terminal. That preview calls the local Worker on port 8787. For native development, set `EXPO_PUBLIC_API_URL` to an HTTPS deployed Worker or a reachable development address, then run `npm start`. A phone cannot reach your computer using `localhost`; use a reachable host. Use a development build for native notifications and media features.

## Implemented behavior

- Profile, eight-stage coaching program, real-world assignments, reflections, and transparent milestones.
- Stages advance when both skills receive a real-world reflection rated at least 3/5. Repeated curriculum skills require new practice after the preceding stage. Daily time budgets shorten rehearsal steps.
- Next practice prioritizes unfinished work, difficult attempts, reflection themes in the current focus, missing curriculum skills, and less-practiced focus skills. Theme extraction is explicitly labeled keyword matching. AI guidance is a separate opt-in service.
- Weekly reviews capture wins, obstacles, a next commitment, and a revised focus. User-controlled coach memories persist and can be forgotten.
- D1 accounts, recovery codes, automatic saves after connection, session resumption, cross-device restoration, optimistic revision conflicts, export, logout, and account deletion.
- Native AES-GCM device vault with a SecureStore-protected key. Browser vault uses Web Crypto and a non-exportable IndexedDB key. Legacy plaintext snapshots migrate on the next successful save. This is encryption at rest, not a lock on an already-open browser and not end-to-end cloud encryption.
- Wardrobe inventory, private photos, combinations using owned pieces, and occasion preparation checklists.
- Photo coaching; two-minute voice recordings with transcription, approximate words/minute and recognized filler counts; video review using three locally extracted still frames. It does not claim continuous motion tracking, pose estimation, pitch, loudness, or objective confidence measurement.
- Dining scenarios with explanations, contextual cultural guidance, personal-brand statements, headline drafts, and introductions.
- Native daily practice and Sunday review notifications. Web users export a recurring calendar reminder and activate it by importing it into their calendar; there is no background browser push service.
- Explicit media/AI consent, retention options, private media library, early deletion, exports, confirmed account deletion, sanitized server diagnostics and a client error boundary.
- Router URLs, mobile bottom navigation, keyboard-aware forms, screen-reader labels, hidden modal backgrounds, and automated contrast/accessibility checks.

## Cloudflare deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete setup. Production uses `wrangler.jsonc`; local tests use `wrangler.local.jsonc` without a remote AI binding.

You must supply a real D1 database ID, create the private R2 bucket, set the production HTTPS origins, and enable Workers AI after reviewing its model terms. `npm run deploy` checks for placeholder database IDs and localhost production settings before building and publishing. No resources have been created in your Cloudflare account by this implementation.

## Android

`eas.json` includes development, internal APK, and production AAB profiles. Set the EAS `EXPO_PUBLIC_API_URL` environment value to your deployed HTTPS Worker. Then use:

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The JavaScript/Hermes Android bundle has been compiled. An installable APK has not been produced or tested on a physical phone here; EAS account/project and signing setup are required. See the release checks in DEPLOYMENT.md.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run test:api     # local Worker must be running
npm run test:e2e     # requires current web export and local D1 migrations
npm run build:android
```

Domain tests cover stage transitions, time budgets, recommendations, migrations, and progress. API tests exercise real local D1/R2 account isolation, revision conflicts, consent, private access, recovery-code rotation, export, and deletion. Browser tests cover the original coaching loop plus cloud backup/restore in independent browser contexts, encryption, weekly reviews, coach memory, AI-unavailable handling, dining, branding, and accessibility at mobile/desktop widths. Google Chrome is used for browser tests.

Live AI output quality, production Cloudflare deployment, native permissions/recording/notifications, and physical-device behavior remain environment-dependent release checks. The app never substitutes fake AI output when the provider is unavailable.

## Security and operational boundaries

- Account identifiers are email-shaped usernames. Email ownership is not verified; password recovery uses a generated single-use recovery code, not email delivery. Recovery rotates the code and revokes existing sessions. Keep the code private.
- Passwords use salted PBKDF2-SHA256 at 100,000 iterations, within the Workers Web Crypto implementation limit. Sessions are random 256-bit tokens stored only as hashes in D1, with 30-day expiry. Web uses HttpOnly SameSite=Strict cookies (Secure on HTTPS); native stores its bearer token in SecureStore.
- All state and media queries are scoped to the authenticated user. Writes require a custom CSRF header; browser origins are allowlisted. API inputs are validated and size bounded. Authentication, uploads, AI requests, and diagnostics are rate limited.
- One versioned state document per user is currently limited to 1 MiB per API write. Individual images/audio are limited to 5 MiB; native/video decoding is limited in the UI to two minutes. The original practice video stays on-device; only selected frames are uploaded. Export/archive older coaching history before the document limit is reached.
- New analysis uploads can be deleted immediately after analysis or retained for 7/30 days. Interrupted ephemeral uploads expire after one hour. Cron cleans expired media hourly in batches of 500; authorization prevents access after expiry even if cleanup is delayed. Wardrobe photos expire after 30 days. Local media previews/recordings use temporary device/browser storage and normal OS/browser cache behavior.
- Cloud export includes profile data and a private-media manifest, not embedded media binaries. Account deletion removes live R2 objects first, then D1 rows and sessions. Cloudflare-managed backup retention is separate; consult provider settings and the runbook before promising immediate erasure from backups.
- Server diagnostics store event type, timestamp, and random reference only, retained for 30 days. No journal content, raw media, password, session token, or recovery code is deliberately logged.
- This code has automated tests, not an independent security audit. Public subscriptions, human-coach marketplaces, and enterprise dashboards from the long-term business roadmap are outside this release.

## Files

- `App.tsx`, `src/app/`, `src/components/`: app shell, routes, and coaching modules.
- `src/coach.ts`, `src/development.ts`: coaching content and adaptive rules.
- `src/shared/schema.ts`: shared D1/client validation and backward-compatible defaults.
- `src/localVault.ts`, `src/storage.ts`, `src/useCloud.ts`: encrypted persistence and synchronization.
- `worker/`: Cloudflare API, authentication, AI integration, and scheduled cleanup.
- `migrations/`: D1 schema.
- `tests/`: domain, Worker integration, browser, and accessibility checks.
