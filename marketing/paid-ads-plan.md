# Paid Acquisition Plan — "The Agency" (Open-Source, MIT, Free)

**Author:** paid-ads-manager · **Date:** 2026-07-05
**Product:** The Agency — a free, MIT-licensed library of **85 handwritten AI specialist agents in 16 divisions**, installable into Claude Code, Cursor, Copilot, etc. with one command.
**Hook:** "Hire an entire company of AI specialists in about 60 seconds."
**Destinations:** Landing page https://gnaidu05.github.io/WWH/ · Repo https://github.com/gnaidu05/WWH

---

## 0. The honest answer first: should you spend at all?

**Recommendation: No paid spend yet. Go organic-first. Treat paid as a small, bounded experiment later — not the engine.**

Here's the reasoning I'd stake my budget on:

**There is no revenue, so there is no ROAS.** My entire discipline is built on spending money to make more money back and proving the ratio. This product has no purchase, no LTV, no payback period. The "conversion" is a repo star, an install, or a newsletter signup. Those have real value (distribution, social proof, a future audience) but they do not return dollars. That means **every dollar spent is pure sunk cost with no financial recovery** — the opposite of the situation paid ads are designed for.

**Free developer tools are won on trust and word-of-mouth, not bought impressions.** The audience — developers, indie hackers, AI builders already using an AI coding tool — is famously ad-resistant and famously responsive to peer signal: a Show HN, a Reddit thread in r/ClaudeAI or r/cursor, a tweet from someone they follow, a mention in a newsletter they already read. Organic distribution *is* the credibility. Paid can amplify a proven message but cannot manufacture the trust.

**You have no proven organic funnel yet.** My rule is: never scale — or even test paid against — a funnel that hasn't proven it converts organically. If organic visitors aren't turning into installs/stars, paid traffic (which is colder and more skeptical) will convert worse and just burn cash faster. **Fix organic conversion first; paid can only pour more water into a bucket you've already sealed.**

### What to do instead of spending (organic-first, do these first)
1. **Ship the launch surfaces:** Show HN, r/ClaudeAI, r/cursor, r/LocalLLaMA, r/SideProject, Product Hunt, and a launch thread on X. These are free and reach exactly this audience.
2. **Pitch newsletters for editorial (unpaid) coverage** before paying them — TLDR, Bytes, Console.dev, and similar routinely feature genuinely useful free dev tools for free.
3. **Instrument the funnel** (see Section 1 gate) so you can actually read what converts.
4. **Only after** organic shows a repeatable landing-page → install/star/signup conversion, consider the bounded paid test below to answer one specific question.

---

## 1. Tracking gate — do this BEFORE any dollar goes out

My first standard: **no spend without conversion tracking verified. I don't optimize toward a broken pixel.** For a repo/newsletter product this is harder than an e-commerce pixel because the "conversion" happens on GitHub and in a CLI, off your own domain. Verify all of this first:

- **Landing page → outbound click tracking.** Instrument clicks on the "Install" / "Star on GitHub" / "Copy install command" buttons on https://gnaidu05.github.io/WWH/ (Plausible/GoatCounter/PostHog — privacy-friendly, no cookie banner needed).
- **UTM discipline.** Every paid link carries `utm_source/medium/campaign/content` so you can separate paid traffic from organic in analytics and in the GitHub referrer panel.
- **GitHub traffic as ground truth.** Repo → Insights → Traffic shows referring sites and unique visitors/clones. Star count and clone count are your real signal. This is the "real revenue vs platform-reported" check: **trust GitHub's own referrer + star data over any ad platform's reported "conversions."**
- **Newsletter signup event** fires correctly (if a signup exists as a goal).

If a click can't be traced from ad → landing page → install/star/signup, **do not spend.** Bad data burns budget silently.

---

## IF a small test is worth running

Everything below is a **bounded experiment**, not a growth program. Total budget cap: **$400–$500, one time.** If it doesn't clear the bar, you stop and you've bought a real answer cheaply.

## 2. The one goal the test validates

> **Does paid traffic from a trusted developer channel convert to installs/stars/signups at all — or is this a purely organic product?**

That's it. One question. We are not trying to "scale acquisition." We are buying a yes/no answer: *can attention we pay for turn into action for a free OSS tool, at a cost per action low enough to ever justify more?* If yes, we learn the rough cost per install/star and which angle lands. If no, we've confirmed organic-only for ~$450 instead of finding out at $10k.

## 3. The single channel to test first

**Winner: one developer-newsletter sponsorship — TLDR (or Bytes / Console.dev) — a single primary-sponsor slot.**

Why this over the alternatives, matched to intent and how this audience buys:

- **The audience is already there, in a trusted context.** TLDR/Bytes readers are developers who opted in to hear about new dev tools. A sponsor slot borrows the newsletter's credibility — the closest a paid unit gets to the peer-signal that actually moves developers. That trust transfer is exactly what a free tool needs and what raw ad platforms can't provide.
- **One clean variable, one clean read.** A single send to a defined dev list gives an unambiguous cost-per-click and cost-per-star for a fixed spend. Easy to trace with a dedicated UTM + a vanity link.
- **No auction, no algorithm to fight.** Unlike self-serve ad platforms you're not paying to *find* the audience and *learn* the algorithm simultaneously — the list is pre-qualified.

**Realistic budget:** a smaller newsletter/section sponsorship in the **$250–$500** range for one send (rates vary; TLDR's largest lists cost more — pick a segment or a smaller reputable dev newsletter that fits the cap). Buy **one** send.

**Why not the others (this round):**
- **Reddit ads** are the strong *second* choice and cheaper to start — but as *ads* they sit next to organic posts the same audience trusts more, and CTR/quality is noisier. Better as a follow-up test, or better yet, post organically first (free) in r/ClaudeAI / r/cursor and see if the message lands before paying Reddit.
- **X ads** have weak targeting for this niche and reward engagement-bait over installs; a well-timed organic launch thread will outperform paid X for this product.

## 4. Ad creatives (matched to a newsletter sponsor slot)

Newsletter sponsor copy = short headline + 2–3 sentence body + one clear CTA. All three lead with the honest **85 agents** number. Do **not** inflate to 232.

**Creative A — the "instant team" angle (lead with the hook)**
- **Headline:** Hire an entire company of AI specialists in about 60 seconds
- **Body:** The Agency is a free, open-source library of 85 handwritten AI specialist agents across 16 divisions — from a paid-ads manager to a security reviewer. Drop them into Claude Code, Cursor, or Copilot with one command. MIT-licensed, no signup, no cost.
- **CTA:** Star it on GitHub →

**Creative B — the "specialist depth" angle**
- **Headline:** 85 specialist AI agents. One install command.
- **Body:** Stop prompting a generalist to be everything. The Agency gives your AI coding tool 85 handwritten specialists organized into 16 divisions, each with a real job and real standards. Free, open-source, works with Claude Code, Cursor, and Copilot.
- **CTA:** Install in 60 seconds →

**Creative C — the "free & open" angle (for the skeptical dev)**
- **Headline:** A free, open-source company of AI agents for your editor
- **Body:** 85 handwritten agents in 16 divisions, MIT-licensed, installable in one command into the AI tools you already use. No account, no paywall, no lock-in — just clone the roles and start building.
- **CTA:** See the repo →

*Test note:* one send can't A/B three creatives to significance. **Pick ONE** (I'd lead with **Creative A** — the hook is your strongest asset) as the primary. Hold B and C for a follow-up channel/send. This respects the rule: one clear variable, run to a real read — don't crown a winner off a single fluke.

## 5. Target metric, threshold, and hard kill criterion

Because there's no revenue, the target metric is **Cost Per Star/Install (CPI)** and secondarily **Cost Per Newsletter Signup**, read against GitHub's own traffic/star data — not the newsletter's reported clicks.

| Metric | Definition | Sensible threshold (test-pass) | Notes |
|---|---|---|---|
| **CTR on the slot** | clicks ÷ (approx) recipients | ≥ 0.5–1% | Below this, the message didn't land — a copy problem, not just a cost problem |
| **Landing → GitHub click** | outbound install/star clicks ÷ LP visits | ≥ 25% | Reads whether the LP converts paid (colder) traffic |
| **Cost per Star/Install (primary)** | spend ÷ new stars+installs attributable via UTM | **≤ ~$3 per star/install** to call it "paid can work" | For a free product, anything in low single digits is genuinely promising; there's no revenue to recover it, so the bar is "cheap enough to be a viable amplifier," not "profitable" |
| **Cost per signup** | spend ÷ attributable newsletter signups | ≤ ~$5 | Only if a signup goal exists |

- **Test-pass (paid is a viable amplifier):** CPI ≤ ~$3 AND the LP→GitHub click rate holds ≥ 25%. → Consider a second bounded test (a Reddit round, or a second newsletter) to confirm before any scaling. Scale only in steps, never a 10× overnight budget jump.
- **Inconclusive:** CPI $3–$8, or clicks came but stars didn't. → The channel works but the LP or the offer leaks. Fix conversion (hand to `conversion-optimizer`), don't spend more.
- **HARD KILL:** **CPI > $10, OR fewer than ~10 attributable stars/installs from the full send, OR LP→GitHub click < 10%.** Stop immediately, spend no more, and conclude **the product is organic-only.** That is a *successful* outcome of the experiment — you bought certainty for ~$450.

**Reality check:** cross-verify every claimed conversion against GitHub Insights (referrer + star delta during the send window). If the newsletter reports 500 clicks but GitHub shows 12 new referred visitors and zero star bump, **trust GitHub.** Platform-reported clicks are not installs.

## 6. What NOT to do (and why)

- **Don't run broad Google Search.** There is no meaningful high-intent search volume for a brand-new product nobody's searching for yet, and generic terms ("AI agents") are expensive, brand-unaware, and won't convert to installs of a specific free repo. You'd pay to educate cold strangers with no revenue to recover it.
- **Don't buy brand-unaware display/Meta audiences.** Wrong context, wrong intent; developers ignore display and this isn't an impulse-buy product.
- **Don't chase cheap CPMs or high CTR as the goal.** A cheap click that doesn't end in a star is a leak, not a win. The only number that matters is cost per real action, verified on GitHub.
- **Don't test three creatives in one send and pretend you learned which won.** One send = one primary creative. Multi-variable "tests" teach you nothing.
- **Don't scale a winner 10× overnight.** If the test passes, the next step is *one more bounded test*, not a budget blowout that tanks efficiency and teaches you nothing new.
- **Don't spend a dollar before Section 1's tracking gate is green.** No verified path from ad → star/signup = no spend.
- **Above all: don't let paid substitute for the organic launch.** For a free OSS dev tool, Show HN / Reddit / Product Hunt / a good X thread / earned newsletter coverage will almost certainly out-perform any paid dollar. Paid is, at most, a small amplifier you test *after* organic proves the message.

---

### Bottom line
Spend nothing yet. Launch organically and instrument the funnel. If organic proves the message converts, run **one ~$450 developer-newsletter send with one creative** to answer a single question — *can paid attention become installs for a free tool?* — with a ≤ $3/star pass bar and a > $10/star hard kill. Win or lose, you buy a real answer cheaply and never let a vanity metric talk you into funding an unprofitable, revenue-less funnel.
