# The Agency — Launch Email Program

**Product:** The Agency — an open-source library of 85 handwritten AI specialist agents across 16 divisions. One command installs them into Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Aider and more. MIT licensed, free.

**Hook:** Hire an entire company of AI specialists in about 60 seconds.

**Destinations:**
- Landing page: https://gnaidu05.github.io/WWH/
- Repo: https://github.com/gnaidu05/WWH

**Voice:** confident, technical, dry. No hype-bro clichés, no fake urgency, no exclamation-point spam.

---

## 1. Opt-in / Lead Magnet Mechanic

**The give:** email address (single field — email only, no name required; every field cut lifts conversion and we don't need the name to send).

**The get:** the **Starter Squad Cheat Sheet** — a one-page PDF covering the 7 starter agents (rapid-prototyper, backend-architect, ai-engineer, whimsy-injector, growth-hacker, content-creator, reality-checker), what each one does, and the copy-paste lines to put each to work in your AI coding tool.

**Where the form lives:** inline on the landing page (https://gnaidu05.github.io/WWH/) — one email field, one button labeled "Get the cheat sheet." A second, secondary form sits in the repo README so people who arrive via GitHub can opt in without leaving.

**Mechanic:** single opt-in with a confirmation-plus-delivery first email (e1). The cheat sheet link is a hosted static asset — no gated download wall, the email itself delivers it. This keeps the list clean (real inboxes only, because delivery happens by email) without adding double-opt-in friction that costs us confirmed subscribers.

**Deliverability note (do this before any volume goes out):**
- SPF, DKIM, and DMARC verified on the sending domain — no send at volume until all three pass.
- Warm the sending domain if it's new: start with the most engaged openers, ramp volume over days.
- List hygiene: suppress hard bounces immediately; suppress anyone with zero opens across the full sequence from future broadcasts.
- Plain-text-friendly HTML, real reply-to address, visible one-click unsubscribe in every email. No image-only emails, no link shorteners (they trip spam filters and hurt reputation).

---

## 2. Onboarding Sequence (5 emails)

Each email has one primary CTA. Timing and the single metric that matters are noted per email and summarized in section 4.

---

### Email 1 — Welcome + deliver the cheat sheet
**Trigger:** immediately on opt-in.
**Primary metric:** cheat-sheet click-through (did they open the thing they asked for?).

**Subject:** Your Starter Squad cheat sheet is inside
**Preview:** 7 agents, what each does, and the lines to put them to work.

**Body:**

You asked for the cheat sheet — here it is.

**→ Open the Starter Squad Cheat Sheet**
https://gnaidu05.github.io/WWH/

One page. The 7 starter agents, what each one specializes in, and a copy-paste line to put each one to work in whatever AI coding tool you already use.

The seven:

- **rapid-prototyper** — turns an idea into a running scaffold, fast.
- **backend-architect** — data models, APIs, and the boring-on-purpose decisions that don't fall over later.
- **ai-engineer** — LLM features, retrieval, evals — the model plumbing.
- **whimsy-injector** — the detail that makes people screenshot your product.
- **growth-hacker** — activation and retention loops worth building.
- **content-creator** — copy and content that sound like a human wrote them.
- **reality-checker** — the one that tells you your demo actually doesn't work yet.

That's the starter squad. There are 85 agents in total across 16 divisions, but start here — seven is enough to feel the difference.

Over the next few days I'll show you how to install them (about 60 seconds), watch the squad handle a real build, and hand a whole goal to the orchestrator instead of micromanaging each agent.

For now: open the cheat sheet and pick the one agent whose job you most wish you could hand off today.

— The Agency

*Open-source, MIT licensed, free. Repo: https://github.com/gnaidu05/WWH*

---

### Email 2 — Install in 60 seconds
**Trigger:** 1 day after e1.
**Primary metric:** click-through to repo / install instructions.

**Subject:** Install the whole company in about 60 seconds
**Preview:** One command. Works with Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Aider.

**Body:**

The cheat sheet tells you who the agents are. This tells you how to hire them.

It's one command:

`scripts/install.sh`

That drops the agents into the AI coding tool you already run — Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Aider, and more. No new app to learn, no account, no key. The agents live alongside your existing setup and you call them where you already work.

**→ Install instructions in the repo**
https://github.com/gnaidu05/WWH

What "installed" actually means: each agent is a handwritten spec your tool can read — who it is, what it specializes in, its workflow, and the concrete deliverable it owes back. Not a vague persona prompt. A job description with a defined output.

Start with the seven from the cheat sheet. You don't need all 85 on day one.

If you hit anything, reply to this email — it's a real inbox.

— The Agency

*MIT licensed, free. Star the repo if it earns it: https://github.com/gnaidu05/WWH*

---

### Email 3 — The starter squad in action (a real mini build)
**Trigger:** 2 days after e2.
**Primary metric:** click-through to landing page / repo (intent to try the flow).

**Subject:** Watch four agents ship a feature without you touching the middle
**Preview:** A mini build, agent by agent — prototype to reality check.

**Body:**

Here's the squad doing actual work. Say you want to ship a "save for later" feature over a weekend.

**rapid-prototyper** stands up a working scaffold — the screen, the button, the wiring — so there's something real to react to instead of a doc.

**backend-architect** takes the scaffold and makes it hold: the data model for saved items, the API, and the decisions that keep it from falling over when you have more than three users.

**whimsy-injector** adds the one touch — the tiny animation when something gets saved — that makes it feel finished instead of functional.

**reality-checker** then does the least fun and most valuable job: it tells you the empty state is broken and the save silently fails when you're logged out. Better it says that than your first user.

Four agents, one handoff chain, and you stayed at the level of decisions instead of typing every line. Each agent knew its job because its job is written down — a spec, a workflow, and a deliverable it hands to the next one.

**→ Try the same chain on something you're building**
https://gnaidu05.github.io/WWH/

Pick a feature you've been putting off. Run it through those four in order. See how far it gets before you have to step in.

— The Agency

---

### Email 4 — The orchestrator: hand it a goal
**Trigger:** 2 days after e3.
**Primary metric:** click-through to repo (advanced-usage intent).

**Subject:** Stop assigning tasks. Hand over the goal.
**Preview:** The agents-orchestrator runs the others so you don't have to.

**Body:**

By now you've called individual agents. Here's the part that changes how you work.

You don't have to route the work yourself. There's an **agents-orchestrator** whose whole job is running the other agents — reading a goal, deciding which specialists it needs, and sequencing the handoffs.

The difference:

- **Without it:** you call rapid-prototyper, read the output, decide backend-architect goes next, call it, then remember reality-checker should look before you ship. You're the project manager.
- **With it:** you say "build and sanity-check a save-for-later feature," and the orchestrator picks the agents, orders them, and passes each one's deliverable to the next. You review the result, not every step.

It works because every agent owes a defined deliverable. The orchestrator can chain them precisely because each one's output is specified, not improvised.

**→ See the orchestrator in the repo**
https://github.com/gnaidu05/WWH

Give it a goal you'd normally break into five tickets. Watch it do the breaking-down.

— The Agency

*All 85 agents, 16 divisions, MIT licensed: https://github.com/gnaidu05/WWH*

---

### Email 5 — Make it yours + star / contribute
**Trigger:** 3 days after e4.
**Primary metric:** GitHub stars / repo click-through (the whole sequence's conversion goal).

**Subject:** These are yours to edit — that's the point
**Preview:** Open source, MIT, 85 agents. Fork one, fix one, add your own.

**Body:**

One thing that separates The Agency from a closed AI product: the agents are plain, handwritten specs, and they're yours.

Don't like how backend-architect makes a call? Edit it. Wish there were an agent for your exact stack? Write one — copy the shape of an existing spec: who it is, what it specializes in, its workflow, the deliverable it owes. That's the whole format.

There are 85 agents across 16 divisions today. Every one of them started as someone deciding a role was worth writing down. The next one can be yours.

Three ways to make this stick:

1. **Star the repo** so you can find it again and so it reaches the next builder who needs it.
2. **Open an issue** if an agent gave you a bad deliverable — that's how the specs get sharper.
3. **Send a PR** with an agent you wrote or a fix to one you use.

**→ Star it and browse all 85**
https://github.com/gnaidu05/WWH

It's MIT licensed and free. The only thing it costs is the star, and only if it earned one.

— The Agency

---

## 3. Launch-Day Broadcast (to existing list)

**Segment:** entire existing engaged list (openers within the last 90 days). Suppress unengaged 90-day+ dormants from this send to protect reputation on launch day — re-engage them separately later.
**Primary metric:** click-through to repo + installs.

**Subject:** Hire an entire company of AI specialists in about 60 seconds
**Preview:** 85 handwritten agents, one install command, MIT licensed. It's live.

**Body:**

It's live.

**The Agency** is an open-source library of 85 AI specialist agents — a rapid-prototyper, a backend-architect, an ai-engineer, a growth-hacker, a reality-checker, and 80 more across 16 divisions. Each one is a handwritten spec: who it is, what it specializes in, how it works, and the concrete deliverable it owes back.

One command installs the whole company into the AI coding tool you already use — Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Aider, and more:

`scripts/install.sh`

Start with the seven-agent starter squad, hand a whole goal to the orchestrator, or browse all 85 and pull the ones you need.

No account. No key. No catch. MIT licensed and free.

**→ Install it / star the repo**
https://github.com/gnaidu05/WWH

**→ See it first**
https://gnaidu05.github.io/WWH/

That's 85 agents, not 232, not a marketing number — the count of specs actually written and shipped. Go put a few to work.

— The Agency

---

## 4. Segmentation + Timing

**Sequence entry:** everyone who opts in via the cheat-sheet form enters at e1 immediately. The onboarding sequence and the launch broadcast are separate streams — a new opt-in during launch week gets the onboarding sequence, not the broadcast, to avoid double-messaging.

**Timing (from opt-in):**

| Email | Send delay | Trigger | Primary metric |
|-------|-----------|---------|----------------|
| e1 Welcome + cheat sheet | immediate | on opt-in | cheat-sheet click-through |
| e2 Install in 60s | +1 day | after e1 | click to repo / install |
| e3 Squad in action | +2 days (day 3) | after e2 | click to landing/repo |
| e4 Orchestrator | +2 days (day 5) | after e3 | click to repo |
| e5 Make it yours + star | +3 days (day 8) | after e4 | GitHub stars / repo click |

**Segmentation rules:**
- **Engagement branch:** anyone who has clicked through to the repo by e3 is tagged "activated" — they can skip nothing, but they're the priority segment for any future contributor/PR asks and retargeting audiences.
- **Non-openers:** subscribers who don't open e1 or e2 get e3 re-sent once with a fresh subject after 24 hours, then are held from further sends until they re-engage — protects sender reputation, no repeated blasting into dead inboxes.
- **Suppression:** hard bounces suppressed immediately; anyone who reads the full sequence with zero clicks is suppressed from future broadcasts (kept for a one-time win-back only).
- **Launch broadcast audience:** existing engaged list only (90-day openers). Dormant 90-day+ contacts excluded from launch day and handled in a separate low-volume re-engagement send.

**Guardrails (hard limits, watched on every send):**
- Unsubscribe rate above 0.5% on any single email → pause and review that email's targeting and subject.
- Spam-complaint rate above 0.1% → stop the stream, audit list source and authentication before resuming.
- These override open/click goals. A win on opens that spikes complaints is a loss.

**What success is:** not opens. Success is click-to-repo and installs/stars per recipient across the sequence, with unsubscribe and complaint rates inside the guardrails above.
