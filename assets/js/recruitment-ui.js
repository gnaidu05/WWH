/* Kitaab — Fresher Recruitment Engine: recruiter console (recruitment.html).
 *
 * Renders the pipeline summary, the applications table and the per-application
 * gate detail, and wires the recruiter actions to the engine (RECRUIT):
 * advance / hold / release / reject / issue LOI. Console state persists to
 * localStorage so actions survive a reload; "Reset demo data" restores the
 * sample dataset. All candidate-provided content is escaped before innerHTML.
 */
(function () {
  "use strict";

  const R = window.RECRUIT;
  const STORE_KEY = "kitaab-recruitment-state-v1";

  // Same escaping convention as main.js — user content never hits innerHTML raw.
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---- State ---------------------------------------------------------------
  let jobs, apps;
  const jobsById = () => Object.fromEntries(jobs.map((j) => [j.id, j]));

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.jobs) && Array.isArray(s.apps)) { jobs = s.jobs; apps = s.apps; return; }
      }
    } catch (e) { /* fall through to demo data */ }
    resetState();
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ jobs, apps })); } catch (e) { /* private mode etc. */ }
  }
  function resetState() {
    jobs = JSON.parse(JSON.stringify(RECRUIT_JOBS));
    apps = JSON.parse(JSON.stringify(RECRUIT_APPS));
    saveState();
  }

  // ---- Filters ---------------------------------------------------------------
  const filter = { job: "All", stage: "All", status: "All", q: "" };

  function visibleApps() {
    const q = filter.q.trim().toLowerCase();
    return apps.filter((a) =>
      (filter.job === "All" || a.jobId === filter.job) &&
      (filter.stage === "All" || a.stage === filter.stage) &&
      (filter.status === "All" || a.status === filter.status) &&
      (!q || a.candidateName.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)));
  }

  // ---- Rendering -------------------------------------------------------------
  const STATUS_LABEL = { active: "Active", held: "Held", rejected: "Rejected", loi_issued: "LOI issued" };
  const STATUS_CLASS = { active: "rec-status--active", held: "rec-status--held", rejected: "rec-status--rejected", loi_issued: "rec-status--loi" };

  function renderSummary() {
    const s = R.summarize(apps);
    const tiles = R.STAGES.map((st) =>
      `<div class="rec-tile"><div class="stat__num">${s.byStage[st]}</div><div class="stat__label">${esc(st)}</div></div>`
    ).join("");
    document.getElementById("recSummary").innerHTML = tiles +
      `<div class="rec-tile rec-tile--held"><div class="stat__num">${s.held}</div><div class="stat__label">Held</div></div>` +
      `<div class="rec-tile rec-tile--rejected"><div class="stat__num">${s.rejected}</div><div class="stat__label">Rejected</div></div>`;
  }

  function gateBadge(app) {
    if (app.status !== "active") {
      return `<span class="rec-status ${STATUS_CLASS[app.status] || ""}">${esc(STATUS_LABEL[app.status] || app.status)}</span>`;
    }
    const gate = R.gateCheck(app, jobsById()[app.jobId]);
    if (!gate.next) return `<span class="rec-status rec-status--loi">Terminal</span>`;
    if (gate.met && gate.next === "Letter of Intent") return `<span class="rec-status rec-status--ready">Ready for LOI</span>`;
    if (gate.met) return `<span class="rec-status rec-status--ready">Ready → ${esc(gate.next)}</span>`;
    return `<span class="rec-status rec-status--waiting">Gate not met</span>`;
  }

  function renderTable() {
    const rows = visibleApps();
    const jb = jobsById();
    document.getElementById("recCount").textContent =
      rows.length === apps.length ? `${apps.length} applications` : `${rows.length} of ${apps.length} applications`;

    document.getElementById("recRows").innerHTML = rows.map((a) => `
      <tr class="rec-row" data-app="${esc(a.id)}">
        <td><strong>${esc(a.id)}</strong></td>
        <td>${esc(a.candidateName)}<div class="muted rec-sub">${esc(a.email)}</div></td>
        <td>${esc((jb[a.jobId] || {}).title || a.jobId)}</td>
        <td>${esc(a.stage)}</td>
        <td>${gateBadge(a)}${a.statusReason ? `<div class="muted rec-sub">${esc(a.statusReason)}</div>` : ""}</td>
        <td><button class="btn btn--ghost btn--sm" data-detail="${esc(a.id)}">Details</button></td>
      </tr>`).join("") || `<tr><td colspan="6" class="muted" style="padding:18px">No applications match the current filters.</td></tr>`;

    document.querySelectorAll("[data-detail]").forEach((b) =>
      b.addEventListener("click", () => openDetail(b.getAttribute("data-detail"))));
  }

  function renderDetail(app) {
    const job = jobsById()[app.jobId] || {};
    const c = R.criteriaFor(job);
    const gate = app.status === "active" ? R.gateCheck(app, job) : null;

    const gateHtml = !gate ? `<p class="muted">No gate to evaluate — application is ${esc(STATUS_LABEL[app.status] || app.status)}.</p>`
      : gate.met
        ? `<p class="rec-ok">✔ Gate to <strong>${esc(gate.next)}</strong> is met.</p>`
        : `<p class="rec-warn">Gate to <strong>${esc(gate.next || "—")}</strong> is not met:</p>
           <ul class="rec-reasons">${gate.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`;

    const history = (app.history || []).slice().reverse().map((h) => {
      const when = String(h.at || "").replace("T", " ").replace(/:\d\d(\.\d+)?Z?$/, "");
      const what = h.event === "advanced" ? `Advanced ${esc(h.from)} → ${esc(h.to)}`
        : h.event === "loi_issued" ? `LOI issued by ${esc(h.issuedBy || "recruiter")}`
        : h.event === "held" ? `Held at ${esc(h.stage)}: ${esc(h.reason)}`
        : h.event === "released" ? `Released from hold at ${esc(h.stage)}`
        : h.event === "rejected" ? `Rejected at ${esc(h.stage)}: ${esc(h.reason)}`
        : esc(h.event);
      return `<li><span class="muted">${esc(when)}</span> — ${what}</li>`;
    }).join("");

    const p = app.profile || {}, asmt = app.assessment || {}, off = app.offer || {};
    const rounds = ((app.interview || {}).rounds || []).map((r) =>
      `<li>${esc(r.name)}: ${r.completed ? "complete" : "pending"}${r.recommendation ? `, panel says '${esc(r.recommendation)}'` : ""}</li>`).join("") || "<li class='muted'>No rounds recorded</li>";

    const actions = [];
    if (app.status === "active" && gate && gate.next && gate.next !== "Letter of Intent") {
      actions.push(`<button class="btn btn--primary btn--sm" data-act="advance" ${gate.met ? "" : "disabled title='Gate not met'"}>Advance → ${esc(gate.next)}</button>`);
    }
    if (app.status === "active" && app.stage === "Interim Offer") {
      actions.push(`<button class="btn btn--teal btn--sm" data-act="loi" ${gate && gate.met ? "" : "disabled title='Gate not met'"}>Issue LOI…</button>`);
    }
    if (app.status === "active") {
      actions.push(`<button class="btn btn--ghost btn--sm" data-act="hold">Hold…</button>`);
      actions.push(`<button class="btn btn--ghost btn--sm" data-act="reject">Reject…</button>`);
    }
    if (app.status === "held") {
      actions.push(`<button class="btn btn--primary btn--sm" data-act="release">Release hold</button>`);
      actions.push(`<button class="btn btn--ghost btn--sm" data-act="reject">Reject…</button>`);
    }

    return `
      <div class="rec-detail__head">
        <div>
          <h3 style="margin:0">${esc(app.candidateName)} <span class="muted" style="font-weight:400">· ${esc(app.id)}</span></h3>
          <p class="muted" style="margin:4px 0 0">${esc(job.title || app.jobId)} — at <strong>${esc(app.stage)}</strong> ${gateBadge(app)}</p>
        </div>
        <button class="icon-btn" data-act="close" aria-label="Close details">✕</button>
      </div>
      <div class="grid grid--2" style="margin-top:16px">
        <div>
          <h4>Record</h4>
          <ul class="rec-facts">
            <li>Degree: ${esc(p.degree || "—")} (${esc(p.branch || "—")}), batch of ${esc(p.gradYear || "—")}</li>
            <li>CGPA: ${typeof p.cgpa === "number" ? esc(p.cgpa) : "<em>not recorded</em>"} (cutoff ${esc(c.minCgpa)})</li>
            <li>Application form: ${p.applicationComplete ? "complete" : "incomplete"}</li>
            <li>Assessment: ${asmt.completedAt ? "completed" : "not completed"}, score ${typeof asmt.score === "number" ? esc(asmt.score) : "<em>not recorded</em>"} (cutoff ${esc(c.assessmentCutoff)})</li>
            <li>Interview rounds:<ul>${rounds}</ul></li>
            <li>Interim offer: ${off.extendedAt ? "extended" : "not extended"}${off.accepted === true ? ", accepted" : off.extendedAt ? ", awaiting acceptance" : ""}</li>
            <li>Approvals: ${(off.approvals || []).map(esc).join(", ") || "<em>none recorded</em>"} (required: ${c.requiredApprovals.map(esc).join(", ")})</li>
          </ul>
        </div>
        <div>
          <h4>Stage gate</h4>
          ${gateHtml}
          <h4 style="margin-top:16px">History</h4>
          <ul class="rec-history">${history || "<li class='muted'>No events recorded</li>"}</ul>
        </div>
      </div>
      <div class="rec-detail__actions">${actions.join(" ") || "<span class='muted'>No actions available.</span>"}</div>
      <p class="rec-msg" id="recDetailMsg" role="status"></p>`;
  }

  // ---- Detail panel & actions -----------------------------------------------
  let openId = null;

  function openDetail(id) {
    openId = id;
    const app = apps.find((a) => a.id === id);
    const panel = document.getElementById("recDetail");
    if (!app) { panel.classList.add("hidden"); return; }
    panel.classList.remove("hidden");
    panel.innerHTML = renderDetail(app);
    panel.querySelectorAll("[data-act]").forEach((b) =>
      b.addEventListener("click", () => act(b.getAttribute("data-act"), app)));
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function say(msg, ok) {
    const el = document.getElementById("recDetailMsg") || document.getElementById("recBatchMsg");
    if (el) { el.textContent = msg; el.className = "rec-msg " + (ok ? "rec-ok" : "rec-warn"); }
  }

  function act(kind, app) {
    const job = jobsById()[app.jobId];
    let res;
    if (kind === "close") { openId = null; document.getElementById("recDetail").classList.add("hidden"); return; }
    if (kind === "advance") res = R.advance(app, job);
    if (kind === "release") res = R.release(app);
    if (kind === "hold") {
      const reason = prompt("Reason for holding " + app.id + " (recorded on the application):");
      if (reason == null) return;
      res = R.hold(app, reason.trim());
    }
    if (kind === "reject") {
      const reason = prompt("Reason for REJECTING " + app.id + " (recorded on the application):");
      if (reason == null) return;
      res = R.reject(app, reason.trim());
    }
    if (kind === "loi") {
      const typed = prompt("Issuing a Letter of Intent is final and irreversible.\n\nType the application id (" + app.id + ") to confirm:");
      if (typed == null) return;
      res = R.issueLoi(app, job, { confirm: typed.trim(), issuedBy: "console" });
    }
    if (!res) return;
    saveState();
    renderSummary(); renderTable();
    if (openId) openDetail(openId);
    say(res.ok ? "Done: " + kind + " on " + app.id + "." : res.reasons.join(" · "), res.ok);
  }

  // "Advance all ready" — one stage each, never issues an LOI. Reports the
  // exact split: advanced / not ready / excluded.
  function runBatch() {
    const before = R.summarize(apps);
    const out = R.batchAdvance(apps, jobsById());
    saveState();
    renderSummary(); renderTable();
    if (openId) openDetail(openId);
    const readyLoi = apps.filter((a) => a.status === "active" && a.stage === "Interim Offer" && R.gateCheck(a, jobsById()[a.jobId]).met).length;
    const parts = [
      out.advanced.length + " advanced",
      out.notReady.length + " not ready (gate unmet)",
      out.excluded.length + " excluded (held/rejected/LOI-gated)",
    ];
    const msg = "Batch result — " + parts.join(", ") + "." +
      (readyLoi ? " " + readyLoi + " application(s) are ready for LOI — issue individually from their details." : "");
    const el = document.getElementById("recBatchMsg");
    el.textContent = msg; el.className = "rec-msg " + (out.advanced.length ? "rec-ok" : "rec-warn");
    void before;
  }

  // ---- Boot -------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    loadState();

    const jobSel = document.getElementById("recJobFilter");
    jobSel.innerHTML = `<option value="All">All jobs</option>` +
      jobs.map((j) => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join("");
    jobSel.addEventListener("change", () => { filter.job = jobSel.value; renderTable(); });

    const stageChips = document.getElementById("recStageChips");
    stageChips.innerHTML = `<button class="chip active" data-val="All">All stages</button>` +
      R.STAGES.map((s) => `<button class="chip" data-val="${esc(s)}">${esc(s)}</button>`).join("");
    stageChips.querySelectorAll(".chip").forEach((ch) => ch.addEventListener("click", () => {
      stageChips.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
      ch.classList.add("active");
      filter.stage = ch.getAttribute("data-val");
      renderTable();
    }));

    const statusSel = document.getElementById("recStatusFilter");
    statusSel.addEventListener("change", () => { filter.status = statusSel.value; renderTable(); });

    const search = document.getElementById("recSearch");
    search.addEventListener("input", () => { filter.q = search.value; renderTable(); });

    document.getElementById("recBatchBtn").addEventListener("click", runBatch);
    document.getElementById("recResetBtn").addEventListener("click", () => {
      if (!confirm("Reset the console to the sample dataset? Actions taken in this browser will be discarded.")) return;
      resetState(); openId = null;
      document.getElementById("recDetail").classList.add("hidden");
      document.getElementById("recBatchMsg").textContent = "";
      renderSummary(); renderTable();
    });

    renderSummary();
    renderTable();
  });
})();
