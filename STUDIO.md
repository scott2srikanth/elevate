# On-device AI Coach

The learner studio now provides **Overview**, **Recordings**, **Self-check**, and **Progress** on both Android and web. It replaces the ChatGPT request/response export-and-import flow. No API key or separate ChatGPT account is needed. User profile backups and administrator content imports remain separate features.

## Studio navigation

Overview shows one recommended practice, three compact progress indicators and two actions. Recordings contains the on-device analyser, offline downloads/updates and a collapsed list of saved measurements. Self-check saves ratings automatically. Progress contains the full learning-stage and skill history, without repeating empty-state messages per skill.

Resources & settings contains videos, weekly review, saved plans, coach memory, dining, cultural context, personal brand and coach settings. Detailed reports and model diagnostics open only when requested. Mobile uses an even two-column tab layout and large touch targets; wide web layouts place the two overview actions side by side. Consent remains available in settings after setup. These layout changes preserve learning rules, media privacy and explicit offline model sync.

## Learning progression

The next practice is chosen in this order:

1. An existing rehearsed assignment, so the learner can finish its real-world challenge.
2. A smaller repetition after the most recent difficult reflection (confidence 1–2/5).
3. A due spaced review: 1 day after difficulty, 3 days at 3/5, 7 days at 4–5/5, or 14 days after three distinct practice days rated 4–5/5.
4. An accepted Elevate One next-exercise decision based on a current self-check.
5. Explicit keyword themes in reflections, unfinished curriculum skills, then less-practised skills matching the profile focus.

The eight-stage curriculum still advances only on qualifying real-world reflections (at least 3/5); repeated stages require new practice. Future records are excluded. Progress counts at most one observation per skill per local calendar day and deduplicates reflection IDs. Trends compare the latest three practice days with the preceding two or three; insufficient evidence produces no trend. Consistent self-reported confidence is **not mastery**.

This adapts the recommendation policy and learner state. The trained model's weights do **not** learn online from user data. No effectiveness study or real-world coaching calibration is claimed.

## Decision model and evidence

`src/intelligence/model.ts` bundles the original Elevate One synthetic-policy weights: 50 feature-sparse softmax heads, 345 trained coefficients and per-head calibration temperatures. `engine.ts` runs them in pure TypeScript without a server, WebView or native ML dependency.

The learner explicitly opts in. Optional self-check scores map 1–5 to [0,1]. Unanswered observations stay unknown. Context, fatigue and observation-quality ratings expire after 24 hours; other ratings expire after seven days. Profile goals, time budget and recent self-reported practice summaries are derived separately, without pretending that confidence is an observed posture or garment-fit measurement. Unknown/future/invalid observations are excluded. Automatic photo, video and voice observations are connected through Elevate Observe; see [OBSERVATION_MODEL.md](OBSERVATION_MODEL.md) for measured signals, reliability gates and limits.

Each head withholds its categorical output when observations are missing, observation quality is below .35, or calibrated probability is below .70. An unavailable blazer is never selected. When the model cannot choose an exercise, the transparent history-based policy remains available. Free-text memories are retained as reference but are not interpreted by the small model.

## Local storage and sync

`aiCoach` stores consent and timestamped observations alongside the existing state, using the existing encrypted device storage. The shared Zod schema defaults older profiles to consent off with no observations; old imported analyses remain readable. Opting out stops model recommendations without silently deleting history. Clear self-checks or delete analyses in History to remove them.

Saved analyses use the existing validated `CoachingAnalysis` contract and can sync through the existing opt-in D1 account flow. Deploy the updated Worker schema together with clients so old servers do not strip the new state field. No SQL migration is required. Account backup/export remains available; only the learner ChatGPT handoff was removed.

The server health mode is `on-device-elevate-one`; `ai: false` means no **server-side** model. Retired `/api/coach` and `/api/analyze` routes still return 410 and direct callers to the app.

## Platform delivery

The same Expo 57 / React Native screen and inference module build for web and Android. `npm run build:web` exports the web client; `npm run build:android` creates the Android JavaScript/Hermes bundle. An export is not an APK or device test. Follow the existing EAS preview/production workflow to build and sign a new Android application, and deploy web/Worker changes separately. Existing installed apps do not update merely because source files change.

Existing lessons retain English/Telugu support. The new navigation/consent labels include Telugu translations; new adaptive diagnostic prose currently falls back to English pending language review.
