"""Per-scene background video sourcing.

Primary: Pexels free stock API (set PEXELS_API_KEY). Fallback/demo: generated
gradient backgrounds so the pipeline runs with no keys.

Returns for each scene a local clip path plus attribution info.
"""
import hashlib
import subprocess
from pathlib import Path

import requests

from .config import CACHE_DIR, env, load_config

PEXELS_URL = "https://api.pexels.com/videos/search"

# Muted brand-ish gradient pairs for demo backgrounds
_GRADIENTS = [
    ("0x1a2a6c", "0xb21f1f"), ("0x0f2027", "0x2c5364"), ("0x232526", "0x414345"),
    ("0x42275a", "0x734b6d"), ("0x141e30", "0x243b55"), ("0x2c3e50", "0x4ca1af"),
]


def _cache_path(key: str, suffix: str) -> Path:
    return CACHE_DIR / (hashlib.sha1(key.encode()).hexdigest()[:16] + suffix)


def fetch_pexels_clip(query: str, min_seconds: float) -> dict | None:
    api_key = env("PEXELS_API_KEY")
    if not api_key:
        return None
    out = _cache_path("pexels:" + query, ".mp4")
    meta = {"path": out, "credit": None, "url": None}
    resp = requests.get(
        PEXELS_URL,
        headers={"Authorization": api_key},
        params={"query": query, "orientation": "portrait", "per_page": 5},
        timeout=30,
    )
    resp.raise_for_status()
    for video in resp.json().get("videos", []):
        if video.get("duration", 0) < min_seconds * 0.5:
            continue
        files = sorted(video.get("video_files", []), key=lambda f: f.get("height") or 0,
                       reverse=True)
        best = next((f for f in files if (f.get("height") or 0) >= 1080), files[0] if files else None)
        if not best:
            continue
        if not out.exists():
            with requests.get(best["link"], stream=True, timeout=120) as dl:
                dl.raise_for_status()
                with open(out, "wb") as fh:
                    for chunk in dl.iter_content(1 << 16):
                        fh.write(chunk)
        meta["credit"] = video.get("user", {}).get("name")
        meta["url"] = video.get("url")
        return meta
    return None


def demo_clip(index: int, seconds: float) -> dict:
    """Animated gradient background (offline)."""
    c1, c2 = _GRADIENTS[index % len(_GRADIENTS)]
    out = _cache_path(f"demo:{index}:{seconds}", ".mp4")
    if not out.exists():
        subprocess.run(
            ["ffmpeg", "-y", "-f", "lavfi",
             "-i", f"gradients=size=1080x1920:c0={c1}:c1={c2}:speed=0.02:duration={seconds}:rate=30",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out)],
            check=True, capture_output=True,
        )
    return {"path": out, "credit": None, "url": None}


def gather_scene_clips(scenes: list[dict], scene_durations: list[float],
                       demo: bool = False) -> list[dict]:
    provider = load_config()["visuals"]["provider"]
    clips = []
    for i, (scene, dur) in enumerate(zip(scenes, scene_durations)):
        clip = None
        if not demo and provider == "pexels":
            try:
                clip = fetch_pexels_clip(scene["broll_query"], dur)
            except Exception:
                clip = None
        clips.append(clip or demo_clip(i, dur))
    return clips
