# WWH — Faceless YouTube Video Pipeline (Claude Code)

Produce a full faceless YouTube video from one brief: **script → voiceover →
visuals → editing/sound → thumbnails**, driven by Claude Code with generation
tools (Higgsfield, ElevenLabs/Higgs voice, Kling/Veo/Sora) and assembled by
FFmpeg.

This repo is the **editor + orchestration layer** that ties those tools
together. The generation happens through MCP connectors; the deterministic
"put it all into a finished MP4" step is `pipeline/assemble.py`.

> Reality check: the tooling here is real and works. The income figures in the
> tutorial that inspired this (e.g. "$10k/month") are marketing — treat them as
> motivation, not a promise. What this repo genuinely gives you is a repeatable
> way to turn a brief into a finished video with one command.

## What's here

```
master-prompt.md                 The reusable prompt you paste into Claude Code
pipeline/
  assemble.py                    Scene manifest  ->  finished MP4 (the "editor")
  make_synthetic_assets.sh       Placeholder assets to test the editor offline
scenes/
  example.manifest.json          The manifest format, documented by example
assets/
  images/ clips/ audio/ music/   Generated media (git-ignored)
  thumbnails/
output/                          Rendered videos (git-ignored)
```

## The manifest format

A video is a JSON list of scenes. Each scene is one visual + its narration:

```json
{
  "title": "...",
  "resolution": [1920, 1080],        // [1080,1920] for Shorts
  "fps": 30,
  "music": "assets/music/bed.mp3",   // optional; ducked under narration
  "music_db": -22,
  "output": "output/my-video.mp4",
  "scenes": [
    {
      "image": "assets/images/s1.png",  // OR  "clip": "assets/clips/s1.mp4"
      "audio": "assets/audio/s1.mp3",   // narration; sets the scene's length
      "text":  "On-screen caption",     // optional; burned in + auto-wrapped
      "motion": "zoom_in"               // zoom_in|zoom_out|pan_left|pan_right|none
    }
  ]
}
```

What the assembler does per scene:
- **stills** get a Ken Burns move (slow zoom/pan) so nothing sits static;
- **clips** are scaled/cropped to the frame and cut to the narration length;
- the **caption** is word-wrapped and burned into a centered lower-third box;
- scenes are joined with a short **crossfade**;
- the **music bed** is looped, lowered, and **ducked** under the narration
  (sidechain compression) so the voice always sits on top.

Missing assets don't crash the render — a scene with no image/clip falls back to
a solid card, so you can lay out the whole video before every asset exists.

## Quick start (offline, no API credits)

Prove the editor end-to-end with placeholder assets:

```bash
bash pipeline/make_synthetic_assets.sh          # writes assets/*
python3 pipeline/assemble.py scenes/example.manifest.json
# -> output/example.mp4  (1920x1080, h264+aac, crossfades, captions, ducked music)
```

Only requirement: `ffmpeg` / `ffprobe` on PATH. No Python packages.

Install FFmpeg:
- **Linux (Debian/Ubuntu):** `sudo apt-get install -y ffmpeg`
- **macOS:** `brew install ffmpeg`
- **Windows:** `winget install Gyan.FFmpeg`

## Full run (with generation)

1. Open Claude Code with the Higgsfield + voice connectors enabled.
2. Paste `master-prompt.md`, fill in the brief (topic, reference video, voice
   id, aspect ratio).
3. Claude writes the script, generates narration into `assets/audio/`, generates
   visuals into `assets/images/` and `assets/clips/`, writes a
   `scenes/<slug>.manifest.json`, then runs `assemble.py`.
4. Review the output frame/pacing, iterate, and generate 3 thumbnails.

## Notes

- Keep captions short — they're burned in and wrap automatically, but 2 lines
  reads best.
- For Shorts, set `"resolution": [1080, 1920]`; captions and Ken Burns adapt.
- Regenerating one scene = replace its file in `assets/` and re-run `assemble.py`.
  The step is cheap and deterministic; only generation costs credits.
