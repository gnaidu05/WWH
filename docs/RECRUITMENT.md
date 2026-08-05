# Fresher Recruitment Engine

An internal recruitment-operations module that tracks every fresher candidate's
application through a fixed hiring pipeline and advances each one only when its
stage gate is met.

Open **`recruitment.html`** for the recruiter console. It runs in demo mode on
sample data (persisted in your browser's localStorage) with no backend; in
production the same engine runs against the Supabase tables in
[`supabase/recruitment-schema.sql`](../supabase/recruitment-schema.sql).

## The unit of work: an application

One **application** = one candidate applied to one job. A candidate may have
several applications open across different jobs at once — each is tracked and
advanced independently (`unique (candidate_id, job_id)` in the schema), and one
application's status never leaks into another's.

## The pipeline

Every application moves through five stages, **in order, never skipping**:

| # | Stage | Meaning |
|---|-------|---------|
| 1 | Application | Candidate has applied. |
| 2 | Assessment | Invited to / has taken the screening assessment. |
| 3 | Interview | Scheduled for / has completed the interview round(s). |
| 4 | Interim Offer | Provisional offer extended, awaiting acceptance. |
| 5 | Letter of Intent | LOI issued — the terminal positive stage. |

An application that fails a gate moves to a **held** or **rejected** status
with the reason recorded (the engine refuses a hold or rejection without one).
It never silently disappears.

## Stage gates

Advancement is gated; the gate reads evidence on the application record, and
**missing evidence is never a pass** (a "completed" assessment with no recorded
score does not clear the gate).

| Transition | Gate |
|------------|------|
| Application → Assessment | Application form complete **and** eligibility met: degree, branch, graduation year, CGPA ≥ cutoff. |
| Assessment → Interview | Assessment completed **and** score ≥ cutoff. |
| Interview → Interim Offer | Every required round complete **and** each panel recommendation is `proceed`. |
| Interim Offer → LOI | Candidate accepted the interim offer **and** every required approval is recorded. |

**Issuing the LOI is final and irreversible.** It happens only through
`issueLoi()` with an explicit confirmation (the caller must pass the
application's own id), for a named application — never through `advance()`,
never as part of a batch, never as a side effect of a status query. The
console asks you to type the application id to confirm.

### Configurable thresholds

The specific numbers are **defaults, configurable per job** via
`job.criteria`; the engine's `DEFAULT_CRITERIA` is only the fallback. Confirm a
job's live criteria before relying on the defaults.

```js
criteria: {
  degrees: ["B.E.", "B.Tech", "M.Tech", "MCA"],
  branches: ["CSE", "IT", "ECE"],      // empty = any branch
  gradYears: [2025, 2026],
  minCgpa: 7.0,                        // 10-point scale
  assessmentCutoff: 65,                // percent
  requiredRounds: ["Technical", "HR"],
  requiredApprovals: ["HR Lead", "Engineering Head"],
}
```

## Files

| File | Role |
|------|------|
| `assets/js/recruitment-engine.js` | Pure pipeline logic — stages, gates, advance/hold/release/reject, explicit-only `issueLoi`, `batchAdvance` with an exact split, audit history, `summarize`. No DOM, no network. |
| `assets/js/recruitment-data.js` | Demo jobs and applications, including the trap cases (missing score, missing approval, one candidate with two applications). |
| `assets/js/recruitment-ui.js` | The console: summary tiles, filterable table, gate detail per application, actions. All candidate content is escaped before `innerHTML`. |
| `recruitment.html` | The internal console page (`noindex`; not linked from public navigation). |
| `supabase/recruitment-schema.sql` | Production tables + triggers that enforce the same rules server-side: one-step stage guard, mandatory hold/reject reasons, automatic stage-event audit log, recruiter-only RLS. |
| `scripts/test-recruitment.js` | Node test suite for the engine: `node scripts/test-recruitment.js`. |

## Batch operations report the exact split

"Advance all ready" advances each gate-met **active** application exactly one
stage and returns `{ advanced, notReady, excluded }`:

- **advanced** — moved one stage (with from/to),
- **notReady** — gate unmet, with every unmet reason listed,
- **excluded** — held/rejected applications, plus applications whose next stage
  is the LOI (those are reported as *ready for LOI* and must be issued
  individually, by name).

Every application in the batch appears in exactly one bucket, so a partial
success is always reportable precisely: "4 advanced, 4 held on unmet gates, 3
excluded — and why".

## Production notes

- Run `supabase/recruitment-schema.sql` after the base `supabase/schema.sql`.
- Access is restricted by RLS to signed-in users whose `profiles.role` is
  `Recruiter`. Nothing in these tables is publicly readable.
- The stage-order guard, the LOI preconditions and the audit log are enforced
  by database triggers, so a buggy or malicious client cannot skip a stage,
  drop a reason, or issue an LOI implicitly even if it bypasses the JS engine.
