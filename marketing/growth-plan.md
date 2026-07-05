# The Agency — Launch Growth Plan

**Product:** The Agency — an open-source library of 85 handwritten AI specialist agents across 16 divisions, installable into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Aider and more with one command (`scripts/install.sh`). MIT licensed, free.
**Hook:** "Hire an entire company of AI specialists in about 60 seconds."
**Positioning line:** "A starting point you own."
**Destinations:** Landing page https://gnaidu05.github.io/WWH/ · Repo https://github.com/gnaidu05/WWH
**Author:** growth-hacker · **Date:** 2026-07-05 · **Status:** pre-launch, zero traction data. Every number below is a *target*, not a result.

---

## 0. Honesty preamble (read before quoting any number)

We have no users yet. There are no stars, no installs, no testimonials to cite. This plan sets **targets and kill criteria**, not claimed outcomes. It is 85 agents, not 232 — the frame is "start with 7, scale to 85." Anyone who wants to inflate a number to make launch look better is manufacturing a vanity signal the product can't retain. Don't.

---

## 1. North-star metric

**North star: Weekly Activated Builders (WAB) = unique people who run `install.sh` AND invoke ≥1 agent in their own AI tool within 7 days of first touch.**

Why this one:
- It is the first moment the product delivers its actual value — an agent doing work in the user's editor. Everything upstream (a star, a clone) is potential energy; the first agent invocation is the "aha."
- It is a **loop input**, not a spike. A person who ran an agent and got a usable deliverable is the only person who will star sincerely, tell a friend, or contribute an agent back. Optimizing WAB pulls the whole AARRR chain forward.
- It resists vanity. You cannot buy it with a Show HN spike that bounces.

**Repo stars = explicitly a vanity proxy.** We track stars because they are the cheapest public signal and they feed social proof, but a star is a bookmark, not activation. We will report stars and WAB side by side and never let a star count stand in for a WAB number.

### Measurement reality (instrument this BEFORE launch)
We cannot see inside a user's editor, and the install is a local shell script — there is no server. So WAB is **not** directly observable. Do not pretend it is. Measure it with a defensible proxy stack, weakest to strongest:

| Signal | What it proxies | How to capture | Trust |
|---|---|---|---|
| Landing page uniques | Awareness | GitHub Pages has no analytics by default — add Plausible/Umami (privacy-friendly, no cookie banner) to `index.html` | Medium |
| `git clone` count | Intent to install | GitHub repo **Insights → Traffic → Git clones** (unique cloners) | Medium |
| Install invocations | Activation attempt | Optional, **opt-in, off by default** anonymous ping in `install.sh` (a single `curl` to a counter endpoint, printed and skippable with `--no-telemetry`). If we won't do opt-in cleanly, we DON'T do it — and WAB stays modeled from clones. | High if built honestly |
| "Used it" replies / issues / discussions | Real activation | Manual tally of GitHub Discussions, issues, social replies showing an agent ran | Highest, low volume |

Interim modeled WAB = unique cloners × assumed install-and-run rate (start at a conservative 25% until we have real reply data to correct it). **Label it "modeled" every single time.** The moment opt-in install pings or discussion volume exist, replace the model with them.

**Guardrail metrics** (checked before any funnel win is called a win): issue-close rate / unanswered-issue count (support load), install success rate on the three top tools (Claude Code, Cursor, Copilot), and the ratio of sincere stars to install attempts (a star:clone ratio that balloons while clones stay flat = we're winning bookmarks, not builders).

---

## 2. Activation funnel — stage by stage with drop-off risk

```
Awareness ──► Landing/Repo view ──► Star ──► Clone ──► Install runs ──► First agent invoked ──► Shares / Contributes
  (reach)        (interest)        (bookmark)  (intent)   (setup)          (**ACTIVATION**)         (loop)
```

| # | Stage | What it means | Primary drop-off risk | Fix lever |
|---|---|---|---|---|
| 1 | **Awareness** | Sees a post/link | Message reads as "another prompt pack." 85 agents sounds like noise, not signal. | Lead with the 60-second install + one concrete deliverable, not the agent count. |
| 2 | **Landing / repo view** | Clicks through | README wall-of-text; no "what do I type" above the fold; unclear it works with *their* tool. | One-line install command visible before any scroll; a tool-logo row proving "yours is supported." |
| 3 | **Star** | Bookmarks | Costs nothing, means nothing — people star to read later and never return. **This is the vanity trap.** | Treat as reach amplifier only. Don't optimize copy for stars at activation's expense. |
| 4 | **Clone** | Pulls the repo | "I'll try it this weekend" (never happens); unsure which of 85 to use; fear of polluting their config. | Starter-squad framing ("just these 7"), `--dry-run` reassurance, `--scope user` vs project clarity. |
| 5 | **Install runs** | Executes `scripts/install.sh` | Wrong tool flag, unknown editor, permissions, or silent copy with no confirmation → user unsure it worked. | `check.sh` verifies; install prints exactly where files went and "now try: @growth-hacker …". |
| 6 | **First agent invoked** | **ACTIVATION** — runs one agent, gets a deliverable | Doesn't know how to invoke in their tool; picks a vague agent; output feels generic → "same as a raw prompt." | Ship a per-tool "how to invoke" snippet + a starter-squad cheat sheet naming the exact first command and the deliverable to expect. |
| 7 | **Shares / contributes** | Stars sincerely, posts org chart, opens a PR with a new agent | No prompt to share; contributing an agent feels heavy. | Post-install nudge, shareable org-chart, and a dead-simple "add your own agent" CONTRIBUTING path. |

**Priority leak = Stage 5→6 (install → first agent invoked).** Star and clone are relatively cheap for this audience; the product lives or dies on whether a cloned repo becomes an agent actually running in the user's editor. Every launch experiment below is weighted toward dragging that transition earlier and making it foolproof.

---

## 3. Prioritized launch experiment backlog

ICE = Impact × Confidence × Ease, each 1–10, score = mean. All target activation (Stage 5→6) unless noted. No experiment ships without the pre-registered metric and kill criterion shown.

### Card A — Starter-squad cheat sheet (lead magnet + activation aid) · ICE 8.3
- **Hypothesis:** Shipping a one-page "Starter Squad" cheat sheet (the 7 agents, the exact command to invoke each in Claude Code/Cursor/Copilot, and the deliverable each returns) will raise modeled install→first-invoke rate by ≥15%, because the #1 drop-off is "installed, now what do I type?"
- **The one metric:** modeled first-invoke rate (share of cloners who report/ping a first agent run). Proxy in week 1: cheat-sheet link CTR → discussion "it worked" replies.
- **Kill criterion:** if after 300 landing visits the cheat sheet gets <5% CTR AND no uptick in "it worked" replies, it's not the leak — stop iterating on it.
- **Effort:** Low (1 page, static, lives on landing + repo README).

### Card B — Show HN launch · ICE 7.3
- **Hypothesis:** A "Show HN: The Agency — 85 handwritten AI agents you install into your existing AI editor in 60s" post will drive a qualified traffic spike (HN skews exactly our audience), yielding ≥400 unique cloners in 72h.
- **The one metric:** unique Git cloners in the 72h window (Insights → Traffic).
- **Kill criterion:** it's a one-shot event, not iterable — but if star:clone ratio >20:1 (lots of bookmarks, few installs), the post is winning vanity; pivot the top comment to hammer the install command and a single deliverable. Do NOT call the spike a win until week-2 retained clones hold.
- **Effort:** Low to run, high stakes on timing/title. One shot — draft title + first-comment with the install line and cheat-sheet link ready.

### Card C — Subreddit launches (r/LocalLLaMA, r/ChatGPTCoding, r/cursor, r/ClaudeAI) · ICE 6.7
- **Hypothesis:** Tool-specific framing ("convert all 85 to Cursor rules / Claude agents with one flag") in each community's native subreddit converts better than a generic cross-post, because relevance ("works with MY tool") is Stage-2 drop-off.
- **The one metric:** clones attributable to each subreddit (unique UTM'd landing links per community).
- **Kill criterion:** any subreddit under 20 clicks or removed by mods = drop that community, don't re-post (documented so no one re-runs it). One variable per post — do not multipost the identical text.
- **Effort:** Medium (bespoke post per sub, staggered over the week to respect self-promo rules).

### Card D — "Which 7 would you install?" org-chart shareable · ICE 7.0
- **Hypothesis:** A shareable org-chart image of the 85 agents across 16 divisions, with a "pick your starter 7" prompt, will generate social reach at k>0 because choosing a lineup is identity-expressive and inherently postable.
- **The one metric:** referral sessions from shared org-chart links (social + referral traffic to landing).
- **Kill criterion:** <30 shares or <50 referred sessions in launch week = the asset isn't loop-worthy; retire it.
- **Effort:** Medium (design the chart; the "pick 7" interaction can be a simple text prompt first, tool later).

### Card E — "Convert to your tool" hook · ICE 7.7
- **Hypothesis:** Making the multi-tool support the *headline* ("same specialists, one flag, converts to Cursor / Copilot / Codex / Gemini / Windsurf / Aider") lifts Stage 2→4 (view→clone) by ≥10%, because the strongest objection is "does this work in my setup?"
- **The one metric:** view→clone rate (repo/landing views vs unique cloners).
- **Kill criterion:** no measurable clone-rate lift over the pre-hook baseline after 500 views = the objection wasn't tooling; move budget to Card A.
- **Effort:** Low (copy + a tool-logo row above the fold; capability already exists in `install.sh`).

**Sequencing by ICE:** A (8.3) → E (7.7) → B (7.3) → D (7.0) → C (6.7). Ship A and E as *pre-launch prerequisites* (they harden the funnel), then fire B/C/D as the actual launch pushes.

---

## 4. Viral / referral loops native to this product

This product has unusually good organic loop potential because **the unit of value is a shareable text file** and **the orchestrator demo is inherently a screenshot.** Three loops, with the k-factor math to keep us honest:

**k-factor reminder:** k = (invites sent per activated user) × (conversion rate per invite). A loop compounds only when k > 1; below that it *amplifies* other channels but doesn't self-sustain. Cycle time (touch → their touch) determines how fast either happens. Be skeptical: assume k < 1 until measured.

### Loop 1 — The orchestrator demo (highest potential)
- **Mechanic:** A user runs `agents-orchestrator` and watches it dispatch specialists; the terminal transcript is screenshot-worthy on its own. They post it → viewers see the product working in a real editor → clone.
- **Why native:** the demo *is* the product doing the thing; no manufactured referral needed.
- **Cycle time:** short (one impressive run → one post).
- **Instrument:** count posts featuring an orchestrator transcript; referral clicks from them. Target: seed 5 of these ourselves launch week; measure organic follow-on.

### Loop 2 — "Which 7 would you install?" (identity loop, Card D)
- **Mechanic:** Picking a starter lineup from 85 is a low-effort, identity-expressive act. Each shared lineup is an ad that names the product and invites the reader to pick their own.
- **k math (target):** if 15% of activated builders post a lineup (invites) and each post converts 3% of viewers, k ≈ 0.15 × (avg viewers × 0.03). Realistically k < 1 at launch — treat as an **amplifier**, not a growth engine, until data says otherwise.
- **Cycle time:** medium (needs the share asset in front of them post-install).

### Loop 3 — Contribute-an-agent (compounding content loop)
- **Mechanic:** Agents are handwritten MIT text files. A contributor who adds their own specialist (a) becomes retained, (b) brings their audience to *their* agent, (c) grows the library, which grows the top-of-funnel pitch ("now 90+ agents"). This is the loop that turns a win permanent.
- **Why native:** the library gets more valuable with each contribution — classic content-loop compounding.
- **Instrument:** merged agent-contribution PRs per week; referral traffic from contributor announcements. Make CONTRIBUTING dead-simple (one file, a template, a short PR checklist).

**Loop verdict:** design for Loops 1 and 3 to carry launch (demo shareability + contributions), and treat Loop 2 as reach amplification. Do not claim virality until a measured k with a cohort backs it.

---

## 5. Launch-week day-by-day channel sequence

Pre-reqs shipped before Day 1: Plausible/Umami on landing, GitHub Discussions on, starter-squad cheat sheet live (Card A), "convert to your tool" hook above the fold (Card E), org-chart asset drafted (Card D), `check.sh` verified on Claude Code / Cursor / Copilot, install prints where files went + the exact first command. Baseline traffic numbers recorded so lifts are measurable.

| Day | Primary move | Channel | The one metric watched | Guardrail |
|---|---|---|---|---|
| **Mon (D1)** | Soft launch to owned audience + seed 5 orchestrator-demo transcripts (Loop 1). Confirm every event fires. | Personal networks, X/Bluesky, dev Discords | Install→first-invoke replies (does it actually work for strangers?) | Install success on 3 top tools |
| **Tue (D2)** | **Show HN** (Card B) at ~8am ET. First comment = install line + cheat-sheet link. Man the thread all day answering, not marketing. | Hacker News | Unique cloners / 72h | star:clone ratio (<20:1) |
| **Wed (D3)** | Subreddit launch #1 — r/ClaudeAI or r/cursor with tool-native "convert with one flag" framing (Card C + E). | Reddit (one sub) | Clones from that sub's UTM | Mod removal / self-promo rules |
| **Thu (D4)** | Publish org-chart "Which 7 would you install?" (Card D). Post where D2/D3 traffic already gathered. | X/Bluesky + Reddit follow-up | Org-chart referral sessions / shares | Referral quality (do shares clone?) |
| **Fri (D5)** | Subreddit launch #2 — r/LocalLLaMA or r/ChatGPTCoding, different angle (open-source / own-your-agents). Open a "contribute your agent" call (Loop 3). | Reddit (second sub) + GitHub Discussions | Clones + first contribution PRs | Unanswered-issue count |
| **Sat–Sun (D6–7)** | Quiet: answer every issue/discussion, tally "it worked" replies, correct the modeled-WAB assumption with real reply data. No new pushes. | GitHub, email digest | Weekly Activated Builders (modeled + confirmed) | Support load / open issues |

**End-of-week readout (the deliverable that closes the loop):** WAB (modeled, with the assumption stated) and confirmed activations side by side; stars reported but flagged vanity; per-channel clones with confidence caveats (small-n = "directional, not significant"); guardrail check (install success, support load, star:clone); and for each experiment card an explicit **ship / iterate / kill** decision with the number that drove it. Losses documented in the backlog so no one re-runs them. No spike is called a win until week-2 clones show it retained.

---

### Launch targets (proposed, not promised)
- Week 1: 400+ unique cloners, modeled WAB 100+ (at 25% assumption), 15+ confirmed "it worked" reports, 3+ agent-contribution PRs.
- Stars: tracked, uncelebrated. If stars vastly outrun clones, we're collecting bookmarks — fix the install→invoke path, not the pitch.
