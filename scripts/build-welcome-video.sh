#!/bin/sh
# Build a silent seamless loop from the user-supplied character animation.
set -eu
SOURCE=${1:?Pass the path to the original character video}
ffmpeg -hide_banner -loglevel error -y -i "$SOURCE" \
  -filter_complex "[0:v]trim=start=0.8:end=6.4,setpts=PTS-STARTPTS,fps=24,scale=960:540,split=2[main][head];[main]trim=start=0.4,setpts=PTS-STARTPTS[a];[head]trim=end=0.4,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=0.4:offset=4.8,format=yuv420p[out]" \
  -map '[out]' -an -c:v libx264 -crf 21 -preset medium -movflags +faststart assets/video/welcome.mp4
