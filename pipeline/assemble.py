#!/usr/bin/env python3
"""
assemble.py — turn a scene manifest into a finished faceless-YouTube video.

This is the FFmpeg "editor" that the rest of the pipeline (script -> voiceover ->
image/clip generation) feeds into. It takes a JSON manifest describing an ordered
list of scenes and renders a single MP4:

  - stills get a Ken Burns move (slow zoom / pan) so nothing sits static
  - video clips are scaled/padded to the target frame and cut to length
  - per-scene narration audio drives each scene's duration
  - an optional caption is burned in per scene
  - an optional music bed is mixed under the whole thing and ducked
    beneath the narration (sidechain compression)
  - scenes are joined with a short crossfade for polish

The manifest format is documented in ../scenes/example.manifest.json.

Usage:
    python3 assemble.py <manifest.json> [-o output.mp4]

Only depends on ffmpeg/ffprobe being on PATH. No Python packages required.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
DEFAULT_SCENE_DURATION = 4.0
CROSSFADE = 0.4  # seconds of crossfade between scenes


def run(cmd, **kw):
    """Run a command, streaming stderr on failure."""
    proc = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if proc.returncode != 0:
        sys.stderr.write("COMMAND FAILED: %s\n" % " ".join(cmd))
        sys.stderr.write(proc.stderr[-4000:])
        raise SystemExit(1)
    return proc


def probe_duration(path):
    """Return media duration in seconds, or None if unknown."""
    proc = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    try:
        return float(proc.stdout.strip())
    except ValueError:
        return None


def ken_burns_filter(motion, w, h, fps, dur):
    """Build a zoompan expression for a still image given a motion style."""
    frames = max(1, int(round(dur * fps)))
    # Upscale first so zoompan has pixels to work with, then zoom/pan.
    base = f"scale={w*2}:{h*2}:force_original_aspect_ratio=increase,crop={w*2}:{h*2}"
    if motion == "zoom_out":
        z = "zoom='if(eq(on,1),1.18,max(1.001,zoom-0.00035))'"
        xy = "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
    elif motion == "pan_left":
        z = "zoom=1.15"
        xy = "x='(iw-iw/zoom)*(1-on/%d)':y='ih/2-(ih/zoom/2)'" % frames
    elif motion == "pan_right":
        z = "zoom=1.15"
        xy = "x='(iw-iw/zoom)*(on/%d)':y='ih/2-(ih/zoom/2)'" % frames
    elif motion == "none":
        return f"{base},scale={w}:{h},setsar=1"
    else:  # zoom_in (default)
        z = "zoom='min(zoom+0.00035,1.18)'"
        xy = "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
    return (f"{base},zoompan={z}:{xy}:d={frames}:s={w}x{h}:fps={fps},"
            f"setsar=1")


def esc_drawtext_path(p):
    return p.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")


def wrap_caption(text, max_chars):
    """Greedy word-wrap so long captions don't run off the frame."""
    words, lines, cur = text.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > max_chars:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(cur)
    return "\n".join(lines)


def build_scene(scene, idx, cfg, tmpdir):
    """Render one scene to an intermediate mp4 (h264 + aac). Returns its path."""
    w, h, fps = cfg["w"], cfg["h"], cfg["fps"]
    out = os.path.join(tmpdir, f"scene_{idx:03d}.mp4")

    audio = scene.get("audio")
    dur = scene.get("duration")
    if dur is None and audio and os.path.exists(audio):
        dur = probe_duration(audio)
    if dur is None:
        dur = DEFAULT_SCENE_DURATION
    dur = float(dur) + CROSSFADE  # pad so crossfade doesn't eat content

    inputs = []
    vf_parts = []

    image = scene.get("image")
    clip = scene.get("clip")
    if image:
        inputs += ["-loop", "1", "-t", f"{dur:.3f}", "-i", image]
        vf_parts.append(ken_burns_filter(scene.get("motion", "zoom_in"),
                                          w, h, fps, dur))
    elif clip:
        inputs += ["-stream_loop", "-1", "-t", f"{dur:.3f}", "-i", clip]
        vf_parts.append(
            f"scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h},fps={fps},setsar=1"
        )
    else:
        # Solid color fallback so a missing asset never breaks the render.
        inputs += ["-f", "lavfi", "-t", f"{dur:.3f}",
                   "-i", f"color=c=0x101418:s={w}x{h}:r={fps}"]
        vf_parts.append("setsar=1")

    # Optional burned-in caption.
    text = scene.get("text")
    textfile = None
    if text:
        textfile = os.path.join(tmpdir, f"cap_{idx:03d}.txt")
        fontsize = int(h * 0.055)
        # Conservative wrap width: DejaVu Bold averages ~0.62*fontsize per glyph;
        # keep captions inside ~72% of frame width so nothing clips at any zoom.
        max_chars = max(10, int((w * 0.72) / (fontsize * 0.62)))
        with open(textfile, "w") as f:
            f.write(wrap_caption(text, max_chars))
        vf_parts.append(
            f"drawtext=fontfile={FONT}:textfile={esc_drawtext_path(textfile)}:"
            f"fontcolor=white:fontsize={fontsize}:line_spacing=8:"
            f"box=1:boxcolor=black@0.55:boxborderw={int(fontsize*0.4)}:"
            f"x=(w-text_w)/2:y=h-text_h-{int(h*0.08)}"
        )

    vf = ",".join(vf_parts)

    cmd = ["ffmpeg", "-y", *inputs]
    if audio and os.path.exists(audio):
        cmd += ["-i", audio]
    else:
        cmd += ["-f", "lavfi", "-t", f"{dur:.3f}", "-i",
                "anullsrc=channel_layout=stereo:sample_rate=48000"]

    cmd += [
        "-filter_complex",
        f"[0:v]{vf}[v]",
        "-map", "[v]", "-map", f"{1}:a",
        "-t", f"{dur:.3f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", str(fps),
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        out,
    ]
    run(cmd)
    return out, dur


def concat_with_crossfade(scene_files, cfg, tmpdir):
    """Concatenate rendered scenes with a short xfade/acrossfade between each."""
    if len(scene_files) == 1:
        return scene_files[0][0]

    # Chain xfade pairwise. Track running offset.
    inputs = []
    for path, _ in scene_files:
        inputs += ["-i", path]

    filters = []
    prev_v = "0:v"
    prev_a = "0:a"
    offset = scene_files[0][1] - CROSSFADE
    for i in range(1, len(scene_files)):
        vout = f"v{i}"
        aout = f"a{i}"
        filters.append(
            f"[{prev_v}][{i}:v]xfade=transition=fade:duration={CROSSFADE}:"
            f"offset={offset:.3f}[{vout}]"
        )
        filters.append(
            f"[{prev_a}][{i}:a]acrossfade=d={CROSSFADE}[{aout}]"
        )
        prev_v, prev_a = vout, aout
        offset += scene_files[i][1] - CROSSFADE

    out = os.path.join(tmpdir, "joined.mp4")
    run(["ffmpeg", "-y", *inputs,
         "-filter_complex", ";".join(filters),
         "-map", f"[{prev_v}]", "-map", f"[{prev_a}]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-r", str(cfg["fps"]),
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         out])
    return out


def mix_music(video_path, music_path, music_db, tmpdir):
    """Mix a looped music bed under the narration, ducked via sidechain."""
    out = os.path.join(tmpdir, "final_music.mp4")
    # Narration is [0:a]; music is [1:a]. Duck music under narration.
    filt = (
        f"[1:a]volume={music_db}dB,aloop=loop=-1:size=2e9[bed];"
        f"[bed][0:a]sidechaincompress=threshold=0.03:ratio=8:attack=20:"
        f"release=400[ducked];"
        f"[0:a][ducked]amix=inputs=2:duration=first:dropout_transition=0[a]"
    )
    run(["ffmpeg", "-y", "-i", video_path, "-i", music_path,
         "-filter_complex", filt,
         "-map", "0:v", "-map", "[a]",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-shortest", out])
    return out


def main():
    ap = argparse.ArgumentParser(description="Assemble a video from a scene manifest.")
    ap.add_argument("manifest")
    ap.add_argument("-o", "--output", default=None)
    args = ap.parse_args()

    with open(args.manifest) as f:
        man = json.load(f)

    # Asset paths in the manifest are resolved against the current working
    # directory, so run this from the repo root (where assets/ lives).

    res = man.get("resolution", [1920, 1080])
    cfg = {"w": int(res[0]), "h": int(res[1]), "fps": int(man.get("fps", 30))}

    scenes = man["scenes"]
    if not scenes:
        raise SystemExit("manifest has no scenes")

    output = args.output or man.get("output", "output.mp4")
    output = os.path.abspath(output)

    print(f"[assemble] {len(scenes)} scenes @ {cfg['w']}x{cfg['h']} {cfg['fps']}fps")

    with tempfile.TemporaryDirectory() as tmp:
        rendered = []
        for i, sc in enumerate(scenes):
            print(f"[assemble] rendering scene {i+1}/{len(scenes)} ...")
            rendered.append(build_scene(sc, i, cfg, tmp))

        joined = concat_with_crossfade(rendered, cfg, tmp)

        music = man.get("music")
        if music and os.path.exists(music):
            print(f"[assemble] mixing music bed {music} @ {man.get('music_db',-20)}dB")
            final = mix_music(joined, music, man.get("music_db", -20), tmp)
        else:
            final = joined

        os.makedirs(os.path.dirname(output), exist_ok=True)
        run(["ffmpeg", "-y", "-i", final, "-c", "copy", output])

    dur = probe_duration(output)
    print(f"[assemble] DONE -> {output} ({dur:.1f}s)" if dur else
          f"[assemble] DONE -> {output}")


if __name__ == "__main__":
    main()
