# Coaching video library

Open **Coach → Videos**. Six official publisher videos are grouped into Speaking, Listening and Confidence. Elevate provides original English/Telugu guidance and a real-world practice prompt for each lesson; the source audio is English. Captions vary by publisher. Watching does not create practice completions or alter coaching scores.

Sources reviewed September 27, 2026:

- [Julian Treasure — How to speak so that people want to listen (TED)](https://www.youtube.com/watch?v=eIho2S0ZahI)
- [Celeste Headlee — 10 ways to have a better conversation (TED)](https://www.youtube.com/watch?v=R1vskiVDwl4)
- [Julian Treasure — 5 ways to listen better (TED)](https://www.youtube.com/watch?v=cSohjlYQI2A)
- [Adam Galinsky — How to speak up for yourself (TED)](https://www.youtube.com/watch?v=MEDgtjpycYg)
- [Matt Abrahams — Think Fast, Talk Smart (Stanford GSB)](https://www.youtube.com/watch?v=HAnw168huqA)
- [Matt Abrahams — Think Faster, Talk Smarter (Stanford Alumni)](https://www.youtube.com/watch?v=x6TsR3y5Qfg)

Selection favors identifiable expert speakers, official uploads, relevance to existing coaching exercises, and advice that can be rehearsed. These are curated recommendations, not an objective ranking or an endorsement by the publishers. No videos are downloaded or rehosted.

## Playback and deployment

Web uses YouTube's privacy-enhanced iframe; Android/iOS use the SDK-compatible react-native-webview module. Only one player mounts at a time. Changing tabs, filters, closing a video, or leaving Coach unmounts it. Native backgrounding also unmounts the player (resuming starts from the beginning). No autoplay. An official YouTube link remains available when offline, embedding is disallowed, or the publisher removes a video. Both playback and thumbnails require internet access and contact YouTube services.

Cloudflare static headers allow only the specific YouTube embed and thumbnail hosts and provide the origin referrer required by YouTube. Native requests identify the installed package as described in [YouTube's embedded-player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality). API response security headers remain unchanged. No API key, D1 migration or AI service is needed.

Deploy the web build through the existing Cloudflare pipeline. **Build and install a new Android APK/AAB** with the existing EAS profiles because WebView adds native code. Exporting the Android JavaScript bundle does not update the installed emulator app.

## Verification

`tests/videos.spec.ts` covers filters, no autoplay iframe on entry, single player selection, unmount on tab change, practice navigation and Telugu guidance on mobile/desktop. It mocks the third-party embed, so it does not establish that the publisher's stream plays. Live playback and fullscreen must also be checked on a freshly built native app. Publisher availability, regional restrictions and caption support can change.
