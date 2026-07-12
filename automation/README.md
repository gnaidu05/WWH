# Faceless YouTube Automation

An end-to-end pipeline that researches a topic, writes a script, synthesizes a
voiceover, sources vertical b-roll, renders a 9:16 Short with burned-in captions,
and posts it to YouTube — on a Mon/Wed/Fri schedule via GitHub Actions.

**Niche:** AI Tools & Tips (see [NICHE_RESEARCH.md](NICHE_RESEARCH.md) for the
data behind the choice).

## How it works

```
topic (RSS trend feeds → evergreen queue)
  → script (Claude API, template fallback)
  → voiceover (edge-tts, free neural voices)
  → b-roll (Pexels API, free; gradient fallback)
  → assembly (ffmpeg: 1080x1920, captions, audio mix)
  → metadata (title/description/tags, Pexels credits)
  → upload (YouTube Data API v3, OAuth refresh token)
  → state (published log committed back to the repo)
```

Every stage degrades gracefully: with **zero API keys** the pipeline still
renders a complete demo video (template script, silent track, gradient
backgrounds), so you can test the machinery before wiring up accounts.

## Quick start (local)

```bash
cd automation
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
sudo apt-get install -y ffmpeg fonts-dejavu-core   # or brew install ffmpeg

# Offline smoke test — no keys needed
python -m pipeline.run --demo --no-upload

# Real video, no upload (needs PEXELS_API_KEY; ANTHROPIC_API_KEY optional)
cp .env.example .env   # fill in, then `export $(grep -v '^#' .env | xargs)`
python -m pipeline.run --no-upload
```

Output lands in `automation/output/` as `<timestamp>-<slug>.mp4` plus a `.json`
with the script and YouTube metadata.

## One-time YouTube setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create a
   project and enable **YouTube Data API v3**.
2. Create **OAuth client ID** credentials, type **Desktop app**.
3. Locally: `export YT_CLIENT_ID=... YT_CLIENT_SECRET=...` then
   `python -m pipeline.upload --authorize` — sign in with the channel's Google
   account and copy the printed `YT_REFRESH_TOKEN`.
4. Add repository **Actions secrets**: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`,
   `YT_REFRESH_TOKEN`, `PEXELS_API_KEY`, and optionally `ANTHROPIC_API_KEY`.

> Note: each upload costs 1600 YouTube API quota units; the default 10,000/day
> quota allows ~6 uploads/day. Brand-new API projects upload as **private**
> until the project passes Google's API audit — start with
> `privacy: unlisted` in `config.yaml` and verify, or request the audit early.

## Scheduling

`.github/workflows/faceless-youtube.yml` runs Mon/Wed/Fri at 15:00 UTC:

- picks a fresh topic from the RSS feeds (falls back to the evergreen queue in
  `state/topics_queue.json`)
- renders and uploads the video
- attaches the MP4 as a workflow artifact (14-day retention) for review
- commits the publish log back to `state/published.json`

Run it manually from the Actions tab (`workflow_dispatch`) with an optional
explicit topic, or with `upload: false` to review the artifact before posting.

## Tuning

- `config.yaml` — voice, pacing, privacy, schedule days, RSS feeds, music.
- `state/topics_queue.json` — evergreen topic backlog; each entry's `facts`
  become the ranked items when the template fallback writes the script.
- Background music: drop a royalty-free `.mp3` in `assets/music/` and set
  `music.enabled: true`.

## Staying monetizable (read this)

YouTube's inauthentic-content policy (July 2025 update) targets mass-produced,
repetitious uploads. Keep the channel healthy:

- keep `ANTHROPIC_API_KEY` set so every script is uniquely researched, and
  review scripts/videos via the render-only mode while the channel is young;
- add original value (rankings with reasoning, comparisons, benchmarks) — the
  prompt in `pipeline/script_gen.py` is written to enforce this;
- don't raise the cadence above ~3/week until watch-time signals are healthy;
- disclose AI-generated content in uploads if YouTube prompts for it.
