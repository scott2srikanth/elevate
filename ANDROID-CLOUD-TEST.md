# Android and production cloud checks — 2026-09-27

Installed app: com.elevate.presencecoach, version 1.1.0 build 3, Android emulator.
Production: https://elevate.skrdy.com.

## Results

- PASS: production /api/health returns 200 and manual ChatGPT mode.
- PASS: unauthenticated production /api/state returns 401.
- BLOCKED: installed APK sign-in reports missing EXPO_PUBLIC_API_URL. No native sync request can reach production. Preview and production EAS profiles now include the URL; rebuild/install required.
- FAIL: production native account registration returns 500, diagnostic reference 7dfd7e43-b11e-42bb-834b-9f3082a0cfb8. No successful QA account registration. Root cause unconfirmed; Wrangler cannot inspect D1 without Cloudflare authentication. D1 read/write/restore/conflict and R2 isolation tests did not run beyond registration.
- PASS: notification denial produces a readable message without a crash.
- PASS: granting notification permission schedules daily and weekly reminders. Android dumpsys alarm showed two Elevate alarms, daily at 09:00 the next day and weekly Sunday at 09:00.
- PASS: disabling reminders reports cancellation. Left reminders disabled. Actual timed delivery was not tested.
- PARTIAL: camera permission prompt, launch, and synthetic capture work. With Only this time permission, Android killed the app after revoking that permission while the camera was open (ActivityManager log). Confirming the image relaunched Today instead of restoring the wardrobe preview. Pending camera result recovery remains a follow-up; uploaded image persistence untested.

Existing local QA profile and practice history remain intact. No user account or cloud data was deleted. The temporary API test stopped at registration failure. Source lint, typecheck and deployment guard passed after the EAS profile fix. A replacement APK has not been built or installed in this test.

## Resume

1. Authenticate the local CLI with npx wrangler login.
2. Inspect D1 migration status and Worker logs for the diagnostic reference; apply missing migrations if confirmed.
3. Rebuild the preview APK with npm run build:android:apk and install it as an upgrade.
4. Repeat native account creation, backup, restart/session restoration, second-session restore, conflict, R2 and deletion checks using temporary QA data.
