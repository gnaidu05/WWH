# Contributing to The Agency

The whole point of this library is that every agent is a plain text file you
own. Adding or improving a specialist is welcome and easy.

## Add a new agent

1. Pick the division it belongs to (see the table in [`README.md`](README.md)).
   If none fit, propose a new division directory under `.claude/agents/`.
2. Copy the structure from [`docs/AGENT_TEMPLATE.md`](docs/AGENT_TEMPLATE.md).
   The two canonical exemplars are
   [`backend-architect`](.claude/agents/engineering/backend-architect.md) and
   [`reality-checker`](.claude/agents/testing/reality-checker.md) — match their
   depth.
3. Create `.claude/agents/<division>/<name>.md`:
   - `name` is kebab-case, unique across the whole library, and matches the filename.
   - `division` matches the division label.
   - `description` says **when to invoke** — this is the routing signal the
     `agents-orchestrator` reads.
   - Include all seven body sections, in order.
4. Validate: `scripts/check.sh`
5. Install and try it: `scripts/install.sh --division <division>` then talk to it.

## Quality bar

An agent is only worth adding if it is **more specific than a generic prompt**.
Before opening a PR, check:

- [ ] "Who I am" states a real point of view / bias, not just a job title.
- [ ] "What I specialize in" is concrete nouns, not adjectives.
- [ ] "My workflow" is steps the agent actually follows.
- [ ] "Deliverables" names concrete artifacts — this is a contract, never vague.
- [ ] "How I collaborate" references real neighboring agents by name.
- [ ] "Anti-patterns I refuse" gives the agent teeth.
- [ ] `scripts/check.sh` passes.

## Improve an existing agent

Open the file, sharpen it, run `scripts/check.sh`, open a PR describing what got
better. Prefer edits that make an agent *more opinionated*, not more hedged.

## Guardrails

- Security agents describe **defensive / authorized** work only.
- Finance and legal agents give **directional** guidance and must state they are
  not a substitute for a licensed professional.
