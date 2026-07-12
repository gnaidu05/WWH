"""Video assembly with ffmpeg: scenes -> 9:16 vertical video with burned-in
captions, voiceover, and optional background music."""
import subprocess
import textwrap
from pathlib import Path

from .config import ASSETS_DIR, CACHE_DIR, load_config

_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def _font() -> str:
    for path in _FONT_CANDIDATES:
        if Path(path).exists():
            return path
    raise RuntimeError("No usable .ttf font found — install fonts-dejavu-core")


def _run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {' '.join(cmd)}\n{proc.stderr[-2000:]}")


def scene_durations(script: dict, total_seconds: float) -> list[float]:
    """Split the audio duration across scenes proportionally to word count.
    The hook narrates over the first scene and the CTA over the last."""
    weights = [len(s["text"].split()) for s in script["scenes"]]
    weights[0] += len(script["hook"].split())
    weights[-1] += len(script["cta"].split())
    total_words = sum(weights)
    return [total_seconds * w / total_words for w in weights]


def _render_scene(clip: Path, overlay: str, duration: float, index: int,
                  cfg: dict) -> Path:
    width, height, fps = cfg["video"]["width"], cfg["video"]["height"], cfg["video"]["fps"]
    out = CACHE_DIR / f"scene_{index:02d}.mp4"
    vf = (f"scale={width}:{height}:force_original_aspect_ratio=increase,"
          f"crop={width}:{height},fps={fps},setsar=1")
    if overlay.strip():
        text_file = CACHE_DIR / f"overlay_{index:02d}.txt"
        text_file.write_text("\n".join(textwrap.wrap(overlay.strip(), 16)), encoding="utf-8")
        vf += (f",drawtext=fontfile={_font()}:textfile={text_file}:"
               "fontsize=88:fontcolor=white:borderw=6:bordercolor=black:"
               "line_spacing=14:text_align=C:x=(w-text_w)/2:y=h*0.72")
    _run(["ffmpeg", "-y", "-stream_loop", "-1", "-i", str(clip), "-t", f"{duration:.3f}",
          "-vf", vf, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
          "-pix_fmt", "yuv420p", str(out)])
    return out


def assemble(script: dict, clips: list[dict], voiceover: Path,
             audio_seconds: float, out_path: Path) -> Path:
    cfg = load_config()
    durations = scene_durations(script, audio_seconds)
    scene_files = [
        _render_scene(Path(clip["path"]), scene.get("overlay", ""), dur, i, cfg)
        for i, (scene, clip, dur) in enumerate(zip(script["scenes"], clips, durations))
    ]

    concat_list = CACHE_DIR / "concat.txt"
    concat_list.write_text(
        "".join(f"file '{f.resolve()}'\n" for f in scene_files), encoding="utf-8")
    silent = CACHE_DIR / "video_noaudio.mp4"
    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
          "-c", "copy", str(silent)])

    music_cfg = cfg.get("music", {})
    music_files = sorted((ASSETS_DIR / "music").glob("*.mp3")) if music_cfg.get("enabled") else []
    if music_files:
        vol = music_cfg.get("volume", 0.12)
        _run(["ffmpeg", "-y", "-i", str(silent), "-i", str(voiceover),
              "-stream_loop", "-1", "-i", str(music_files[0]),
              "-filter_complex",
              f"[2:a]volume={vol}[m];[1:a][m]amix=inputs=2:duration=first[a]",
              "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac",
              "-shortest", str(out_path)])
    else:
        _run(["ffmpeg", "-y", "-i", str(silent), "-i", str(voiceover),
              "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac",
              "-shortest", str(out_path)])
    return out_path
