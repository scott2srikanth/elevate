# Character welcome video

`welcome.mp4` uses the user-supplied `still_head_and_shoes_are_cut.mp4`. It retains the actual animated gestures and full 16:9 frame. The cleaner 0.8–6.4 second section is used, with a 0.4-second tail-to-head dissolve and the playback start shifted beyond the overlap so the loop boundary is continuous. Audio is removed. Output is 960×540 H.264, 24 fps.

Rebuild with `sh scripts/build-welcome-video.sh /path/to/original.mp4`. The original is not bundled. Foot cropping present in the original cannot be recovered through playback styling.

The video sits in an absolute splash background layer, behind fully transparent welcome content. Web and Android use cover sizing to fill the screen edge to edge, cropping the sides on portrait screens. A full-screen light veil maintains text readability. The video loops muted, pauses in the background, and unmounts on Continue. Reduced-motion users see the supplied still image. Load/autoplay failures retain the still-image fallback. The multilingual writing animation remains separate.
