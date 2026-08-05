#!/usr/bin/env node
/* Tests for the Fresher Recruitment Engine (assets/js/recruitment-engine.js).
 * Run: node scripts/test-recruitment.js — exits non-zero on any failure. */
"use strict";

const path = require("path");
const R = require(path.join(__dirname, "..", "assets", "js", "recruitment-engine.js"));
const { RECRUIT_JOBS, RECRUIT_APPS } = require(path.join(__dirname, "..", "assets", "js", "recruitment-data.js"));

let failures = 0;
function assert(cond, name) {
  if (cond) console.log("  ok  " + name);
  else { failures++; console.error("FAIL  " + name); }
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const jobsById = Object.fromEntries(RECRUIT_JOBS.map((j) => [j.id, j]));
const app = (id) => clone(RECRUIT_APPS.find((a) => a.id === id));

console.log("Stage order and gates");
{
  assert(R.STAGES.join(" > ") ===
    "Application > Assessment > Interview > Interim Offer > Letter of Intent",
    "five stages in the fixed order");

  // Eligible applicant clears the Application gate…
  const a = app("APP-001");
  assert(R.gateCheck(a, jobsById[a.jobId]).met, "APP-001 meets the eligibility gate");
  const res = R.advance(a, jobsById[a.jobId]);
  assert(res.ok && a.stage === "Assessment", "APP-001 advances exactly one stage, to Assessment");
  assert(a.history.some((h) => h.event === "advanced" && h.from === "Application" && h.to === "Assessment"),
    "the advance is recorded in the history");

  // …but cannot advance again: no assessment evidence yet.
  const res2 = R.advance(a, jobsById[a.jobId]);
  assert(!res2.ok && a.stage === "Assessment", "no skipping: a second advance without evidence is refused");

  // Incomplete application form fails the first gate.
  const b = app("APP-002");
  const g = R.gateCheck(b, jobsById[b.jobId]);
  assert(!g.met && g.reasons.some((r) => /incomplete/i.test(r)), "incomplete form blocks the eligibility gate");
}

console.log("Missing evidence is never a pass");
{
  // 'Completed' assessment with no recorded score must not advance.
  const a = app("APP-006");
  const g = R.gateCheck(a, jobsById[a.jobId]);
  assert(!g.met && g.reasons.some((r) => /score is not recorded/i.test(r)),
    "completed-but-unscored assessment does not clear the gate");

  // Below-cutoff score must not advance.
  const b = app("APP-005");
  assert(!R.advance(b, jobsById[b.jobId]).ok, "score below cutoff is refused");

  // Accepted offer with a missing approval must not reach LOI.
  const c = app("APP-008");
  const gc = R.gateCheck(c, jobsById[c.jobId]);
  assert(!gc.met && gc.reasons.some((r) => /Engineering Head/.test(r)),
    "missing approval blocks the LOI gate even though the offer is accepted");
  assert(!R.issueLoi(c, jobsById[c.jobId], { confirm: c.id }).ok,
    "issueLoi refuses when an approval is missing");
}

console.log("LOI is explicit-only, final, and never batched");
{
  const a = app("APP-009"); // fully ready: accepted + both approvals
  assert(R.gateCheck(a, jobsById[a.jobId]).met, "APP-009's LOI gate is met");
  assert(!R.advance(a, jobsById[a.jobId]).ok, "advance() refuses to enter Letter of Intent");
  assert(!R.issueLoi(a, jobsById[a.jobId], {}).ok, "issueLoi without confirmation is refused");
  assert(!R.issueLoi(a, jobsById[a.jobId], { confirm: "APP-999" }).ok, "issueLoi with the wrong id is refused");
  const res = R.issueLoi(a, jobsById[a.jobId], { confirm: "APP-009", issuedBy: "test" });
  assert(res.ok && a.stage === "Letter of Intent" && a.status === R.STATUS.LOI_ISSUED,
    "explicit issueLoi moves the application to the terminal stage");
  assert(!R.issueLoi(a, jobsById[a.jobId], { confirm: "APP-009" }).ok, "an issued LOI cannot be issued again");
  assert(!R.reject(a, "test").ok, "an issued LOI cannot be flipped to rejected here");

  // From an earlier stage, issueLoi is refused outright.
  const b = app("APP-007");
  assert(!R.issueLoi(b, jobsById[b.jobId], { confirm: b.id }).ok, "issueLoi from Interview is refused");
}

console.log("Hold / release / reject record their reasons");
{
  const a = app("APP-003");
  assert(!R.hold(a, "").ok, "a hold without a reason is refused");
  assert(R.hold(a, "Awaiting original marksheet").ok && a.status === R.STATUS.HELD, "hold with a reason works");
  assert(!R.advance(a, jobsById[a.jobId]).ok, "a held application cannot advance");
  assert(R.release(a).ok && a.status === R.STATUS.ACTIVE && a.statusReason === null, "release restores active");
  assert(!R.reject(a, "").ok, "a rejection without a reason is refused");
  assert(R.reject(a, "Withdrew candidacy").ok && a.statusReason === "Withdrew candidacy", "reject records its reason");
  assert(a.history.filter((h) => ["held", "released", "rejected"].includes(h.event)).length === 3,
    "hold, release and reject are all in the audit history");
}

console.log("Applications are independent per candidate+job");
{
  // Ananya Sharma has APP-003 (SWE, Assessment) and APP-004 (QA, Application).
  const swe = app("APP-003"), qa = app("APP-004");
  assert(swe.candidateId === qa.candidateId && swe.jobId !== qa.jobId, "same candidate, two jobs");
  const res = R.advance(swe, jobsById[swe.jobId]); // 82 clears the 65 cutoff
  assert(res.ok && swe.stage === "Interview", "the SWE application advances on its own evidence");
  assert(qa.stage === "Application", "the QA application is untouched — no status leaks across applications");
}

console.log("Batch advance reports the exact split and never issues LOIs");
{
  const apps = clone(RECRUIT_APPS);
  const out = R.batchAdvance(apps, jobsById);
  const ids = (xs) => xs.map((x) => x.id).sort().join(",");
  // Ready: APP-001 (eligibility), APP-003 (82 ≥ 65), APP-004 (eligibility), APP-007 (both rounds proceed)
  assert(ids(out.advanced) === "APP-001,APP-003,APP-004,APP-007",
    "advanced: exactly the four gate-met applications (" + ids(out.advanced) + ")");
  // Not ready: APP-002 (incomplete form), APP-005 (below cutoff), APP-006 (no score), APP-008 (missing approval)
  assert(ids(out.notReady) === "APP-002,APP-005,APP-006,APP-008",
    "not ready: the four gate-unmet applications, each with reasons");
  assert(out.notReady.every((x) => x.reasons && x.reasons.length), "every not-ready entry carries its reasons");
  // Excluded: APP-009 (LOI-gated — explicit only), APP-010 (held), APP-011 (rejected)
  assert(ids(out.excluded) === "APP-009,APP-010,APP-011",
    "excluded: the LOI-ready, held and rejected applications");
  assert(apps.find((a) => a.id === "APP-009").stage === "Interim Offer",
    "batch never advances an application into Letter of Intent");
  assert(out.advanced.length + out.notReady.length + out.excluded.length === apps.length,
    "the split accounts for every application");
}

console.log("Summary counts match the records");
{
  const s = R.summarize(RECRUIT_APPS);
  assert(s.total === 11 && s.held === 1 && s.rejected === 1 && s.loiIssued === 0,
    "totals: 11 applications, 1 held, 1 rejected, 0 LOIs issued");
  assert(s.byStage["Application"] === 4 && s.byStage["Assessment"] === 3 &&
         s.byStage["Interview"] === 2 && s.byStage["Interim Offer"] === 2 &&
         s.byStage["Letter of Intent"] === 0,
    "per-stage counts match the dataset");
}

console.log("");
if (failures) { console.error(failures + " failure(s)."); process.exit(1); }
console.log("All recruitment engine tests passed.");
