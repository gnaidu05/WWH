# The Agency

**Hire an entire company of AI specialists in about 60 seconds — for free.**

Not freelancers. Not one vague "act as a developer" chatbot. A full AI agency:
engineers, designers, marketers, sales, security, finance, testing, game
developers, academic researchers, even a mapping team. Each one a focused,
handwritten specialist that plugs straight into the AI coding tool you already
use.

The trick is simple. A generic prompt — *"act as a backend developer"* — gives
you a generic answer: the blandest, safest, most averaged-out version of
everything. These agents do the opposite. Every agent file pins down **who it
is**, **what it specializes in**, **the process it follows**, and **the concrete
deliverable it owes you** — before you say a word. Same model, wildly better
results, because the role is nailed down up front. You stop being a prompt
writer and start being the person who runs the team.

- **MIT licensed**, completely free.
- **80+ specialists across 16 divisions**, organized like a real company.
- **One command to install.** Drops straight into your `agents` folder.
- **Portable.** Converts to Claude Code, Cursor, Copilot, Codex, Gemini,
  Windsurf, Aider, and more — your team comes with you.

---

## Quick start

```bash
git clone <this-repo> the-agency && cd the-agency

# Install every agent for Claude Code (project scope):
scripts/install.sh

# ...or for another tool:
scripts/install.sh --tool cursor
scripts/install.sh --tool copilot

# ...or just one or two divisions:
scripts/install.sh --division engineering,security

# See everything available:
scripts/install.sh --list
```

From that moment you just talk to them in plain English:

> *"Use the **backend-architect** to design this API."*
> *"Have the **reality-checker** tell me if this is actually ready to ship."*
> *"**agents-orchestrator**: build and ship this landing page."*

---

## Don't install all of them and freeze

The trap with a big roster is paralysis: people install everything, get
overwhelmed, and use none of it. **Forget the full roster.** Start with the
squad below, get genuinely fluent with five to seven agents, and only pull in a
new specialist when a real job calls for it.

### The starter squad

| Agent | Division | Why it earns its place |
|-------|----------|------------------------|
| [`rapid-prototyper`](.claude/agents/engineering/rapid-prototyper.md) | Engineering | Shortest path from "what if" to something you can click. |
| [`backend-architect`](.claude/agents/engineering/backend-architect.md) | Engineering | Real database, real APIs, infrastructure that won't fall over. |
| [`ai-engineer`](.claude/agents/data-ai/ai-engineer.md) | Data & AI | Intelligent features baked into the product, not bolted on. |
| [`whimsy-injector`](.claude/agents/design/whimsy-injector.md) | Design | The small unexpected moments that make a product feel human. |
| [`growth-hacker`](.claude/agents/marketing/growth-hacker.md) | Marketing | Viral loops and funnels as deliberate experiments, not guesses. |
| [`content-creator`](.claude/agents/marketing/content-creator.md) | Marketing | The editorial engine: calendar, copy, storytelling everywhere. |
| [`reality-checker`](.claude/agents/testing/reality-checker.md) | Testing & QA | Professional skepticism. Demands proof before it says "ship it." |

With just the first three you can take a raw idea to a real working
application. The next three make it land. The last one saves you from yourself.

### The real unlock: the orchestrator

The best part isn't using these one at a time — it's making them work together.
[`agents-orchestrator`](.claude/agents/agents-orchestrator.md) is the agent
whose entire job is to run the other agents. Hand it a goal instead of a task
list:

> *"Build and ship this landing page."*

It breaks the work into stages, calls the `backend-architect` for the
foundation, the `frontend-specialist` for the interface, the `whimsy-injector`
to make it delightful, and the `reality-checker` to refuse to sign off until it
genuinely works. You stop being the bottleneck and become the founder who set
the goal and let the company deliver it.

---

## The 16 divisions

Every agent lives in `.claude/agents/<division>/<name>.md`. Open any of them —
it's a plain text file. Read exactly how it thinks and rewrite it to match how
you work. It's not a black box; it's a starting point you own.

| Division | Directory | What they do |
|----------|-----------|--------------|
| Engineering | [`engineering/`](.claude/agents/engineering/) | Backend, frontend, mobile, APIs, prototyping, realtime |
| Design | [`design/`](.claude/agents/design/) | UI, UX research, brand, design systems, delight |
| Product | [`product/`](.claude/agents/product/) | Strategy, PM, prioritization, stories, roadmaps |
| Marketing | [`marketing/`](.claude/agents/marketing/) | Growth, content, SEO, social, paid, email |
| Sales | [`sales/`](.claude/agents/sales/) | GTM strategy, outbound, solutions, CRM, closing |
| Security | [`security/`](.claude/agents/security/) | Architecture, pentest, appsec, IR, compliance, threat modeling |
| Finance | [`finance/`](.claude/agents/finance/) | Modeling, unit economics, fundraising, budgeting, pricing |
| Testing & QA | [`testing/`](.claude/agents/testing/) | Strategy, automation, performance, a11y, reality checks |
| Game Development | [`game-development/`](.claude/agents/game-development/) | Design, gameplay, levels, narrative, economy |
| Data & AI | [`data-ai/`](.claude/agents/data-ai/) | AI features, ML, data eng, data science, prompts, MLOps |
| DevOps & Infra | [`devops/`](.claude/agents/devops/) | CI/CD, cloud, SRE, platform, releases |
| Operations | [`operations/`](.claude/agents/operations/) | Ops, people, legal, support, analytics |
| Research | [`research/`](.claude/agents/research/) | Research science, literature, quant, academic writing, experiments |
| Mapping & GIS | [`mapping/`](.claude/agents/mapping/) | Spatial analysis, cartography, geospatial eng, remote sensing, routing |
| Content & Editorial | [`content/`](.claude/agents/content/) | Editorial, copy, tech writing, video scripts, docs |
| Growth | [`growth/`](.claude/agents/growth/) | Growth strategy, CRO, retention, referral, lifecycle |

---

## How an agent is built

Each specialist is a Markdown file with YAML frontmatter and a persona body that
answers four questions before you type anything. See
[`docs/AGENT_TEMPLATE.md`](docs/AGENT_TEMPLATE.md) for the full spec.

```markdown
---
name: backend-architect
division: Engineering
description: Use for scalable backend systems — database design, APIs, and cloud
  infrastructure that must hold up under real load.
tools: Read, Grep, Glob, Edit, Write, Bash
---

# Backend Architect — Senior Backend & Systems Architect
## Who I am ...
## What I specialize in ...
## My workflow ...
## Deliverables ...          <- the contract
## Standards & quality bar ...
## How I collaborate ...     <- what lets the orchestrator chain specialists
## Anti-patterns I refuse ...
```

## Make it yours

- **Read one before you run it.** Open the file, see how it thinks.
- **Rewrite freely.** Change the standards, the deliverables, the refusals to
  match your workflow.
- **Add your own.** Follow the template, drop a new `.md` into the right
  division, re-run `scripts/install.sh`.
- **Contributions welcome** — see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE). Free to use, modify, and distribute.
