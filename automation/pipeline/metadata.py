"""YouTube metadata (title / description / tags) for a rendered video."""
from .config import load_config

BASE_TAGS = ["ai tools", "ai", "artificial intelligence", "tech tips",
             "productivity", "ai news", "shorts"]


def build_metadata(topic: dict, script: dict, clips: list[dict]) -> dict:
    cfg = load_config()
    title = topic["title"].strip()
    if len(title) > 90:
        title = title[:87].rsplit(" ", 1)[0] + "..."
    if "#shorts" not in title.lower():
        title += " #shorts"

    lines = [script["hook"], ""]
    for i, scene in enumerate(script["scenes"], 1):
        if scene.get("overlay"):
            lines.append(f"{i}. {scene['overlay'].title()}")
    lines += ["", script["cta"]]

    credits = sorted({c["credit"] for c in clips if c.get("credit")})
    if credits:
        lines += ["", "Stock footage via Pexels: " + ", ".join(credits)]
    handle = cfg["channel"].get("handle")
    if handle:
        lines += ["", f"Follow {handle} for daily AI tips."]
    lines += ["", "#AI #AITools #Tech #Shorts"]

    return {
        "title": title,
        "description": "\n".join(lines)[:4900],
        "tags": BASE_TAGS,
        "category_id": cfg["upload"]["category_id"],
        "privacy": cfg["upload"]["privacy"],
        "made_for_kids": cfg["upload"]["made_for_kids"],
    }
