#!/bin/sh
# Silent motion-graphic welcome made from the supplied coaching artwork.
# Requires ffmpeg with drawtext. Override FONT_FILE on other operating systems.
set -eu
FONT_FILE=${FONT_FILE:-/System/Library/Fonts/Supplemental/Arial.ttf}
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i 'color=c=0xF7F3EC:s=720x720:r=24:d=6' \
  -loop 1 -framerate 24 -i assets/brand-splash.png \
  -filter_complex "[1:v]scale=620:620,format=rgba[art];[0:v][art]overlay=x='50+3*sin(2*PI*t/6)':y='48-6*sin(2*PI*t/6)':shortest=1,drawtext=fontfile='$FONT_FILE':text='Welcome!':fontcolor=0x425441:fontsize=40:x=(w-tw)/2:y=12,drawtext=fontfile='$FONT_FILE':text='Tap Continue below':fontcolor=0x425441:fontsize=30:x=(w-tw)/2:y=655,drawtext=fontfile='$FONT_FILE':text='↓':fontcolor=0x9A5438:fontsize=36:x=(w-tw)/2:y='680+5*sin(2*PI*t/1.5)'[out]" \
  -map '[out]' -t 6 -an -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -movflags +faststart assets/video/welcome.mp4
