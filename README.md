# Elevate — persistent personal coaching

React Native / Expo SDK 57 mobile app, with an Expo Router web build served by a Cloudflare Worker. D1 stores accounts and versioned coaching profiles. Private R2 objects hold optional wardrobe photos. Coaching analysis runs on-device through Elevate One AI Coach—no API key, AI binding, or sign-in is needed for the studio.

## English and Telugu

On first launch, a short animated Elevate splash leads into profile setup with a language selector, name, goal, focus, daily practice time, and confidence. Change language later in **Profile → Choose your language**. English is the default for existing profiles. Telugu covers navigation, lessons, coaching tools, forms, and reminders. Your own notes and imported analyses are preserved as entered; AI Coach navigation is translated, while new diagnostic prose currently falls back to English pending language review.

The language preference is saved in the encrypted device profile and synced through D1. The splash respects reduced motion. Version 1.2.0 requires a rebuilt Android APK to show the new native splash and screens.

## Run locally

Use Node 22 LTS (22.13+) or a supported newer LTS. The project includes a local Node 22 runtime for npm scripts.

```sh
npm install
npm run build:web
npm run db:migrate:local
npm run dev:cloud
```

Open http://localhost:8787. The local Worker emulates D1 and R2 with no Cloudflare credentials. The studio uses local AI Coach decisions and adaptive progression. Local data is under `.wrangler/state/` (ignored by Git).

For hot reload, run `npm run web` in another terminal. That preview calls the local Worker on port 8787. For native development, set `EXPO_PUBLIC_API_URL` to an HTTPS deployed Worker or a reachable development address, then run `npm start`. A phone cannot reach your computer using `localhost`; use a reachable host. Use a development build for native notifications and media features.

## Implemented behavior

- Profile, eight-stage coaching program, real-world assignments, reflections, and transparent milestones.
- Stages advance when both skills receive a real-world reflection rated at least 3/5. Repeated curriculum skills require new practice after the preceding stage. Daily time budgets shorten rehearsal steps.
- Next practice prioritizes unfinished work, difficult attempts, reflection themes in the current focus, missing curriculum skills, and less-practiced focus skills. Theme extraction is explicitly labeled keyword matching. Due spaced reviews and accepted self-check decisions also guide recommendations; see STUDIO.md for precedence. Legacy saved analyses remain readable.
- Weekly reviews capture wins, obstacles, a next commitment, and a revised focus. User-controlled coach memories persist and can be forgotten.
- D1 accounts, recovery codes, automatic saves after connection, session resumption, cross-device restoration, optimistic revision conflicts, export, logout, and account deletion.
- Native AES-GCM device vault with a SecureStore-protected key. Browser vault uses Web Crypto and a non-exportable IndexedDB key. Legacy plaintext snapshots migrate on the next successful save. This is encryption at rest, not a lock on an already-open browser and not end-to-end cloud encryption.
- Wardrobe inventory, private photos, combinations using owned pieces, and occasion preparation checklists.
- On-device AI Coach, weekly reviews and presentation self-checks: 50 typed decisions, confidence-based abstention, progression trends, spaced review, saved analyses and direct practice launch. See [STUDIO.md](./STUDIO.md).
- Dining scenarios with explanations, contextual cultural guidance, personal-brand statements, headline drafts, and introductions.
- Native daily practice and Sunday review notifications. Web users export a recurring calendar reminder and activate it by importing it into their calendar; there is no background browser push service.
- Explicit optional wardrobe upload consent, private media library, early deletion, exports, confirmed account deletion, sanitized server diagnostics and a client error boundary.
- Router URLs, mobile bottom navigation, keyboard-aware forms, screen-reader labels, hidden modal backgrounds, and automated contrast/accessibility checks.

## Cloudflare deployment

The app and Wrangler configuration are at the repository root. In Cloudflare **Workers Builds**, set the root to `/` (or leave blank), build command to `npm ci`, and deploy command to `npm run deploy`. Wrangler builds the web assets into `dist/` before publishing. Remove any previous `elevate` root-directory setting.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete setup. Production uses `wrangler.jsonc`; local tests use `wrangler.local.jsonc` without a remote AI binding.

You must supply a real D1 database ID, create the private R2 bucket, set the production HTTPS origins. `npm run deploy` checks for placeholder database IDs and localhost production settings before building and publishing. No resources have been created in your Cloudflare account by this implementation.

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

Domain tests cover stage transitions, time budgets, recommendations, migrations, and progress. API tests exercise real local D1/R2 account isolation, revision conflicts, consent, private access, recovery-code rotation, export, and deletion. Browser tests cover the original coaching loop plus cloud backup/restore in independent browser contexts, encryption, weekly reviews, coach memory, on-device AI Coach, self-check persistence and chart rendering, dining, branding, and accessibility at mobile/desktop widths. Google Chrome is used for browser tests.

Real-world model quality, production Cloudflare deployment, native clipboard/camera/notifications, and physical-device behavior remain release checks. Browser tests use clearly marked fixtures, not real human evaluation.

## Security and operational boundaries

- Account identifiers are email-shaped usernames. Email ownership is not verified; password recovery uses a generated single-use recovery code, not email delivery. Recovery rotates the code and revokes existing sessions. Keep the code private.
- Passwords use salted PBKDF2-SHA256 at 100,000 iterations, within the Workers Web Crypto implementation limit. Sessions are random 256-bit tokens stored only as hashes in D1, with 30-day expiry. Web uses HttpOnly SameSite=Strict cookies (Secure on HTTPS); native stores its bearer token in SecureStore.
- All state and media queries are scoped to the authenticated user. Writes require a custom CSRF header; browser origins are allowlisted. API inputs are validated and size bounded. Authentication, uploads, and diagnostics are rate limited.
- One versioned state document per user is currently limited to 1 MiB per API write. Wardrobe uploads are limited to 5 MiB. AI Coach uses explicit self-checks and optional local media observations. Only derived media measurements are persisted; see [OBSERVATION_MODEL.md](OBSERVATION_MODEL.md). Export/archive older coaching history before the document limit is reached.
- Wardrobe photos expire after 30 days. Legacy analysis uploads retain their original expiry and can be deleted in My style. Cron cleans expired media hourly in batches of 500; authorization prevents access after expiry even if cleanup is delayed.
- Cloud export includes profile data and a private-media manifest, not embedded media binaries. Account deletion removes live R2 objects first, then D1 rows and sessions. Cloudflare-managed backup retention is separate; consult provider settings and the runbook before promising immediate erasure from backups.
- Server diagnostics store event type, timestamp, and random reference only, retained for 30 days. No journal content, raw media, password, session token, or recovery code is deliberately logged.
- This code has automated tests, not an independent security audit. Public subscriptions, human-coach marketplaces, and enterprise dashboards from the long-term business roadmap are outside this release.

## Files

- `App.tsx`, `src/app/`, `src/components/`: app shell, routes, and coaching modules.
- `src/coach.ts`, `src/development.ts`: coaching content and adaptive rules.
- `src/shared/schema.ts`: shared D1/client validation and backward-compatible defaults.
- `src/localVault.ts`, `src/storage.ts`, `src/useCloud.ts`: encrypted persistence and synchronization.
- `worker/`: Cloudflare API, authentication and scheduled cleanup.
- `migrations/`: D1 schema.
- `tests/`: domain, Worker integration, browser, and accessibility checks.

## Offline observation models

Choose **Coach → AI Coach → Download for offline use** once. After **Offline ready**, the stored models and app shell support offline analysis across normal restarts. **Check for model updates → Sync update** installs an admin-published release only on request. See [OFFLINE_MODELS.md](OFFLINE_MODELS.md) for publishing, storage limits and Android acceptance tests.
