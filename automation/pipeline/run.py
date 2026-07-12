"""Pipeline orchestrator.

Examples (run from the automation/ directory):
  python -m pipeline.run --demo --no-upload      # offline end-to-end test
  python -m pipeline.run --no-upload             # real assets, no upload
  python -m pipeline.run                         # full run incl. upload
  python -m pipeline.run --topic "Top 3 AI note-taking tools"
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone

from . import assemble, metadata, script_gen, topics, tts, visuals
from .config import OUTPUT_DIR, ensure_dirs


def slugify(text: str, max_len: int = 48) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:max_len].rstrip("-") or "video"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create (and post) one faceless video")
    parser.add_argument("--topic", help="explicit topic; otherwise trending/evergreen")
    parser.add_argument("--no-trending", action="store_true",
                        help="skip RSS feeds, use the evergreen queue")
    parser.add_argument("--demo", action="store_true",
                        help="offline mode: silent voiceover + gradient visuals")
    parser.add_argument("--no-upload", action="store_true", help="render only")
    args = parser.parse_args(argv)

    ensure_dirs()

    topic = topics.pick_topic(args.topic, prefer_trending=not args.no_trending)
    print(f"[1/6] topic: {topic['title']}")

    script = script_gen.generate_script(topic)
    narration = script_gen.full_narration(script)
    print(f"[2/6] script: {len(script['scenes'])} scenes, {len(narration.split())} words")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
    base = OUTPUT_DIR / f"{stamp}-{slugify(topic['title'])}"
    voice_path = base.with_suffix(".mp3")
    tts.synthesize(narration, voice_path, demo=args.demo)
    audio_seconds = tts.duration_seconds(voice_path)
    print(f"[3/6] voiceover: {audio_seconds:.1f}s")
    if audio_seconds > 60:
        print("      warning: >60s — YouTube will treat this as a regular video, not a Short")

    durations = assemble.scene_durations(script, audio_seconds)
    clips = visuals.gather_scene_clips(script["scenes"], durations, demo=args.demo)
    real = sum(1 for c in clips if c.get("url"))
    print(f"[4/6] visuals: {real}/{len(clips)} stock clips (rest generated)")

    video_path = base.with_suffix(".mp4")
    assemble.assemble(script, clips, voice_path, audio_seconds, video_path)
    print(f"[5/6] rendered: {video_path}")

    meta = metadata.build_metadata(topic, script, clips)
    meta_path = base.with_suffix(".json")
    meta_path.write_text(json.dumps({"topic": topic, "script": script, "meta": meta},
                                    indent=2, ensure_ascii=False), encoding="utf-8")

    video_id = None
    if args.no_upload:
        print("[6/6] upload skipped (--no-upload)")
    else:
        from . import upload
        video_id = upload.upload_video(video_path, meta)
        print(f"[6/6] uploaded: https://youtu.be/{video_id}")

    topics.mark_published(topic, video_id, meta["title"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
