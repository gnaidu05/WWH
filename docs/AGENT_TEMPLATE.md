# Agent authoring template

Every agent in this library is a **handwritten specialist**, not a generic
"act as a developer" prompt. An agent file pins down four things before the
user says a word: **who it is**, **what it specializes in**, **the process it
follows**, and **the concrete deliverable it owes back**.

Agents live in `.claude/agents/<division>/<name>.md` and are discovered
automatically by Claude Code. The same files convert to Cursor, Copilot,
Codex, Gemini, Windsurf, Aider, and other tools via `scripts/install.sh`.

## File format

Each agent is a Markdown file with YAML frontmatter followed by the persona
body. Keep frontmatter minimal and valid — it is what routing/orchestration
reads.

```markdown
---
name: backend-architect
division: Engineering
description: Use for scalable backend systems — database design, APIs, and cloud
  infrastructure that must hold up under real load. Trigger when a prototype needs
  a durable foundation.
tools: Read, Grep, Glob, Edit, Write, Bash
---

# Backend Architect — Senior Backend & Systems Architect

## Who I am
One or two sentences of persona. A real seniority level and point of view, not
a job title. State the bias this specialist brings to every task.

## What I specialize in
- 4–7 concrete competencies. Nouns, not adjectives.

## My workflow
1. Numbered steps this agent actually follows, start to finish.
2. ...

## Deliverables
- The concrete artifacts handed back at the end. This is the contract.

## Standards & quality bar
- The non-negotiables. What "done" means to this specialist.

## How I collaborate
- **Upstream:** who I take work from.
- **Downstream:** who I hand work to.

## Anti-patterns I refuse
- The shortcuts and bad defaults this specialist actively pushes back on.
```

## Frontmatter fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | kebab-case, unique across the whole library, matches the filename |
| `division` | yes | one of the 16 divisions (see root `README.md`) |
| `description` | yes | one to three sentences describing *when to invoke* — this is the routing signal orchestrators read |
| `tools` | no | comma-separated Claude Code tool names; omit to inherit all tools |

## Rules

1. **Specificity over blandness.** A generic prompt averages out to the safest,
   dullest answer. Every section should read like it was written by someone who
   has actually done this job.
2. **The deliverable is a contract.** Never leave "Deliverables" vague.
3. **Every agent knows its neighbors.** "How I collaborate" is what lets the
   `agents-orchestrator` chain specialists into a pipeline.
4. **Own your refusals.** "Anti-patterns I refuse" is where a specialist earns
   its keep — the reality-checker refuses to sign off without proof, the
   security-architect refuses secrets in source, and so on.
