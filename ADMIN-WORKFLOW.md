# Administrator publishing and automatic content sync

Version 1.3.0 adds a web-only administrator workspace at `/admin` (also linked from Profile). Native builds contain an empty administrator entry component; learners receive only the published configuration.

## Production setup

1. Authenticate the operator: `npx wrangler login` (or provide a Cloudflare API token through the deployment environment).
2. Apply all migrations: `npm run db:migrate:remote`. Migration `0003_content.sql` creates administrator membership and immutable content releases.
3. The chosen administrator must have an existing Elevate cloud account. Assign it explicitly:

   ```sh
   node scripts/admin-role.mjs grant 'actual-admin-email@example.com' --remote
   ```

   Verify the output contains `assigned: 1`; zero means the account does not exist. Never grant based only on a client-provided role. To revoke, use `revoke` instead of `grant`.
4. Deploy the Worker/web build using the existing Cloudflare pipeline.
5. Build and install Android 1.3.0 once using the existing EAS production/preview profiles. This release adds the content loader and native MP4 player. Older APKs cannot acquire those code capabilities from JSON.

## User accounts

Public registration is disabled, including the API. Existing accounts still sign in normally. In the web administrator workspace, use **Create a user account**, enter the learner’s email and a password of 12–128 characters, and save the one-time recovery code. Share credentials and the recovery code privately. Creating a learner does not grant administrator access or sign the administrator out. No database migration is needed for this change.

The supplied coaching-companions image is used for the logo, launcher artwork, and animated/native splash. A new Android build is required to update installed launcher and native splash assets.

## Daily workflow

- Sign in on the web as the assigned administrator.
- Select **Lessons and videos**. Enter a session/topic, source language and YouTube or HTTPS MP4 links. Alternatively upload an MP4 (32 MB maximum); its public media path is appended to the link list.
- Click **Create a JSON template**. Copy it to ChatGPT. The template includes existing managed content, lesson identifiers and the response schema. Ask ChatGPT to return only the completed document and preserve existing items.
- Upload the returned `.json` file, or paste its contents and choose **Validate and preview**. Review titles, lesson assignments, video language, links and the complete document.
- The dashboard summarizes live content and links to accounts, templates, and publishing. The staged preview lists additions, edits, and removals; use its Lessons, Videos, and Languages tabs to inspect lesson cards, play a video, and compare translations before publishing.
- Select **I reviewed the preview and any removals**, then click **Apply to all devices** to publish. Editing or reimporting JSON clears that confirmation. Publication replaces the managed snapshot; retain items you want to keep. It adds/overrides bundled lessons and videos by ID; bundled lessons remain available. Videos marked `interview` are excluded from learners.
- Save a copy with **Download published JSON** before editing. To restore older content, import that saved document and publish it as a new revision. Server-side history remains in `content_releases`.

JSON contains data only, never executable code, HTML, scripts or credentials. Link validation allows supported YouTube forms, HTTPS `.mp4` paths (query parameters allowed), or an uploaded `/api/content/media/<uuid>` path. Links are not fetched by the server. Administrators must review accuracy, source language, availability and rights to uploaded material. Uploaded MP4 files are public lesson content, separate from private wardrobe media; never upload personal user recordings here. Uploaded files persist in R2, including files not yet referenced by a release; operators can remove unneeded `lessons/` objects after verifying they are unused.

## Languages

Select **Language pack**, supply a code such as `hi` and a display name such as `हिन्दी`, then generate the template. It includes the existing UI translation keys and lesson/video content. Ask ChatGPT to translate every string value into the requested language, keeping keys and `{placeholders}` unchanged. Import, preview and publish the resulting complete document.

Language choices update from published packs. User names, notes, imported coaching analyses and original publisher attribution remain unchanged. Missing translations fall back to English; existing Telugu translations remain a bundled fallback. Partial packs are accepted with this explicit fallback, so review language coverage before publication. Regenerate a language template after adding new lessons to include their text. ChatGPT coaching exports use the selected language name. Domain identifiers and JSON schema keys never change with locale.

## Sync behavior and compatibility

Clients fetch `/api/content` on startup, on foreground resume, and every 60 seconds while open. A revision is applied only after schema validation. They cache the last valid snapshot for offline use; older, malformed or unsupported schema versions do not replace it. When connectivity returns, the next resume/poll fetches the published configuration. Closing Android does not run a continuous background service: it catches up next time it opens. Videos themselves require internet and are not downloaded into the content cache.

Custom lessons appear in the Practice list, follow the existing Learn → Rehearse → Real life flow, and support cloud history sync. Supported focus areas remain the existing coaching areas; this JSON workflow cannot add executable screens or entirely new behavior. Within an individual lesson, videos are matched by `lessonIds` and topic filters are hidden. The Practice landing page has no separate video browser; relevant videos remain inside each lesson. Player dimensions are constrained to their card, and proceeding to rehearsal unmounts the player.

## Security and validation

Publishing and media upload require an authenticated session and server-side D1 administrator membership. Ordinary accounts and anonymous clients cannot publish. Publishing uses the loaded revision in an atomic compare-and-insert, rejecting stale edits with HTTP 409. Invalid URLs, malformed schemas, duplicate IDs, changed placeholders, oversized bodies and references to unknown lessons are rejected. Public content excludes user account data and publisher identity fields from release metadata. MP4 reads support byte ranges for seeking.

## Verification

- Unit tests cover URL/schema validation, language interpolation, custom lesson state compatibility and the existing coaching logic.
- Browser tests cover non-admin denial, template generation, JSON file import, publication, stale edits, unsafe links, unknown lessons, automatic sync to a second open client, offline cache reuse, custom lesson videos and MP4 byte ranges.
- Practice tests verify no topic list in the session, player bounds and cleanup on rehearsal.
- Android bundle compilation does not establish live playback on an installed APK. Test a newly installed 1.3.0 APK against the deployed content API before release.
