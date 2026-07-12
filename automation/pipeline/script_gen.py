"""Script generation.

Primary path: Claude API (set ANTHROPIC_API_KEY). Fallback: a deterministic
template engine so the pipeline runs end-to-end with no keys.

A script is a dict:
    {
      "hook": str,                     # first spoken line (<= ~12 words)
      "scenes": [                      # 4-7 scenes
        {"text": spoken narration,
         "overlay": "SHORT ON-SCREEN CAPTION",
         "broll_query": "stock footage search phrase"}
      ],
      "cta": str                       # closing call to action
    }
"""
import json
import re

import requests

from .config import env, load_config

CLAUDE_MODEL = "claude-sonnet-5"
API_URL = "https://api.anthropic.com/v1/messages"

PROMPT = """You write scripts for a faceless YouTube Shorts channel in the "{niche}" niche.
Style: {style}. Tone: {tone}. Target length: {words} spoken words total (~{seconds}s at {wpm} wpm).

Topic: {topic}
Angle: {angle}
Research facts (may be empty): {facts}

Rules:
- Hook must create an information gap in the first 2 seconds. No greetings ever.
- 4 to 7 scenes. Each scene: 1-3 punchy spoken sentences, a 2-5 word ALL-CAPS overlay,
  and a concrete stock-footage search phrase (people/objects/screens, never brand names).
- Ranking format when the topic is a list; problem->solution otherwise.
- Be specific: name real capabilities, numbers, use cases. No filler like "game changer".
- End with a one-line CTA that tells viewers to follow for daily AI tips.

Respond with ONLY valid JSON: {{"hook": str, "scenes": [{{"text": str, "overlay": str, "broll_query": str}}], "cta": str}}"""


def _target_words(cfg: dict) -> int:
    return int(cfg["script"]["wpm"] * cfg["video"]["target_seconds"] / 60)


def generate_with_claude(topic: dict, cfg: dict) -> dict | None:
    api_key = env("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    prompt = PROMPT.format(
        niche=cfg["channel"]["niche"],
        style=cfg["script"]["style"],
        tone=cfg["script"]["tone"],
        words=_target_words(cfg),
        seconds=cfg["video"]["target_seconds"],
        wpm=cfg["script"]["wpm"],
        topic=topic["title"],
        angle=topic.get("angle", ""),
        facts=json.dumps(topic.get("facts", []))[:2000],
    )
    resp = requests.post(
        API_URL,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": CLAUDE_MODEL,
            "max_tokens": 1500,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120,
    )
    resp.raise_for_status()
    text = resp.json()["content"][0]["text"]
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"Claude returned no JSON: {text[:200]}")
    return json.loads(match.group(0))


def generate_fallback(topic: dict, cfg: dict) -> dict:
    """Deterministic template script from the topic's facts — used when no API key
    is configured. Facts should be short claims; three are used as ranked items."""
    title = topic["title"]
    facts = [f for f in topic.get("facts", []) if f] or [
        f"{title} can automate work that used to take hours",
        f"{title} is free to try right now",
        f"most people have not discovered {title} yet",
    ]
    facts = facts[:3]
    scenes = [{
        "text": f"Here is what nobody tells you about {title}.",
        "overlay": "NOBODY TELLS YOU THIS",
        "broll_query": "person surprised looking at laptop screen",
    }]
    for i, fact in enumerate(facts):
        scenes.append({
            "text": fact if fact.endswith(".") else fact + ".",
            "overlay": f"#{i + 1}",
            "broll_query": "typing on laptop futuristic screen",
        })
    scenes.append({
        "text": "Try it before everyone else does.",
        "overlay": "TRY IT TODAY",
        "broll_query": "rocket launch success celebration",
    })
    return {
        "hook": f"Stop scrolling — {title} changes everything.",
        "scenes": scenes,
        "cta": "Follow for daily AI tips.",
    }


def generate_script(topic: dict) -> dict:
    cfg = load_config()
    script = generate_with_claude(topic, cfg) or generate_fallback(topic, cfg)
    # Basic validation
    assert script.get("hook") and script.get("scenes"), "script missing hook/scenes"
    for scene in script["scenes"]:
        assert scene.get("text") and scene.get("broll_query"), f"bad scene: {scene}"
        scene.setdefault("overlay", "")
    return script


def full_narration(script: dict) -> str:
    parts = [script["hook"]] + [s["text"] for s in script["scenes"]] + [script["cta"]]
    return " ".join(p.strip() for p in parts if p and p.strip())
