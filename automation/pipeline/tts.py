"""Voiceover synthesis via edge-tts (free Microsoft neural voices).

In --demo mode the pipeline stays runnable offline: it uses espeak-ng if
installed (robotic but real speech, good for timing/caption checks) and a
silent track otherwise. Real channel runs require edge-tts to succeed.
"""
import asyncio
import shutil
import subprocess
from pathlib import Path

from .config import load_config


def synthesize(text: str, out_path: Path, demo: bool = False) -> Path:
    if demo:
        if shutil.which("espeak-ng"):
            return _espeak_track(text, out_path)
        return _silent_track(text, out_path)
    cfg = load_config()["tts"]
    import edge_tts  # imported lazily so demo mode needs no install

    async def _run():
        communicate = edge_tts.Communicate(text, cfg["voice"], rate=cfg.get("rate", "+0%"))
        await communicate.save(str(out_path))

    asyncio.run(_run())
    if not out_path.exists() or out_path.stat().st_size < 1000:
        raise RuntimeError("edge-tts produced no audio")
    return out_path


def _espeak_track(text: str, out_path: Path) -> Path:
    """Offline speech via espeak-ng (demo mode only)."""
    wav = out_path.with_suffix(".wav")
    subprocess.run(
        ["espeak-ng", "-v", "en-us+m3", "-s", "160", "-p", "40", "-w", str(wav), text],
        check=True, capture_output=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav), "-q:a", "4", str(out_path)],
        check=True, capture_output=True,
    )
    wav.unlink(missing_ok=True)
    return out_path


def _silent_track(text: str, out_path: Path) -> Path:
    """Silence sized to the narration length at ~165 wpm (demo mode only)."""
    seconds = max(10, round(len(text.split()) / 165 * 60, 1))
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
         "-t", str(seconds), "-q:a", "9", str(out_path)],
        check=True, capture_output=True,
    )
    return out_path


def duration_seconds(audio_path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
        check=True, capture_output=True, text=True,
    )
    return float(out.stdout.strip())
