# Silent welcome video

`welcome.mp4` is a six-second, 720×720 H.264 motion graphic rendered from the supplied coaching-companions artwork. It uses gentle whole-image movement, welcome text, and a downward Continue cue. It does not contain generated character gestures or lip movement. There is no audio stream.

Rebuild from the repository root with `sh scripts/build-welcome-video.sh`. On another OS, set `FONT_FILE` to an available TrueType font. FFmpeg must include drawtext.

The video is bundled for offline native playback and served as a local static asset on the web. It loops muted, pauses in the background, and unmounts on Continue. Reduced-motion users see the original still image; load/autoplay failure also retains the image. The multilingual word animation remains separate.
