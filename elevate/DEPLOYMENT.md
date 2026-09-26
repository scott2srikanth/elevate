# Deploy Elevate to Cloudflare and Android

## 1. Cloudflare resources

From this directory, with your Cloudflare account authenticated:

```sh
npx wrangler login
npx wrangler d1 create elevate
npx wrangler r2 bucket create elevate-private-media
```

Paste the returned database UUID into `d1_databases[0].database_id` in `wrangler.jsonc`. Keep the `DB`, `MEDIA`, and `AI` binding names unchanged. R2 must remain private: do not enable its public development URL or bind a public media domain. The Worker serves media only after checking ownership and expiry.

Set `vars.APP_ORIGIN` to the final HTTPS Worker/custom-domain origin, without a trailing slash. Set `vars.ALLOWED_ORIGINS` to the same origin and any explicitly trusted HTTPS web origins, comma-separated; remove localhost entries from the production configuration. Native requests use bearer authentication and have no browser Origin header.

Apply the schema and publish:

```sh
npm run db:migrate:remote
npm run check:deploy
npm run deploy
```

The deployment packages the Expo web export and API in one Worker. D1 and R2 bindings refer to your account resources. Cloudflare Workers hosting is used directly; no Sites service is involved.

For a Workers Builds pipeline, use this repository's `elevate` directory as the root, `npm ci && npm run build:web` as the build command, and `npm run deploy` as the deploy command. Apply D1 migrations explicitly as a controlled release step. Do not include a development `EXPO_PUBLIC_API_URL` value in production web builds; the web client defaults to its own origin.

## 2. Workers AI

The production config binds Workers AI but starts with `AI_ENABLED: "false"`. Enable it only after the account has access to the selected models and you have reviewed their current terms and usage costs.

Configured models:

- Text coaching: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Image review: `@cf/meta/llama-3.2-11b-vision-instruct`
- Voice transcription: `@cf/openai/whisper`, hosted by Cloudflare

The vision model requires acceptance of Meta's terms via the initial agreement request described in its official model page. That legal acceptance has not been performed by this app setup. After you complete it, set `AI_ENABLED` to `"true"` and deploy again. The app has per-account daily AI request limits; also configure account-level budget alerts and monitor actual usage in Cloudflare.

No model API secret is embedded in the app. The Worker uses its AI binding. Uploaded media and saved profile context are sent to Workers AI only after the user gives consent. Model responses are displayed as text, never executed as HTML, SQL, or tool instructions.

## 3. Native Android builds

Use your Expo account and connect the project through EAS. Set `EXPO_PUBLIC_API_URL` in the EAS preview and production environments to your deployed HTTPS Worker origin.

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

The preview profile produces an internal APK; production produces an AAB. `com.elevate.presencecoach` is the provisional Android application ID—confirm it before a public release. The development profile uses the included `expo-dev-client` package. Preview and production profiles produce standalone builds.

Install the generated APK on a physical Android phone and verify:

1. Register, save the recovery code, create a profile, and connect cloud sync.
2. Rehearse, close the app, reopen, and complete a real-world reflection.
3. Restore the same profile in a second device/browser, then deliberately test a conflicting edit.
4. Grant and deny camera/microphone/notification permissions; both paths should remain usable.
5. Record a short introduction; review the transcript for recognition errors. Test a JPEG photo and a short MP4 video-frame review.
6. Schedule daily and Sunday reminders, close the app, verify delivery, then cancel them. Android power management can affect delivery.
7. Check TalkBack, large font sizes, keyboard focus, portrait screens, and connectivity loss.
8. Export the profile, delete a private upload, sign out, and delete the test account.

The current workspace has no configured EAS account/project and no installed Java runtime for a local native build. No APK, store submission, or physical-device result is claimed.

## 4. Operations and recovery

- Cron runs hourly at minute 17. Verify it appears in the Worker dashboard. It removes expired R2 media and cleans sessions, rate-limit records, and 30-day diagnostic events.
- `GET /api/health` reports service availability and whether AI is enabled. Check authenticated state/AI requests separately after deployment.
- Worker observability is enabled with sampling. API failures also receive a random diagnostic reference and a sanitized D1 `events` record. Raw private content is not logged by application code.
- D1 is the authoritative cloud profile; device vaults hold offline edits. Writes include the expected revision and fail with HTTP 409 if another device saved first. The UI pauses synchronization, supports exporting the local copy, and asks which copy to keep. It does not silently merge conflicting journals.
- Before schema changes or migrations, use Cloudflare's D1 export/Time Travel procedures and verify the account's retention window. Keep access-controlled backup copies according to your own retention policy. Do not restore production blindly; validate recovery in a separate database and account for deleted-user records before a restore.
- Rotate sessions through account recovery, which changes the recovery code and revokes prior sessions. There is no email delivery service or verified-email ownership claim in this version.
- Customer deletion removes the live account and all live uploaded objects. Disaster-recovery backups may follow a separate provider retention period; document it in your published privacy policy.
- Use the deployment guard to catch placeholder database IDs and HTTP/localhost production settings. Review dependency audit results before each public release; avoid forcing major Expo dependency upgrades without checking SDK compatibility.

## 5. Local verification without credentials

```sh
npm ci
npm run build:web
npm run db:migrate:local
npm run dev:cloud
# Another terminal:
npm run lint
npm run typecheck
npm test
npm run test:api
npm run test:e2e
npm run build:android
```

`wrangler.local.jsonc` omits the AI binding so Wrangler does not attempt a remote proxy login. D1 and R2 are local emulators. A production Worker dry run can validate bundling without publishing, but actual remote AI quality, quotas, and permissions require your account.

## Official references

- [Cloudflare Worker static assets and bindings](https://developers.cloudflare.com/workers/static-assets/binding/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 recovery](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Workers AI vision model and license setup](https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/)
- [Workers AI Whisper transcription](https://developers.cloudflare.com/workers-ai/models/whisper/)
- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
