# SEO Plan — The Agency

Open-source library of **85 handwritten AI specialist agents** across **16 divisions**, installable into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Aider and more with one command. MIT licensed, free.

- Landing page: https://gnaidu05.github.io/WWH/
- Repo: https://github.com/gnaidu05/WWH

---

## 0. Reality check on timelines (read this first)

A brand-new GitHub Pages subpath (`gnaidu05.github.io/WWH/`) has **zero domain authority and no crawl history**. Nothing below ranks in week one. The mechanism for early traffic is not the landing page — it is:

1. **GitHub's own domain authority.** The *repo* (github.com/gnaidu05/WWH) will index and rank for long-tail brand + tool terms far faster than the Pages site, because github.com is a high-authority domain Google crawls constantly. Optimize the repo first.
2. **Launch backlinks** (HN, Reddit, dev newsletters, awesome-lists) that pass authority to both repo and landing page and drive the referral traffic that *is* the first 90 days.
3. **Organic search** compounds only after those links age in — realistically **3–6 months** for competitive head terms, sooner for exact long-tail.

So: repo + README SEO and off-page are the load-bearing work at launch. On-page `index.html` fixes are cheap and correct to ship now, but they pay off later. This plan is ordered by that reality, not by vanity.

Honesty guardrails applied throughout: **85 agents, 16 divisions, MIT, free.** No invented metrics, no "232", no fake star counts or user numbers.

---

## 1. Keyword map (intent + honest difficulty)

Difficulty is relative to a new site with GitHub backing. "Reachable" means the repo/README can realistically rank on page 1 within ~1–3 months given launch links; "Slow" means 3–6+ months and depends on sustained backlinks; "Hard" means dominated by established players — target as long-tail modifiers, not head-on.

### Primary (the terms worth building the whole map around)

| Keyword | Monthly intent | Difficulty | Where it ranks | Notes / mechanism |
|---|---|---|---|---|
| claude code subagents | Informational/commercial — people setting up Claude Code want ready-made subagents | Slow | README H1 + landing `<title>` | Highest-fit head term. "Subagents" is Anthropic's own term for `.claude/agents/*.md` files — exactly what you ship. Own it. |
| claude code agents | Commercial | Slow | README + landing | Broader, higher volume, more competition from docs. Rank via the subagents/library angle. |
| ai agent library | Commercial/transactional — "give me a set I can install" | Reachable | README topics + landing H1 | Strong intent match: you literally are an installable library. Less contested than "claude code agents". |
| ai coding agents | Informational | Hard | Content cluster only | Big, generic, dominated. Don't target head-on; capture via long-tail articles that link back. |

### Secondary (supporting head terms, on-page + README)

| Keyword | Intent | Difficulty | Notes |
|---|---|---|---|
| cursor ai agents | Commercial | Slow | You install into Cursor — real fit. Pair with "custom" / "rules" modifiers. |
| claude agents github | Navigational/commercial | Reachable | GitHub repos rank *very* well here because the query implies GitHub. Low-hanging. |
| ai coding specialists | Informational | Reachable | Near-brandable phrase; little competition; matches your positioning verbatim. |
| custom claude code agents | Commercial | Reachable | "custom" signals intent to install/edit — your exact value prop (plain-text, own it). |
| open source ai agents | Commercial | Hard | Broad; use as a modifier, not a primary. MIT license is the credibility hook. |
| subagents claude code | Commercial | Slow | Word-order variant of the primary; cover naturally in copy. |

### Long-tail (the realistic early wins — low volume, high intent, low difficulty)

These are where a new site actually ranks first. Each maps to a content-cluster article (Section 4) that links to the landing page.

| Keyword | Intent | Difficulty | Target asset |
|---|---|---|---|
| how to install subagents in claude code | Transactional | Reachable | README quickstart + Article 1 |
| best claude code agents | Commercial investigation | Reachable | Article 2 (listicle) |
| claude code agents for backend / frontend / security | Commercial | Reachable | Division landing sections / Article 4 |
| how to add custom agents to cursor | Transactional | Reachable | Article 3 |
| ai agent for code review | Commercial | Reachable | Ties to reality-checker/testing division |
| claude code subagents example | Informational | Easy | README example (you already show `backend-architect.md`) |
| one command install ai agents | Transactional | Easy | Landing page hook — nearly uncontested |
| free ai coding agents | Commercial | Reachable | MIT/free angle; pairs with "open source" |

**Takeaway:** compete for long-tail transactional terms now (they convert to installs and stars), seed the head terms in the README/title so they mature as links accrue, and never write a page whose intent you can't satisfy (skip generic "ai coding agents" as a target — you'd lose and it wouldn't convert).

---

## 2. On-page fixes for `index.html` (paste-ready)

The page is clean, semantic, accessible, and fast (inline CSS, no render-blocking JS, one deferred IIFE). Good foundation. What's missing is entirely in `<head>`: no meta description, no canonical, no social cards, no structured data, and the title/H1 don't contain the terms people search.

### 2.1 `<title>` — replace line 6

Current: `The Agency — hire a company of AI specialists`
It's on-brand but contains zero search terms. Add the phrases people actually type, keep it under ~60 chars of visible weight, front-load the keyword.

Paste this exact string:

```html
<title>The Agency — 85 AI Coding Agents for Claude Code, Cursor & More</title>
```

Rationale: "AI Coding Agents", "Claude Code", "Cursor" are the query terms; "85" is an honest, click-worthy number; brand stays first for navigational recall.

### 2.2 Meta description — add directly under the title

Google rewrites descriptions often, but a good one lifts CTR on the queries you *do* rank for. Include the primary terms and the hook, ~150 chars.

Paste this exact block into `<head>` (right after the `<title>`):

```html
<meta name="description" content="Hire an entire company of AI specialists in about 60 seconds. 85 open-source, handwritten AI agents in 16 divisions — one command installs them into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf & Aider. MIT licensed, free.">
```

### 2.3 Canonical + robots (prevents the trailing-slash / index.html duplicate)

GitHub Pages serves the same content at `/WWH/` and `/WWH/index.html`. Declare one canonical so link equity doesn't split.

```html
<link rel="canonical" href="https://gnaidu05.github.io/WWH/">
<meta name="robots" content="index, follow, max-image-preview:large">
```

### 2.4 H1 / H2 guidance

**H1 (line 405).** Current: *"Hire an entire company in about sixty seconds."* — this is your hook, keep it; it's the emotional headline. But it carries no keyword, and it's your only H1. Two acceptable options, in priority order:

- **Preferred (keep the hook, add a keyworded eyebrow that's crawlable text):** the eyebrow on line 404 is `File № 001 — Personnel`. Leave the H1 poetic, but make sure the keyworded phrase appears in real body text high on the page. The lede (line 406) already says "Eighty-five handwritten AI specialists" — change the spelled-out number to a digit and add the product category so the crawler sees it:

  Replace the lede text (line 406) with:
  ```html
  <p class="lede reveal">Not freelancers. Not one vague chatbot. <b>85 handwritten AI coding agents</b> — subagents organized into 16 divisions like a real company — that install into Claude Code, Cursor, Copilot and more with one command.</p>
  ```
  This puts "AI coding agents", "subagents", "Claude Code", "Cursor", "one command" into the first paragraph of body copy, where they carry real weight, without touching the headline's voice.

- Keep exactly one `<h1>`. Don't add a second.

**H2s.** You have strong section H2s already (lines 433, 458, 494, 512, 539, 560). They're brand-voiced, which is fine, but two of them should earn a keyword since H2s are a ranking signal:

- Divisions section H2 (line 512), current *"Sixteen divisions, organized exactly like a real company."* — keep, but the section is a natural place to also surface division keywords in the visible `.ex` text (it already lists "SEO", "security", "backend" etc., good — that's crawlable long-tail).
- Consider making the roster H2 (line 494) or a nearby subhead include "AI agents" once. Optional; don't force it at the cost of voice. The title, description, and lede carry the primary load.

**Alt text / images:** there are no `<img>` tags (all CSS), so no alt-text debt. Good. The one thing to add is a social-share image (below), which needs its own file.

### 2.5 Open Graph + Twitter Card

No social tags exist, so every share on X, LinkedIn, Slack, Discord renders a bare URL — that kills launch CTR, which is where your first traffic comes from. This is the single highest-ROI on-page fix for launch day.

Paste into `<head>`:

```html
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Agency">
<meta property="og:title" content="The Agency — 85 AI Coding Agents for Claude Code, Cursor & More">
<meta property="og:description" content="Hire an entire company of AI specialists in about 60 seconds. 85 open-source, handwritten AI agents in 16 divisions — one command installs them into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf & Aider. MIT licensed, free.">
<meta property="og:url" content="https://gnaidu05.github.io/WWH/">
<meta property="og:image" content="https://gnaidu05.github.io/WWH/og-cover.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Agency — 85 handwritten AI specialist agents in 16 divisions.">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The Agency — 85 AI Coding Agents for Claude Code, Cursor & More">
<meta name="twitter:description" content="85 open-source, handwritten AI agents in 16 divisions. One command installs them into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf & Aider. MIT, free.">
<meta name="twitter:image" content="https://gnaidu05.github.io/WWH/og-cover.png">
```

**Action item:** create `og-cover.png` at exactly 1200×630 and commit it to the repo root next to `index.html`. Put the wordmark, the hook ("Hire a company of AI specialists in ~60s"), and "85 specialists · 16 divisions · MIT" on it, in the paper/ink/accent palette the site already uses. Until that file exists, the `og:image` tag points at a 404 — so ship the image in the same commit.

### 2.6 JSON-LD structured data (SoftwareApplication)

This makes you eligible for richer SERP treatment and gives Google an explicit, machine-readable statement of what the product is, its price (free), and its license. It must match the visible page — which it does: free, MIT, developer tool. No markup spam.

Paste before `</head>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "The Agency",
  "description": "An open-source library of 85 handwritten AI specialist agents across 16 divisions, installable into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf and Aider with one command.",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Linux, Windows",
  "url": "https://gnaidu05.github.io/WWH/",
  "downloadUrl": "https://github.com/gnaidu05/WWH",
  "softwareVersion": "1.0",
  "license": "https://opensource.org/licenses/MIT",
  "isAccessibleForFree": true,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "keywords": "claude code subagents, ai coding agents, ai agent library, cursor ai agents, ai coding specialists, open source ai agents",
  "author": {
    "@type": "Person",
    "name": "gnaidu05"
  }
}
</script>
```

Note: I deliberately left out `aggregateRating` and `interactionStatistic` (install/star counts) — you have no honest, verifiable numbers yet, and fabricated ratings are exactly the markup spam that triggers manual actions. Add `aggregateRating` only when you have real review data.

### 2.7 Two small technical adds

- **`sitemap.xml` + `robots.txt`** in the repo root. A one-URL sitemap is trivial but tells Search Console the canonical URL exists. `robots.txt` should simply `Allow: /` and point to the sitemap.
- **Verify + submit in Google Search Console** for `https://gnaidu05.github.io/WWH/` (URL-prefix property). This is the "submit to search console / set the baseline" step — do it day one so you have ranking data from the start.

Paste `sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gnaidu05.github.io/WWH/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Paste `robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://gnaidu05.github.io/WWH/sitemap.xml
```

---

## 3. Repo / README SEO (the fastest-ranking asset you have)

github.com already has the authority the Pages site lacks. The repo will rank for long-tail terms in days, not months. Treat the README as your real SEO landing page.

### 3.1 GitHub "About" description (the sidebar field)

Paste exactly (keep under 350 chars):

```
Hire a company of AI specialists in ~60s. 85 open-source, handwritten AI agents in 16 divisions — one command installs them into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf & Aider. MIT licensed.
```

Set the "Website" field in the same sidebar to `https://gnaidu05.github.io/WWH/` — this creates an authority-passing link from the repo to the landing page.

### 3.2 Topics / tags (Repo → About → gear icon → Topics)

GitHub topics are indexed and power both GitHub's own search and Google. Add all of these (lowercase, hyphenated — GitHub's format):

```
claude-code  subagents  ai-agents  claude  cursor  ai-coding-assistant
copilot  codex  gemini  windsurf  aider  llm  ai-agent-framework
agent-library  developer-tools  open-source  mit-license  prompt-engineering
anthropic  coding-agents
```

Prioritize `claude-code`, `subagents`, `ai-agents`, `cursor`, `agent-library` — those are trafficked topic pages on GitHub itself.

### 3.3 README H1 and opening (crawlable, keyworded)

The README H1 should lead with the primary keyword, not just the brand. Paste:

```markdown
# The Agency — 85 AI Coding Agents (Subagents) for Claude Code, Cursor & More

**Hire an entire company of AI specialists in about 60 seconds.** The Agency is a
free, open-source library of **85 handwritten AI specialist agents** organized into
**16 divisions** — engineering, design, security, marketing, data & AI, and more.
Install the whole roster, or just the divisions you want, into **Claude Code, Cursor,
GitHub Copilot, Codex, Gemini, Windsurf, Aider** and other tools with **one command**.

> Not freelancers. Not one vague chatbot. 85 role-specific subagents, each a plain-text
> file you can read, edit, and own. MIT licensed.
```

**README structure for SEO (H2s that double as long-tail targets):**
- `## What is The Agency?` — restate category ("AI coding agents / subagents") for the definition query.
- `## Quickstart — install in one command` — captures "how to install subagents in claude code" (transactional, reachable). Show the `scripts/install.sh` commands and the `--tool cursor` / `--division` flags exactly as on the landing page.
- `## Supported tools` — list Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Aider as text (each name is a query someone types + your product).
- `## The 16 divisions` — a table of all 16 divisions with agent counts (Engineering 6, Design 5, Product 5, Marketing 6, Sales 5, Security 6, Finance 5, Testing & QA 5, Game Dev 5, Data & AI 6, DevOps 5, Operations 5, Research 5, Mapping & GIS 5, Content 5, Growth 5). This block is pure long-tail gold ("claude code agents for security", etc.) and it's honest data straight off the landing page.
- `## Example: what a specialist looks like` — paste a real agent `.md` (you already show `backend-architect.md`); ranks for "claude code subagents example".
- `## License` — "MIT licensed, free."

**README keyword checklist:** the phrases `claude code`, `subagents`, `AI coding agents`, `AI agent library`, `Cursor`, `install`, `open source`, `MIT` should each appear naturally in the first two screens. Don't stuff — write for the developer skimming it, and these fall out of honest description anyway.

Add repo-level SEO signals GitHub weights: a clear README (above), a `LICENSE` file (MIT — powers the "MIT" filter and the license badge), release tags (a `v1.0` release is an indexable page), and a pinned social preview image (Settings → Social preview — reuse `og-cover.png`).

---

## 4. Content-cluster plan

Hub = the landing page + README. Spokes = articles published where they'll get indexed fast (dev.to, Hashnode, Medium, or a `/blog` if you add one), each targeting a long-tail cluster and **linking back to the landing page with descriptive anchor text** (e.g., "the open-source AI agent library"). The point is topical authority + backlinks, not the articles ranking forever.

1. **"How to install AI subagents in Claude Code (the one-command way)"**
   Target: *how to install subagents in claude code*, *one command install ai agents* (transactional, reachable). Step-by-step using `scripts/install.sh`, the `--tool` and `--division` flags, and what lands in `.claude/agents/`. Highest-converting spoke — readers finish it by installing.

2. **"9 Claude Code subagents worth installing on day one"**
   Target: *best claude code agents*, *claude code subagents* (commercial investigation, reachable). Build the listicle around your Starter Squad seven (rapid-prototyper, backend-architect, ai-engineer, whimsy-injector, growth-hacker, content-creator, reality-checker) plus a couple more. Listicles earn links and match "best…" intent perfectly.

3. **"Adding custom AI agents to Cursor (and Copilot, Codex, Windsurf, Aider)"**
   Target: *how to add custom agents to cursor*, *cursor ai agents*, *custom claude code agents*. Shows the same handwritten specialists converting across tools — your genuine multi-tool differentiator. One article, many tool-name long-tails.

4. **"What a good AI coding agent actually looks like (anatomy of a specialist file)"**
   Target: *ai coding specialists*, *claude code subagents example*, *prompt engineering for agents*. Teardown of the `backend-architect.md` file — identity, specialty, process, deliverable. Positions you as the thoughtful, honest option vs. black-box tools; strong for developer credibility and links.

5. **(Optional) "Orchestrating a team of AI agents: give a goal, not a task list"**
   Target: *ai agent orchestration*, *multi-agent coding* (informational, more competitive — treat as thought-leadership for links, not a ranking play). Built around the `agents-orchestrator` concept from section 05 of the landing page.

Cadence: ship 1–2 at launch (Articles 1 and 2), then one every 1–2 weeks. Internal-link every article to the landing page and to each other; cross-link the README to the best-performing article once you have data.

---

## 5. Off-page — where launch backlinks come from and which matter

For a new open-source repo, backlinks *are* the growth engine for the first 90 days. Ranked by real impact:

**Tier 1 — launch-day, high-authority, drives both links and referral traffic:**
- **Hacker News** (Show HN). Title suggestion: *"Show HN: The Agency – 85 open-source AI specialist agents for Claude Code, Cursor, etc."* One good HN thread outweighs months of on-page tweaks for a dev tool. Highest single lever. Post once, honestly, engage in comments.
- **Reddit:** r/ClaudeAI, r/cursor, r/ChatGPTCoding, r/LocalLLaMA, r/programming (where allowed). Match each sub's rules; lead with the honest "85 agents, one command, MIT" framing. Referral + some link value.
- **GitHub "awesome" lists** — the durable SEO win. Submit PRs to `awesome-claude-code`, `awesome-ai-agents`, `awesome-cursor`, `awesome-llm`, `awesome-ai-coding`. These pages rank for your exact head terms and pass lasting authority. Prioritize these — they're evergreen, unlike a HN spike.

**Tier 2 — newsletters & aggregators (sustained referral + links):**
- Dev newsletters that cover tooling (e.g., TLDR, Console.dev, Changelog Weekly) — submit the repo.
- Product Hunt launch (open-source dev tools do fine there; nofollow links but real traffic + social proof).
- Twitter/X and LinkedIn launch posts (this is why the OG/Twitter cards in Section 2.5 matter — they control how the share renders; without them, CTR craters).

**Tier 3 — content-driven, compounding:**
- The cluster articles (Section 4) on dev.to / Hashnode / Medium, each linking back with descriptive anchors.
- Answer relevant questions on Stack Overflow / GitHub Discussions / Reddit where "how do I add agents to Claude Code / Cursor" comes up, linking to the README quickstart when genuinely useful.

**Which matter most:** awesome-lists (durable, on-term authority) and the HN/Reddit launch (spike + the links that follow from it). Product Hunt and social are traffic, not much link equity. Do **not** buy links or spam directories — a penalty would cost more than the launch is worth, and it contradicts the honest positioning that's your differentiator.

**Anchor-text guidance:** vary it. Mix brand ("The Agency"), URL, and descriptive ("open-source AI agent library", "AI coding agents for Claude Code"). Never uniform exact-match — that pattern reads as manipulation.

---

## 6. Measurement baseline (so "traffic is up" means something)

Set these on launch day so you can attribute movement to rankings, not guess:

- **Google Search Console** (property for `https://gnaidu05.github.io/WWH/`): submit the sitemap; track impressions/clicks/avg-position for the primary + secondary keywords weekly. This is the source of truth for rankings.
- **Baseline snapshot now (all zero/near-zero):** record starting position for "claude code subagents", "ai agent library", "claude agents github", "ai coding specialists". Re-check every 2 weeks.
- **Referral vs. organic split** (GA4 or Plausible on the Pages site): at launch, expect ~90%+ referral (HN/Reddit). The signal to watch is the *organic* line starting to climb in weeks 4–12 — that's SEO working, distinct from the launch spike.
- **Repo signals as leading indicators:** stars, forks, and GitHub-search referrals correlate with (and precede) Google rankings for a repo. Track them, but report them as engagement, not as SEO wins.
- **Conversion, honestly defined:** the "conversion" here is repo clone / install / star, not a purchase. Tie ranking gains to installs (GitHub traffic → clones), not to a raw sessions number. Report movement over weeks, not a one-day launch blip.

Realistic timeline to state up front: **launch spike (referral) week 1; long-tail organic appearing weeks 4–8; head terms ("claude code subagents", "ai agent library") maturing months 3–6**, contingent on the awesome-list and launch backlinks landing.

---

### Priority order to execute (impact vs. effort)

1. **Now, high impact / low effort:** repo About description + Website field + topics (Section 3.1–3.2); README H1 rewrite (3.3); OG/Twitter tags + `og-cover.png` (2.5); title + meta description (2.1–2.2). Ship in one commit.
2. **Now, medium effort:** canonical/robots/sitemap + Search Console verify (2.3, 2.7); JSON-LD (2.6); lede rewrite (2.4).
3. **Launch day:** HN Show HN, Reddit, awesome-list PRs, Product Hunt, social posts (Section 5).
4. **Weeks 1–8:** publish cluster Articles 1 & 2, then the rest (Section 4); track in GSC (Section 6).

Every fix above ties to a mechanism — a crawl signal, a ranking factor, or launch-day CTR — and every number in it is the honest 85 / 16 / MIT / free.
