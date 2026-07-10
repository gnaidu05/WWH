/* Kitaab — Fresher Recruitment Engine: demo dataset.
 *
 * Sample jobs and applications rendered client-side so the console works
 * without a backend (same demo-mode convention as the rest of the site).
 * In production these rows come from Supabase (supabase/recruitment-schema.sql).
 *
 * The dataset deliberately includes the tricky cases the engine must catch:
 *   - a candidate with two independent applications (APP-003 / APP-004),
 *   - an assessment marked complete but with NO score recorded (APP-006),
 *   - an accepted interim offer that is still missing one approval (APP-008),
 *   - a held application and a rejected one, each with the reason recorded.
 */

const RECRUIT_JOBS = [
  {
    id: "JOB-SWE-26",
    title: "Graduate Software Engineer — 2026 Batch",
    criteria: {
      degrees: ["B.E.", "B.Tech", "M.Tech", "MCA"],
      branches: ["CSE", "IT", "ECE"],
      gradYears: [2025, 2026],
      minCgpa: 7.0,
      assessmentCutoff: 65,
      requiredRounds: ["Technical", "HR"],
      requiredApprovals: ["HR Lead", "Engineering Head"],
    },
  },
  {
    id: "JOB-QA-26",
    title: "Graduate QA Engineer — 2026 Batch",
    criteria: {
      degrees: ["B.E.", "B.Tech", "M.Tech", "MCA", "B.Sc", "M.Sc"],
      branches: [],           // any branch
      gradYears: [2025, 2026],
      minCgpa: 6.5,
      assessmentCutoff: 60,
      requiredRounds: ["Technical", "HR"],
      requiredApprovals: ["HR Lead", "QA Head"],
    },
  },
];

const RECRUIT_APPS = [
  {
    id: "APP-001",
    candidateId: "C-101", candidateName: "Rohan Verma", email: "rohan.verma@example.com",
    jobId: "JOB-SWE-26", stage: "Application", status: "active", statusReason: null,
    profile: { degree: "B.Tech", branch: "CSE", gradYear: 2026, cgpa: 8.2, applicationComplete: true },
    assessment: {}, interview: { rounds: [] }, offer: {}, loi: null,
    history: [{ at: "2026-06-28T09:00:00Z", event: "applied" }],
  },
  {
    id: "APP-002",
    candidateId: "C-102", candidateName: "Priya Nair", email: "priya.nair@example.com",
    jobId: "JOB-SWE-26", stage: "Application", status: "active", statusReason: null,
    // Eligible on paper except the application form was never finished.
    profile: { degree: "B.E.", branch: "IT", gradYear: 2026, cgpa: 7.4, applicationComplete: false },
    assessment: {}, interview: { rounds: [] }, offer: {}, loi: null,
    history: [{ at: "2026-06-29T11:20:00Z", event: "applied" }],
  },
  {
    id: "APP-003",
    candidateId: "C-103", candidateName: "Ananya Sharma", email: "ananya.sharma@example.com",
    jobId: "JOB-SWE-26", stage: "Assessment", status: "active", statusReason: null,
    profile: { degree: "B.Tech", branch: "CSE", gradYear: 2026, cgpa: 8.9, applicationComplete: true },
    assessment: { invitedAt: "2026-07-01T10:00:00Z", completedAt: "2026-07-03T14:30:00Z", score: 82 },
    interview: { rounds: [] }, offer: {}, loi: null,
    history: [
      { at: "2026-06-27T08:10:00Z", event: "applied" },
      { at: "2026-07-01T10:00:00Z", event: "advanced", from: "Application", to: "Assessment" },
    ],
  },
  {
    // Same candidate as APP-003, different job — tracked independently.
    id: "APP-004",
    candidateId: "C-103", candidateName: "Ananya Sharma", email: "ananya.sharma@example.com",
    jobId: "JOB-QA-26", stage: "Application", status: "active", statusReason: null,
    profile: { degree: "B.Tech", branch: "CSE", gradYear: 2026, cgpa: 8.9, applicationComplete: true },
    assessment: {}, interview: { rounds: [] }, offer: {}, loi: null,
    history: [{ at: "2026-07-02T09:45:00Z", event: "applied" }],
  },
  {
    id: "APP-005",
    candidateId: "C-104", candidateName: "Karthik Reddy", email: "karthik.reddy@example.com",
    jobId: "JOB-SWE-26", stage: "Assessment", status: "active", statusReason: null,
    // Completed the test but landed under the 65% cutoff.
    profile: { degree: "B.Tech", branch: "ECE", gradYear: 2025, cgpa: 7.1, applicationComplete: true },
    assessment: { invitedAt: "2026-07-01T10:00:00Z", completedAt: "2026-07-04T16:00:00Z", score: 58 },
    interview: { rounds: [] }, offer: {}, loi: null,
    history: [
      { at: "2026-06-30T13:00:00Z", event: "applied" },
      { at: "2026-07-01T10:00:00Z", event: "advanced", from: "Application", to: "Assessment" },
    ],
  },
  {
    id: "APP-006",
    candidateId: "C-105", candidateName: "Meera Iyer", email: "meera.iyer@example.com",
    jobId: "JOB-QA-26", stage: "Assessment", status: "active", statusReason: null,
    // Looks like a pass — "completed" — but no score was ever recorded.
    profile: { degree: "B.Sc", branch: "Computer Science", gradYear: 2026, cgpa: 7.8, applicationComplete: true },
    assessment: { invitedAt: "2026-07-02T10:00:00Z", completedAt: "2026-07-05T12:00:00Z" },
    interview: { rounds: [] }, offer: {}, loi: null,
    history: [
      { at: "2026-07-01T09:30:00Z", event: "applied" },
      { at: "2026-07-02T10:00:00Z", event: "advanced", from: "Application", to: "Assessment" },
    ],
  },
  {
    id: "APP-007",
    candidateId: "C-106", candidateName: "Arjun Malhotra", email: "arjun.malhotra@example.com",
    jobId: "JOB-SWE-26", stage: "Interview", status: "active", statusReason: null,
    profile: { degree: "M.Tech", branch: "CSE", gradYear: 2025, cgpa: 8.0, applicationComplete: true },
    assessment: { invitedAt: "2026-06-20T10:00:00Z", completedAt: "2026-06-22T15:00:00Z", score: 74 },
    interview: {
      rounds: [
        { name: "Technical", completed: true, recommendation: "proceed", panel: "Panel A" },
        { name: "HR", completed: true, recommendation: "proceed", panel: "Panel HR-1" },
      ],
    },
    offer: {}, loi: null,
    history: [
      { at: "2026-06-18T10:00:00Z", event: "applied" },
      { at: "2026-06-20T10:00:00Z", event: "advanced", from: "Application", to: "Assessment" },
      { at: "2026-06-23T09:00:00Z", event: "advanced", from: "Assessment", to: "Interview" },
    ],
  },
  {
    id: "APP-008",
    candidateId: "C-107", candidateName: "Sneha Kulkarni", email: "sneha.kulkarni@example.com",
    jobId: "JOB-SWE-26", stage: "Interim Offer", status: "active", statusReason: null,
    // Accepted the offer, but the Engineering Head approval is still missing.
    profile: { degree: "B.Tech", branch: "IT", gradYear: 2025, cgpa: 8.5, applicationComplete: true },
    assessment: { invitedAt: "2026-06-10T10:00:00Z", completedAt: "2026-06-12T11:00:00Z", score: 88 },
    interview: {
      rounds: [
        { name: "Technical", completed: true, recommendation: "proceed", panel: "Panel B" },
        { name: "HR", completed: true, recommendation: "proceed", panel: "Panel HR-2" },
      ],
    },
    offer: { extendedAt: "2026-06-25T10:00:00Z", accepted: true, acceptedAt: "2026-06-26T18:00:00Z", approvals: ["HR Lead"] },
    loi: null,
    history: [
      { at: "2026-06-08T10:00:00Z", event: "applied" },
      { at: "2026-06-10T10:00:00Z", event: "advanced", from: "Application", to: "Assessment" },
      { at: "2026-06-13T09:00:00Z", event: "advanced", from: "Assessment", to: "Interview" },
      { at: "2026-06-25T10:00:00Z", event: "advanced", from: "Interview", to: "Interim Offer" },
    ],
  },
  {
    id: "APP-009",
    candidateId: "C-108", candidateName: "Vikram Singh", email: "vikram.singh@example.com",
    jobId: "JOB-QA-26", stage: "Interim Offer", status: "active", statusReason: null,
    // Fully ready for LOI: accepted + both approvals recorded.
    profile: { degree: "MCA", branch: "Computer Applications", gradYear: 2025, cgpa: 7.9, applicationComplete: true },
    assessment: { invitedAt: "2026-06-05T10:00:00Z", completedAt: "2026-06-07T13:00:00Z", score: 71 },
    interview: {
      rounds: [
        { name: "Technical", completed: true, recommendation: "proceed", panel: "Panel Q" },
        { name: "HR", completed: true, recommendation: "proceed", panel: "Panel HR-1" },
      ],
    },
    offer: { extendedAt: "2026-06-20T10:00:00Z", accepted: true, acceptedAt: "2026-06-21T09:30:00Z", approvals: ["HR Lead", "QA Head"] },
    loi: null,
    history: [
      { at: "2026-06-03T10:00:00Z", event: "applied" },
      { at: "2026-06-05T10:00:00Z", event: "advanced", from: "Application", to: "Assessment" },
      { at: "2026-06-08T09:00:00Z", event: "advanced", from: "Assessment", to: "Interview" },
      { at: "2026-06-20T10:00:00Z", event: "advanced", from: "Interview", to: "Interim Offer" },
    ],
  },
  {
    id: "APP-010",
    candidateId: "C-109", candidateName: "Divya Menon", email: "divya.menon@example.com",
    jobId: "JOB-SWE-26", stage: "Application", status: "held",
    statusReason: "CGPA 6.4 is below the 7.0 cutoff; held pending revised marksheet",
    profile: { degree: "B.Tech", branch: "CSE", gradYear: 2026, cgpa: 6.4, applicationComplete: true },
    assessment: {}, interview: { rounds: [] }, offer: {}, loi: null,
    history: [
      { at: "2026-06-30T10:00:00Z", event: "applied" },
      { at: "2026-07-01T15:00:00Z", event: "held", stage: "Application", reason: "CGPA 6.4 is below the 7.0 cutoff; held pending revised marksheet" },
    ],
  },
  {
    id: "APP-011",
    candidateId: "C-110", candidateName: "Farhan Ali", email: "farhan.ali@example.com",
    jobId: "JOB-SWE-26", stage: "Interview", status: "rejected",
    statusReason: "Technical panel recommendation was 'reject' after round 1",
    profile: { degree: "B.E.", branch: "IT", gradYear: 2025, cgpa: 7.6, applicationComplete: true },
    assessment: { invitedAt: "2026-06-15T10:00:00Z", completedAt: "2026-06-17T10:00:00Z", score: 69 },
    interview: { rounds: [{ name: "Technical", completed: true, recommendation: "reject", panel: "Panel A" }] },
    offer: {}, loi: null,
    history: [
      { at: "2026-06-13T10:00:00Z", event: "applied" },
      { at: "2026-06-15T10:00:00Z", event: "advanced", from: "Application", to: "Assessment" },
      { at: "2026-06-18T09:00:00Z", event: "advanced", from: "Assessment", to: "Interview" },
      { at: "2026-06-24T17:00:00Z", event: "rejected", stage: "Interview", reason: "Technical panel recommendation was 'reject' after round 1" },
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { RECRUIT_JOBS, RECRUIT_APPS };
}
