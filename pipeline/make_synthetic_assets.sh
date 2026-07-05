#!/usr/bin/env bash
# Generate placeholder assets so the FFmpeg engine can be tested end-to-end
# WITHOUT calling any paid generation API. Real runs replace these files with
# Higgsfield images/clips and ElevenLabs/Higgs voiceover of the same names.
set -euo pipefail
cd "$(dirname "$0")/.."
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

mkdir -p assets/images assets/clips assets/audio assets/music

# --- Still images (1920x1080) with a gradient + label ---
make_img () { # $1=file $2=color $3=label
  ffmpeg -y -f lavfi -i "gradients=s=1920x1080:c0=$2:c1=black:x0=0:y0=0:x1=1920:y1=1080" \
    -frames:v 1 -vf "drawtext=fontfile=$FONT:text='$3':fontcolor=white@0.85:\
fontsize=70:x=(w-text_w)/2:y=(h-text_h)/2" "$1" -loglevel error
}
make_img assets/images/s1.png 0x1b3a2f "DAWN"
make_img assets/images/s3.png 0x3a1b1b "TERRITORY"

# --- A moving placeholder clip (5s) for the video-clip scene ---
ffmpeg -y -f lavfi -i "testsrc2=s=1920x1080:r=30:d=5" \
  -vf "hue=h=120:s=0.6,drawtext=fontfile=$FONT:text='B-ROLL CLIP':fontcolor=white:\
fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -pix_fmt yuv420p assets/clips/s2.mp4 -loglevel error

# --- Placeholder narration: spoken-length silence + a soft marker tone ---
# (Real runs drop in ElevenLabs/Higgs MP3s here; the engine only needs duration.)
make_vo () { # $1=file $2=seconds
  ffmpeg -y -f lavfi -i "anullsrc=r=48000:cl=stereo" \
    -f lavfi -i "sine=frequency=330:duration=0.15" \
    -filter_complex "[1:a]adelay=200|200,volume=0.15[t];[0:a][t]amix=duration=first" \
    -t "$2" -c:a libmp3lame "$1" -loglevel error
}
make_vo assets/audio/s1.mp3 4.0
make_vo assets/audio/s2.mp3 5.0
make_vo assets/audio/s3.mp3 3.5

# --- Music bed (30s ambient-ish pad) ---
ffmpeg -y -f lavfi -i "sine=frequency=196:duration=30" \
  -f lavfi -i "sine=frequency=294:duration=30" \
  -filter_complex "[0:a][1:a]amix=inputs=2,tremolo=f=0.2:d=0.4,volume=0.5" \
  -c:a libmp3lame assets/music/bed.mp3 -loglevel error

echo "Synthetic assets written to assets/"
