/* Kitaab — Fresher Recruitment Engine (core logic)
 *
 * Tracks one APPLICATION (one candidate applied to one job) through a fixed
 * five-stage pipeline and advances it only when the stage gate is met:
 *
 *   Application → Assessment → Interview → Interim Offer → Letter of Intent
 *
 * Rules enforced here, not in the UI:
 *   - Stages move in order and never skip.
 *   - Every transition is gated; an application that fails a gate is HELD or
 *     REJECTED with the reason recorded — it never silently disappears.
 *   - Issuing the LOI is the final, irreversible step. It only happens through
 *     issueLoi() with an explicit confirmation of the application id — never
 *     through advance() or a batch operation.
 *   - Every change is appended to the application's history (audit trail).
 *
 * Thresholds (CGPA cutoff, assessment cutoff, required rounds/approvals) are
 * configurable per job via job.criteria; DEFAULT_CRITERIA is the fallback.
 *
 * Pure module: no DOM, no network. Loaded in the browser (window.RECRUIT) and
 * in Node for tests (module.exports).
 */
(function (root) {
  "use strict";

  const STAGES = [
    "Application",
    "Assessment",
    "Interview",
    "Interim Offer",
    "Letter of Intent",
  ];

  const STATUS = {
    ACTIVE: "active",     // moving through the pipeline
    HELD: "held",         // paused at its stage with a recorded reason
    REJECTED: "rejected", // out of the pipeline with a recorded reason
    LOI_ISSUED: "loi_issued", // terminal positive state
  };

  // Configurable defaults — confirm against the live criteria (job.criteria)
  // before relying on them; every gate reads the job's own values first.
  const DEFAULT_CRITERIA = {
    degrees: ["B.E.", "B.Tech", "M.Tech", "MCA", "B.Sc", "M.Sc"],
    branches: [],            // empty = any branch
    gradYears: [2025, 2026],
    minCgpa: 7.0,            // on a 10-point scale
    assessmentCutoff: 65,    // percent
    requiredRounds: ["Technical", "HR"],
    requiredApprovals: ["HR Lead", "Business Head"],
  };

  const nowIso = () => new Date().toISOString();

  function criteriaFor(job) {
    return Object.assign({}, DEFAULT_CRITERIA, (job && job.criteria) || {});
  }

  function stageIndex(stage) {
    const i = STAGES.indexOf(stage);
    if (i === -1) throw new Error("Unknown stage: " + stage);
    return i;
  }

  function nextStage(stage) {
    const i = stageIndex(stage);
    return i < STAGES.length - 1 ? STAGES[i + 1] : null;
  }

  function record(app, event, detail) {
    app.history = app.history || [];
    app.history.push(Object.assign({ at: (detail && detail.at) || nowIso(), event }, detail || {}));
  }

  // ---- Gate evaluation --------------------------------------------------
  // Returns { next, met, reasons } for the transition OUT of app.stage.
  // reasons lists every unmet requirement (empty when met). Missing evidence
  // (no score recorded, no approval list) is an unmet reason, never a pass.
  function gateCheck(app, job) {
    const c = criteriaFor(job);
    const next = nextStage(app.stage);
    const reasons = [];

    if (!next) return { next: null, met: false, reasons: ["Already at the terminal stage"] };

    if (app.stage === "Application") {
      const p = app.profile || {};
      if (!p.applicationComplete) reasons.push("Application form is incomplete");
      if (c.degrees.length && !c.degrees.includes(p.degree)) {
        reasons.push("Degree '" + (p.degree || "not recorded") + "' is not in the eligible list (" + c.degrees.join(", ") + ")");
      }
      if (c.branches.length && !c.branches.includes(p.branch)) {
        reasons.push("Branch '" + (p.branch || "not recorded") + "' is not in the eligible list (" + c.branches.join(", ") + ")");
      }
      if (c.gradYears.length && !c.gradYears.includes(p.gradYear)) {
        reasons.push("Graduation year " + (p.gradYear || "not recorded") + " is outside the eligible batch (" + c.gradYears.join(", ") + ")");
      }
      if (typeof p.cgpa !== "number") reasons.push("CGPA is not recorded");
      else if (p.cgpa < c.minCgpa) reasons.push("CGPA " + p.cgpa + " is below the cutoff of " + c.minCgpa);

    } else if (app.stage === "Assessment") {
      const a = app.assessment || {};
      if (!a.completedAt) reasons.push("Assessment has not been completed");
      if (typeof a.score !== "number") reasons.push("Assessment score is not recorded");
      else if (a.score < c.assessmentCutoff) {
        reasons.push("Assessment score " + a.score + " is below the cutoff of " + c.assessmentCutoff);
      }

    } else if (app.stage === "Interview") {
      const rounds = (app.interview && app.interview.rounds) || [];
      for (const name of c.requiredRounds) {
        const r = rounds.find((x) => x.name === name);
        if (!r) reasons.push("Required round '" + name + "' has not been scheduled");
        else if (!r.completed) reasons.push("Round '" + name + "' is not complete");
        else if (r.recommendation !== "proceed") {
          reasons.push("Round '" + name + "' panel recommendation is '" + (r.recommendation || "not recorded") + "', not 'proceed'");
        }
      }

    } else if (app.stage === "Interim Offer") {
      const o = app.offer || {};
      if (!o.extendedAt) reasons.push("Interim offer has not been extended");
      if (o.accepted !== true) reasons.push("Candidate has not accepted the interim offer");
      const got = o.approvals || [];
      for (const need of c.requiredApprovals) {
        if (!got.includes(need)) reasons.push("Approval from '" + need + "' is not recorded");
      }
    }

    return { next, met: reasons.length === 0, reasons };
  }

  // ---- Transitions --------------------------------------------------------

  // Advance one stage, only if active and the gate is met. Never skips, and
  // never advances INTO "Letter of Intent" — that requires issueLoi().
  function advance(app, job, opts) {
    const at = (opts && opts.at) || nowIso();
    if (app.status !== STATUS.ACTIVE) {
      return { ok: false, reasons: ["Application is " + app.status + (app.statusReason ? " (" + app.statusReason + ")" : "") + ", not active"] };
    }
    const gate = gateCheck(app, job);
    if (!gate.next) return { ok: false, reasons: gate.reasons };
    if (gate.next === "Letter of Intent") {
      return { ok: false, reasons: ["Issuing the Letter of Intent is explicit-only: use issueLoi() for this named application"] };
    }
    if (!gate.met) return { ok: false, reasons: gate.reasons };

    const from = app.stage;
    app.stage = gate.next;
    record(app, "advanced", { at, from, to: gate.next });
    return { ok: true, from, to: gate.next };
  }

  // Issue the LOI — final, irreversible, explicit-only. The caller must pass
  // confirm === the application id so a broad "move everyone forward" or a
  // status query can never trigger it as a side effect.
  function issueLoi(app, job, opts) {
    const at = (opts && opts.at) || nowIso();
    const issuedBy = (opts && opts.issuedBy) || "recruiter";
    if (!opts || opts.confirm !== app.id) {
      return { ok: false, reasons: ["LOI requires explicit confirmation: pass confirm set to the application id ('" + app.id + "')"] };
    }
    if (app.status !== STATUS.ACTIVE) {
      return { ok: false, reasons: ["Application is " + app.status + ", not active"] };
    }
    if (app.stage !== "Interim Offer") {
      return { ok: false, reasons: ["Application is at '" + app.stage + "'; LOI can only be issued from 'Interim Offer'"] };
    }
    const gate = gateCheck(app, job);
    if (!gate.met) return { ok: false, reasons: gate.reasons };

    app.stage = "Letter of Intent";
    app.status = STATUS.LOI_ISSUED;
    app.loi = { issuedAt: at, issuedBy };
    record(app, "loi_issued", { at, from: "Interim Offer", to: "Letter of Intent", issuedBy });
    return { ok: true, from: "Interim Offer", to: "Letter of Intent" };
  }

  function hold(app, reason, opts) {
    const at = (opts && opts.at) || nowIso();
    if (!reason) return { ok: false, reasons: ["A hold must record its reason"] };
    if (app.status === STATUS.REJECTED || app.status === STATUS.LOI_ISSUED) {
      return { ok: false, reasons: ["Application is " + app.status + " and can no longer be held"] };
    }
    app.status = STATUS.HELD;
    app.statusReason = reason;
    record(app, "held", { at, stage: app.stage, reason });
    return { ok: true };
  }

  function release(app, opts) {
    const at = (opts && opts.at) || nowIso();
    if (app.status !== STATUS.HELD) return { ok: false, reasons: ["Application is not held"] };
    const was = app.statusReason;
    app.status = STATUS.ACTIVE;
    app.statusReason = null;
    record(app, "released", { at, stage: app.stage, previousReason: was });
    return { ok: true };
  }

  function reject(app, reason, opts) {
    const at = (opts && opts.at) || nowIso();
    if (!reason) return { ok: false, reasons: ["A rejection must record its reason"] };
    if (app.status === STATUS.LOI_ISSUED) {
      return { ok: false, reasons: ["An issued LOI cannot be converted to a rejection here — rescinding an LOI is out of scope for this engine"] };
    }
    if (app.status === STATUS.REJECTED) return { ok: false, reasons: ["Application is already rejected"] };
    app.status = STATUS.REJECTED;
    app.statusReason = reason;
    record(app, "rejected", { at, stage: app.stage, reason });
    return { ok: true };
  }

  // ---- Batch ---------------------------------------------------------------
  // Advance every gate-met ACTIVE application one stage. Never issues LOIs.
  // Returns the exact split so a partial success can be reported precisely.
  function batchAdvance(apps, jobsById, opts) {
    const out = { advanced: [], notReady: [], excluded: [] };
    for (const app of apps) {
      const job = jobsById[app.jobId];
      if (app.status !== STATUS.ACTIVE) {
        out.excluded.push({ id: app.id, stage: app.stage, status: app.status, reason: app.statusReason || app.status });
        continue;
      }
      const gate = gateCheck(app, job);
      if (!gate.met) {
        out.notReady.push({ id: app.id, stage: app.stage, reasons: gate.reasons });
        continue;
      }
      if (gate.next === "Letter of Intent") {
        out.excluded.push({ id: app.id, stage: app.stage, status: app.status, reason: "Ready for LOI — issuance is explicit-only, never part of a batch advance" });
        continue;
      }
      const res = advance(app, job, opts);
      if (res.ok) out.advanced.push({ id: app.id, from: res.from, to: res.to });
      else out.notReady.push({ id: app.id, stage: app.stage, reasons: res.reasons });
    }
    return out;
  }

  // ---- Reporting -----------------------------------------------------------
  function summarize(apps) {
    const byStage = {};
    for (const s of STAGES) byStage[s] = 0;
    const sum = { total: apps.length, byStage, active: 0, held: 0, rejected: 0, loiIssued: 0 };
    for (const app of apps) {
      if (byStage[app.stage] != null) byStage[app.stage] += 1;
      if (app.status === STATUS.ACTIVE) sum.active += 1;
      else if (app.status === STATUS.HELD) sum.held += 1;
      else if (app.status === STATUS.REJECTED) sum.rejected += 1;
      else if (app.status === STATUS.LOI_ISSUED) sum.loiIssued += 1;
    }
    return sum;
  }

  const api = {
    STAGES, STATUS, DEFAULT_CRITERIA,
    criteriaFor, stageIndex, nextStage,
    gateCheck, advance, issueLoi, hold, release, reject,
    batchAdvance, summarize,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RECRUIT = api;
})(typeof window !== "undefined" ? window : globalThis);
