"""Configuration loading and shared paths."""
import os
from pathlib import Path

import yaml

AUTOMATION_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = AUTOMATION_DIR / "config.yaml"
STATE_DIR = AUTOMATION_DIR / "state"
ASSETS_DIR = AUTOMATION_DIR / "assets"
OUTPUT_DIR = AUTOMATION_DIR / "output"
CACHE_DIR = AUTOMATION_DIR / ".cache"


def load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def env(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name, default)
    return value if value not in ("", None) else default


def ensure_dirs() -> None:
    for d in (STATE_DIR, OUTPUT_DIR, CACHE_DIR, ASSETS_DIR / "music"):
        d.mkdir(parents=True, exist_ok=True)
