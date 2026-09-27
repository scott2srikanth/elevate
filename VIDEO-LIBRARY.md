> Updated in 1.3.0: the three interview videos have been removed. Twelve direct-instruction videos remain bundled. Administrators can publish additional lessons, videos and languages; see [ADMIN-WORKFLOW.md](ADMIN-WORKFLOW.md). Topic filters are hidden inside individual practice sessions. The earlier source list below records previous curation.

# Coaching video library

Open **Coach → Videos** or **Practice → Browse practice videos**. Each exercise’s Learn step also offers **Videos for this practice** with topic-matched lessons. Fifteen videos cover speaking, listening, confidence, dressing, dining, public appearances, functions and holidays. Elevate provides original English/Telugu guidance and a real-world practice prompt for each lesson; twelve videos have English audio and three have Telugu audio (including English terms). Telugu UI sorts Telugu audio first; the audio filter is independent of the UI language. Captions vary by publisher. Watching does not create practice completions or alter coaching scores.

Sources reviewed September 27, 2026:

- [Julian Treasure — How to speak so that people want to listen (TED)](https://www.youtube.com/watch?v=eIho2S0ZahI)
- [Celeste Headlee — 10 ways to have a better conversation (TED)](https://www.youtube.com/watch?v=R1vskiVDwl4)
- [Julian Treasure — 5 ways to listen better (TED)](https://www.youtube.com/watch?v=cSohjlYQI2A)
- [Adam Galinsky — How to speak up for yourself (TED)](https://www.youtube.com/watch?v=MEDgtjpycYg)
- [Matt Abrahams — Think Fast, Talk Smart (Stanford GSB)](https://www.youtube.com/watch?v=HAnw168huqA)
- [Matt Abrahams — Think Faster, Talk Smarter (Stanford Alumni)](https://www.youtube.com/watch?v=x6TsR3y5Qfg)

Selection favors identifiable expert speakers, official uploads, relevance to existing coaching exercises, and advice that can be rehearsed. These are curated recommendations, not an objective ranking or an endorsement by the publishers. No videos are downloaded or rehosted.

## Playback and deployment

Web uses YouTube's privacy-enhanced iframe; Android/iOS use the SDK-compatible react-native-webview module. Only one player mounts at a time. Changing tabs, filters, closing a video, leaving Coach/Practice, or moving from Learn to Rehearse unmounts it. The practice-page library unmounts when a modal opens, preventing background playback behind a session. Native backgrounding also unmounts the player (resuming starts from the beginning). No autoplay. An official YouTube link remains available when offline, embedding is disallowed, or the publisher removes a video. Both playback and thumbnails require internet access and contact YouTube services.

Cloudflare static headers allow only the specific YouTube embed and thumbnail hosts and provide the origin referrer required by YouTube. Native requests identify the installed package as described in [YouTube's embedded-player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality). API response security headers remain unchanged. No API key, D1 migration or AI service is needed.

Deploy the web build through the existing Cloudflare pipeline. **Build and install a new Android APK/AAB** with the existing EAS profiles because WebView adds native code. Exporting the Android JavaScript bundle does not update the installed emulator app.

## Verification

`tests/videos.spec.ts` covers filters, no autoplay iframe on entry, single player selection, unmount on tab change, practice navigation and Telugu guidance on mobile/desktop. It mocks the third-party embed, so it does not establish that the publisher's stream plays. Live playback and fullscreen must also be checked on a freshly built native app. Publisher availability, regional restrictions and caption support can change.

## Expanded sources and practice selection

Added September 27, 2026 (publisher links):

- [Dining/table manners — Jamila Musayeva](https://www.youtube.com/watch?v=zA2PfKRcm0g)
- [Versatile outfits for work and outings — Jamila Musayeva](https://www.youtube.com/watch?v=HDm9Q_UGZBA)
- [Cocktail dress code — Jamila Musayeva](https://www.youtube.com/watch?v=43kVI33M0gc), with [publisher context](https://jamilamusayeva.com/blog/understanding-cocktail-dress-code)
- [Sitting and standing demonstrations — Jamila Musayeva](https://www.youtube.com/watch?v=seu1p01ibDU)
- [Summer travel capsule — Audrey Coyne](https://www.youtube.com/watch?v=1A484E_VfSU)
- [Everyday public manners — Jamila Musayeva](https://www.youtube.com/watch?v=cD5en_mMIIE)
- [Chaitanya CH style interview — iDream Media, Telugu](https://www.youtube.com/watch?v=QB0GEt_K_ZQ)
- [Chaitanya CH date/social meeting tips — iDream Media, Telugu](https://www.youtube.com/watch?v=-iv-sAVxK8Y)
- [Ch. Chaitanya image and etiquette interview — Harish Katkam, Telugu](https://www.youtube.com/watch?v=gBDlk4oiMOg), verified against the [publisher episode listing](https://www.harishkatkam.com/). The card includes publisher chapter cues for dressing, wedding styling and dining; these are timestamps to seek to in the player, not separate videos.

Exercise mappings live in `src/coachingVideos.ts`. Wardrobe/grooming include dressing and travel; dining includes the table demonstration and Telugu interview; posture includes public presence; networking includes social functions. Each topic can contain multiple audio languages. A Telugu-only holiday filter currently has no result and explicitly offers resetting filters; English videos are not mislabeled as Telugu. Guidance encourages adapting demonstrations to culture, mobility, budget and comfort. Videos reflect individual presenters’ perspectives.

Expanded browser tests cover every new topic, Telugu-only filtering, empty states, Telugu-first ordering, relevant dining session playback, and player removal when proceeding to rehearsal. Third-party playback remains mocked in automated tests.
