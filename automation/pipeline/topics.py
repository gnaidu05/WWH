"""Topic selection: fresh AI-tool news from RSS feeds, falling back to the
evergreen queue in state/topics_queue.json.

A topic is a dict:
    {"title": str, "angle": str, "facts": [str, ...], "source": str}
"""
import json
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

import requests

from .config import STATE_DIR, load_config

QUEUE_PATH = STATE_DIR / "topics_queue.json"
PUBLISHED_PATH = STATE_DIR / "published.json"

_TAG_RE = re.compile(r"<[^>]+>")


def _load_json(path, default):
    if path.exists():
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    return default


def _save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def _published_titles() -> set[str]:
    return {p["topic"].lower() for p in _load_json(PUBLISHED_PATH, [])}


def _fetch_feed_items(url: str, timeout: int = 15) -> list[dict]:
    """Parse an RSS/Atom feed into [{title, summary, published}]."""
    resp = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = []
    for item in root.iter("item"):  # RSS 2.0
        items.append({
            "title": (item.findtext("title") or "").strip(),
            "summary": _TAG_RE.sub("", item.findtext("description") or "").strip(),
            "published": item.findtext("pubDate") or "",
        })
    for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):  # Atom
        items.append({
            "title": (entry.findtext("atom:title", namespaces=ns) or "").strip(),
            "summary": _TAG_RE.sub("", entry.findtext("atom:summary", namespaces=ns)
                                   or entry.findtext("atom:content", namespaces=ns) or "").strip(),
            "published": entry.findtext("atom:updated", namespaces=ns) or "",
        })
    return items


def fetch_trending_topic() -> dict | None:
    """Return the freshest usable news topic across configured feeds, or None."""
    cfg = load_config()
    seen = _published_titles()
    for feed in cfg.get("topics", {}).get("feeds", []):
        try:
            items = _fetch_feed_items(feed)
        except Exception:
            continue
        for item in items[:10]:
            title = item["title"]
            if not title or title.lower() in seen or len(title) < 20:
                continue
            return {
                "title": title,
                "angle": "breaking AI tool news — what it does and why viewers should care",
                "facts": [item["summary"]] if item["summary"] else [],
                "source": feed,
            }
    return None


def pop_evergreen_topic() -> dict | None:
    """Take the next unused topic from the evergreen queue (does not save yet)."""
    queue = _load_json(QUEUE_PATH, [])
    seen = _published_titles()
    for topic in queue:
        if topic["title"].lower() not in seen:
            return topic
    return None


def pick_topic(explicit: str | None = None, prefer_trending: bool = True) -> dict:
    if explicit:
        return {"title": explicit, "angle": "as requested", "facts": [], "source": "manual"}
    if prefer_trending:
        topic = fetch_trending_topic()
        if topic:
            return topic
    topic = pop_evergreen_topic()
    if topic:
        return topic
    raise RuntimeError(
        "No topics available: feeds unreachable and evergreen queue exhausted. "
        "Add topics to automation/state/topics_queue.json"
    )


def mark_published(topic: dict, video_id: str | None, title: str) -> None:
    published = _load_json(PUBLISHED_PATH, [])
    published.append({
        "topic": topic["title"],
        "video_title": title,
        "video_id": video_id,
        "published_at": datetime.now(timezone.utc).isoformat(),
    })
    _save_json(PUBLISHED_PATH, published)
