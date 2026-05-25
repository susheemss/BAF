export type TicketStatus = "Open" | "In Progress" | "Blocked" | "Escalated" | "Closed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type TicketType =
  | "Authorization"
  | "System Issue"
  | "Data Issue"
  | "Refinement"
  | "Feature Development"
  | "User Question";

export type SuggestedSolution = {
  pastRef: string;
  confidence: "High" | "Medium" | "Low";
  resolvedInDays: number;
  steps: string[];
};

export type Ticket = {
  id: string;
  title: string;
  domain: "Demand" | "Supply" | "Control Tower";
  team: "TMS" | "Kinaxis" | "Anaplan" | "Blue Yonder";
  assignee: string;
  status: TicketStatus;
  priority: TicketPriority;
  issueType: TicketType;
  createdMonth: string;
  closedMonth?: string;
  ageDays: number;
  etaDays: number;
  lastUpdated: string;
  summary: string;
  suggestedSolution?: SuggestedSolution;
};

export const CATEGORY_META: Record<TicketType, { sla: string; slaHours?: number }> = {
  Authorization:         { sla: "24h SLA",    slaHours: 24 },
  "System Issue":        { sla: "4h SLA",     slaHours: 4 },
  "Data Issue":          { sla: "8h SLA",     slaHours: 8 },
  Refinement:            { sla: "5-day SLA",  slaHours: 120 },
  "Feature Development": { sla: "Next sprint" },
  "User Question":       { sla: "2h SLA",     slaHours: 2 },
};

export const OPERATIONS_TICKETS: Ticket[] = [
  // ── Authorization ───────────────────────────────────────────────────────────
  {
    id: "OPS-2545", title: "Access request for Kinaxis demand-view role — new planner onboarding",
    domain: "Demand", team: "Kinaxis", assignee: "Aarav Mehta", status: "Open", priority: "Medium",
    issueType: "Authorization", createdMonth: "Apr 26", ageDays: 28, etaDays: 1, lastUpdated: "2026-05-20",
    summary: "New demand planner requires read access to Kinaxis consensus and FC views.",
    suggestedSolution: {
      pastRef: "OPS-2310", confidence: "High", resolvedInDays: 1,
      steps: [
        "Verify the user's identity and line-manager approval in the access request form.",
        "Assign the 'Demand Planner – Read' role in the Kinaxis admin console.",
        "Send onboarding checklist and verify successful login within one business day.",
        "Log the role assignment in the access audit trail and close the ticket.",
      ],
    },
  },
  {
    id: "OPS-2547", title: "Blue Yonder account locked after repeated login failures",
    domain: "Supply", team: "Blue Yonder", assignee: "Priya Nair", status: "In Progress", priority: "High",
    issueType: "Authorization", createdMonth: "May 26", ageDays: 12, etaDays: 0, lastUpdated: "2026-05-22",
    summary: "Warehouse manager account is locked; urgent access needed for end-of-day dispatch run.",
    suggestedSolution: {
      pastRef: "OPS-2345", confidence: "High", resolvedInDays: 1,
      steps: [
        "Confirm identity of the requesting user via manager and HR system.",
        "Unlock the account in Blue Yonder admin panel and force a password reset.",
        "Investigate the cause of repeated failures — check for a credential sync issue with SSO.",
        "If an SSO mismatch is found, escalate to the IT infrastructure team for a permanent fix.",
      ],
    },
  },
  {
    id: "OPS-2558", title: "Anaplan supply scenario edit rights — seasonal planning team",
    domain: "Supply", team: "Anaplan", assignee: "Sofia Bennett", status: "Open", priority: "Medium",
    issueType: "Authorization", createdMonth: "May 26", ageDays: 8, etaDays: 2, lastUpdated: "2026-05-21",
    summary: "Four seasonal planners need write access to Anaplan supply scenarios for Q3 planning cycle.",
    suggestedSolution: {
      pastRef: "OPS-2289", confidence: "High", resolvedInDays: 2,
      steps: [
        "Collect the four user IDs and confirm approval from the supply planning manager.",
        "Assign the 'Supply Planner – Edit' role in Anaplan workspace settings.",
        "Scope role to Q3 planning scenarios only; do not grant access to archived or locked scenarios.",
        "Notify users and schedule a 15-minute orientation before the planning cycle starts.",
      ],
    },
  },

  // ── System Issue ─────────────────────────────────────────────────────────────
  {
    id: "OPS-2434", title: "Filtering hangs in waiting mode when ENK and BIOS selected together",
    domain: "Supply", team: "Kinaxis", assignee: "Luca Martin", status: "Blocked", priority: "High",
    issueType: "System Issue", createdMonth: "Dec 25", ageDays: 140, etaDays: 8, lastUpdated: "2026-05-12",
    summary: "Multi-filter query hangs for a specific product group combination.",
    suggestedSolution: {
      pastRef: "OPS-2219", confidence: "Medium", resolvedInDays: 7,
      steps: [
        "Reproduce the hang with ENK + BIOS filter combination in a non-prod environment.",
        "Add a composite index on the product group column pair in the query engine.",
        "Set a 30-second query timeout with a user-facing retry prompt as a short-term guard.",
        "Raise a defect with the Kinaxis support team for a permanent query plan fix.",
      ],
    },
  },
  {
    id: "OPS-2444", title: "Missing replenishment output for France launch portfolio",
    domain: "Supply", team: "Anaplan", assignee: "Sofia Bennett", status: "Escalated", priority: "Critical",
    issueType: "System Issue", createdMonth: "Jan 26", ageDays: 125, etaDays: 3, lastUpdated: "2026-05-14",
    summary: "Replenishment lines not generated for launch portfolio scenario — scenario may be locked.",
    suggestedSolution: {
      pastRef: "OPS-2298", confidence: "High", resolvedInDays: 2,
      steps: [
        "Check if the France launch portfolio scenario is locked — replenishment does not run on locked scenarios.",
        "Unlock the scenario, trigger a manual replenishment generation run.",
        "Verify that all launch SKUs are included in the active planning horizon.",
        "Escalation note: if the scenario is locked by a user, obtain manager approval before unlocking.",
      ],
    },
  },
  {
    id: "OPS-2470", title: "Production program quantity card not refreshing after scenario publish",
    domain: "Control Tower", team: "Blue Yonder", assignee: "Owen Carter", status: "Open", priority: "High",
    issueType: "System Issue", createdMonth: "Feb 26", ageDays: 91, etaDays: 6, lastUpdated: "2026-05-12",
    summary: "Refresh signal not propagated to the quantity card after scenario publish event.",
    suggestedSolution: {
      pastRef: "OPS-2352", confidence: "Medium", resolvedInDays: 5,
      steps: [
        "Trace the publish event through the Blue Yonder event bus to confirm the refresh signal is emitted.",
        "Check if the Control Tower subscriber is registered and active for the publish event type.",
        "Patch the event listener to re-subscribe and propagate the refresh signal to the quantity card.",
        "Test end-to-end: publish a scenario and confirm the card updates within 60 seconds.",
      ],
    },
  },
  {
    id: "OPS-2507", title: "Solver plan on multiple non-existing sowing slots for ENSA F1",
    domain: "Supply", team: "Anaplan", assignee: "Priya Nair", status: "In Progress", priority: "High",
    issueType: "System Issue", createdMonth: "Mar 26", ageDays: 61, etaDays: 5, lastUpdated: "2026-05-14",
    summary: "Solver recommendation references invalid sowing slots in master data.",
    suggestedSolution: {
      pastRef: "OPS-2401", confidence: "Medium", resolvedInDays: 7,
      steps: [
        "Export the active sowing slot master data and cross-check against solver plan output for ENSA F1.",
        "Identify and deactivate non-existing slot references in the Anaplan master data table.",
        "Re-run the solver with the updated slot master; confirm no invalid references remain.",
        "Notify the planning team to review ENSA F1 output before the next scheduling cycle.",
      ],
    },
  },
  {
    id: "OPS-2540", title: "Open demand queue spike after forecast publication cutover",
    domain: "Demand", team: "TMS", assignee: "Meera Kapoor", status: "Escalated", priority: "Critical",
    issueType: "System Issue", createdMonth: "Apr 26", ageDays: 37, etaDays: 2, lastUpdated: "2026-05-15",
    summary: "Cutover triggered a queue saturation; validation backlog now unprocessed.",
    suggestedSolution: {
      pastRef: "OPS-2410", confidence: "High", resolvedInDays: 2,
      steps: [
        "Pause incoming demand queue submissions until the cutover validation backlog is cleared.",
        "Re-sequence the cutover jobs with 15-minute staggered intervals to prevent queue saturation.",
        "Clear validated items from the backlog in priority order: Critical SKUs first.",
        "Monitor queue depth every 30 minutes post-fix; escalate to leadership if depth exceeds 500 items.",
      ],
    },
  },
  {
    id: "OPS-2500", title: "Value measure descriptions mismatch between backend and frontend",
    domain: "Control Tower", team: "Kinaxis", assignee: "Aarav Mehta", status: "Closed", priority: "High",
    issueType: "System Issue", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 67, etaDays: 0,
    lastUpdated: "2026-04-09", summary: "Description map aligned across API payload and UI.",
  },

  // ── Data Issue ───────────────────────────────────────────────────────────────
  {
    id: "OPS-2419", title: "Published final FC not rounded to smallest SKU for Trica Spain",
    domain: "Demand", team: "TMS", assignee: "Aarav Mehta", status: "Open", priority: "Critical",
    issueType: "Data Issue", createdMonth: "Nov 25", ageDays: 166, etaDays: 4, lastUpdated: "2026-05-14",
    summary: "Demand planning output mismatch — rounding rule not applied at FC transformation layer.",
    suggestedSolution: {
      pastRef: "OPS-2187", confidence: "High", resolvedInDays: 3,
      steps: [
        "Identify the rounding rule applied in the FC transformation layer for the affected SKU group.",
        "Correct the rounding threshold to match the smallest saleable unit definition for Spain.",
        "Re-run the FC publish job and validate output against the consensus baseline.",
        "Confirm downstream systems have received the corrected published values.",
      ],
    },
  },
  {
    id: "OPS-2425", title: "Ustica difference Germany in published final FC",
    domain: "Demand", team: "TMS", assignee: "Meera Kapoor", status: "In Progress", priority: "High",
    issueType: "Data Issue", createdMonth: "Dec 25", ageDays: 152, etaDays: 6, lastUpdated: "2026-05-13",
    summary: "Mismatch between Germany consensus snapshot and downstream published values.",
    suggestedSolution: {
      pastRef: "OPS-2201", confidence: "High", resolvedInDays: 5,
      steps: [
        "Pull the consensus snapshot and the published FC side-by-side for the Germany market.",
        "Locate the offset in the mapping table between consensus output and publication job input.",
        "Apply correction to the mapping; re-publish FC for the affected period.",
        "Validate with the Germany planning team that figures align before closing.",
      ],
    },
  },
  {
    id: "OPS-2448", title: "Multiple replenishment lines generated for same material and week",
    domain: "Supply", team: "Blue Yonder", assignee: "Priya Nair", status: "In Progress", priority: "High",
    issueType: "Data Issue", createdMonth: "Jan 26", ageDays: 121, etaDays: 7, lastUpdated: "2026-05-10",
    summary: "Duplicate supply recommendations need de-duplication before dispatch planning.",
    suggestedSolution: {
      pastRef: "OPS-2311", confidence: "High", resolvedInDays: 6,
      steps: [
        "Run a duplicate-detection query on the active replenishment queue for affected material-week pairs.",
        "Identify which run produced duplicates (batch job re-trigger vs. manual re-run).",
        "Apply the de-duplication rule: keep the latest generated line, archive earlier duplicates.",
        "Add a uniqueness constraint on material + week to prevent recurrence.",
      ],
    },
  },
  {
    id: "OPS-2455", title: "Orders count mismatch between production overview and plan analysis",
    domain: "Control Tower", team: "Kinaxis", assignee: "Daniel Hughes", status: "Open", priority: "Medium",
    issueType: "Data Issue", createdMonth: "Jan 26", ageDays: 114, etaDays: 10, lastUpdated: "2026-05-08",
    summary: "Dashboard tile is reading a stale aggregation snapshot vs. live plan analysis.",
    suggestedSolution: {
      pastRef: "OPS-2333", confidence: "High", resolvedInDays: 4,
      steps: [
        "Force a manual refresh of the aggregation snapshot for the Control Tower orders tile.",
        "Compare snapshot timestamp vs. plan analysis run timestamp — confirm staleness.",
        "Shorten the aggregation cache interval from 24h to 6h in the scheduler config.",
        "Validate that production overview and plan analysis counts match after the next scheduled refresh.",
      ],
    },
  },
  {
    id: "OPS-2491", title: "Rounding and cutting <0.01 TP FC data for reporting export",
    domain: "Demand", team: "Blue Yonder", assignee: "Priya Nair", status: "Open", priority: "Medium",
    issueType: "Data Issue", createdMonth: "Mar 26", ageDays: 70, etaDays: 11, lastUpdated: "2026-05-13",
    summary: "Pre-rounding step missing in the export pipeline; values below 0.01 create downstream noise.",
    suggestedSolution: {
      pastRef: "OPS-2388", confidence: "High", resolvedInDays: 4,
      steps: [
        "Add a pre-export rounding step in the Blue Yonder TP FC transformation pipeline.",
        "Set threshold: values below 0.01 to be floored to zero before export.",
        "Run a test export and validate output against the reporting baseline for the last 3 months.",
        "Update the data dictionary to document the rounding behaviour for downstream consumers.",
      ],
    },
  },
  {
    id: "OPS-2512", title: "Actuals rollover treatment for negative actuals in orders",
    domain: "Demand", team: "Blue Yonder", assignee: "Sofia Bennett", status: "Closed", priority: "High",
    issueType: "Data Issue", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 58, etaDays: 0,
    lastUpdated: "2026-04-25", summary: "Negative actuals handling updated in transformation logic.",
  },

  // ── Refinement ───────────────────────────────────────────────────────────────
  {
    id: "OPS-2475", title: "Separate support requests from functional issues in queue",
    domain: "Control Tower", team: "TMS", assignee: "Meera Kapoor", status: "Open", priority: "Low",
    issueType: "Refinement", createdMonth: "Feb 26", ageDays: 86, etaDays: 12, lastUpdated: "2026-05-06",
    summary: "Governance request to split Support queue from functional issue queue.",
    suggestedSolution: {
      pastRef: "OPS-2180", confidence: "Medium", resolvedInDays: 8,
      steps: [
        "Add a dedicated 'Support Request' filter view in the Operations Desk queue.",
        "Update ticket intake form to enforce category selection before submission.",
        "Define a triage SLA: Support Requests acknowledged within 1 business day, Issues within 4 hours.",
        "Share updated governance documentation with all team leads.",
      ],
    },
  },
  {
    id: "OPS-2481", title: "Stock seed analysis card should show last run source",
    domain: "Control Tower", team: "Anaplan", assignee: "Luca Martin", status: "In Progress", priority: "Low",
    issueType: "Refinement", createdMonth: "Feb 26", ageDays: 80, etaDays: 9, lastUpdated: "2026-05-11",
    summary: "UI enhancement: display source name and timestamp on stock seed audit card.",
    suggestedSolution: {
      pastRef: "OPS-2271", confidence: "High", resolvedInDays: 6,
      steps: [
        "Add a 'last run source' metadata field to the Anaplan stock seed output payload.",
        "Update the Control Tower UI card template to display source name and timestamp.",
        "Deploy the card template update and validate in staging before production push.",
      ],
    },
  },
  {
    id: "OPS-2518", title: "PRD operational horizon missing on dashboard summary tile",
    domain: "Control Tower", team: "Kinaxis", assignee: "Daniel Hughes", status: "Open", priority: "Medium",
    issueType: "Refinement", createdMonth: "Mar 26", ageDays: 51, etaDays: 9, lastUpdated: "2026-05-07",
    summary: "Dashboard summary tile needs operational horizon value mapped from Kinaxis API.",
    suggestedSolution: {
      pastRef: "OPS-2390", confidence: "High", resolvedInDays: 3,
      steps: [
        "Confirm the PRD operational horizon field is present in the Kinaxis API response payload.",
        "Map the field to the dashboard summary tile configuration.",
        "Deploy the updated tile mapping and validate display in both summary and drill-down views.",
      ],
    },
  },

  // ── Feature Development ──────────────────────────────────────────────────────
  {
    id: "OPS-2549", title: "Automated PO release trigger for critical stockout SKUs",
    domain: "Supply", team: "Blue Yonder", assignee: "Owen Carter", status: "Open", priority: "High",
    issueType: "Feature Development", createdMonth: "Apr 26", ageDays: 32, etaDays: 21, lastUpdated: "2026-05-18",
    summary: "Feature request: when Days of Cover < 3, auto-draft a PO release and route to planner approval.",
    suggestedSolution: {
      pastRef: "OPS-2360", confidence: "Medium", resolvedInDays: 14,
      steps: [
        "Define the trigger rule: stockout_risk='High' AND days_of_cover < 3 fires the automation.",
        "Build a PO draft generator in Blue Yonder that creates a pending PO with recommended qty.",
        "Route the draft PO to the assigned planner's approval queue with a 4-hour SLA alert.",
        "Log all automated drafts in an audit trail; present summary on the Control Tower dashboard.",
      ],
    },
  },
  {
    id: "OPS-2552", title: "Exception digest email for high-risk supply signals across systems",
    domain: "Control Tower", team: "TMS", assignee: "Aarav Mehta", status: "Open", priority: "Medium",
    issueType: "Feature Development", createdMonth: "May 26", ageDays: 16, etaDays: 30, lastUpdated: "2026-05-19",
    summary: "Daily 8 AM email digest consolidating critical alerts from Kinaxis, Anaplan, Blue Yonder, and TMS.",
    suggestedSolution: {
      pastRef: "OPS-2391", confidence: "Low", resolvedInDays: 21,
      steps: [
        "Define alert threshold criteria for each system (e.g., Critical priority, Escalated status).",
        "Build a scheduled job that queries the Operations Desk API at 7:50 AM daily.",
        "Render a digest HTML template with alert summary grouped by category and team.",
        "Configure SendGrid or equivalent to deliver the digest to the planning distribution list.",
      ],
    },
  },
  {
    id: "OPS-2560", title: "Batch job parallelization for weekend Blue Yonder replenishment run",
    domain: "Supply", team: "Blue Yonder", assignee: "Priya Nair", status: "Open", priority: "Medium",
    issueType: "Feature Development", createdMonth: "May 26", ageDays: 6, etaDays: 45, lastUpdated: "2026-05-23",
    summary: "Weekend batch run taking 6+ hours; parallelize by warehouse to reduce window to under 2 hours.",
  },

  // ── User Question ─────────────────────────────────────────────────────────────
  {
    id: "OPS-2504", title: "Source file and column mapping for Kinaxis report files",
    domain: "Supply", team: "TMS", assignee: "Meera Kapoor", status: "Closed", priority: "Medium",
    issueType: "User Question", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 64, etaDays: 0,
    lastUpdated: "2026-04-13", summary: "Support note completed and documentation handed over.",
  },
  {
    id: "OPS-2554", title: "How to restart a failed Blue Yonder batch job without data loss?",
    domain: "Supply", team: "Blue Yonder", assignee: "Daniel Hughes", status: "Open", priority: "Low",
    issueType: "User Question", createdMonth: "Apr 26", ageDays: 24, etaDays: 1, lastUpdated: "2026-05-21",
    summary: "Warehouse ops team asking for the safe restart procedure for mid-run batch failures.",
    suggestedSolution: {
      pastRef: "OPS-2320", confidence: "High", resolvedInDays: 1,
      steps: [
        "Navigate to Blue Yonder Batch Monitor → identify the failed job and note the last checkpoint timestamp.",
        "Use the 'Restart from Checkpoint' option to resume from the last committed state — never use 'Restart from Start' unless checkpoint is corrupted.",
        "Monitor the restarted job for 10 minutes; confirm that output record counts match expected pre-failure counts.",
        "Document the incident in the batch job log and share the SOP link with the warehouse ops team.",
      ],
    },
  },
  {
    id: "OPS-2556", title: "Impact of Anaplan scenario lock delay on the weekly supply plan",
    domain: "Supply", team: "Anaplan", assignee: "Luca Martin", status: "Open", priority: "Medium",
    issueType: "User Question", createdMonth: "May 26", ageDays: 14, etaDays: 1, lastUpdated: "2026-05-22",
    summary: "Planning manager asking how a 24h delay in scenario locking affects the downstream TMS dispatch plan.",
    suggestedSolution: {
      pastRef: "OPS-2377", confidence: "High", resolvedInDays: 1,
      steps: [
        "Confirm the supply plan lock schedule: Anaplan locks Thursday 18:00, TMS picks up Friday 06:00.",
        "A 24h delay pushes the TMS dispatch plan to Saturday, missing the weekly carrier tender window.",
        "Inform the planning manager that any lock delay past Thursday 22:00 requires a manual TMS override.",
        "Share the supply-to-dispatch dependency calendar with the planning team to prevent future delays.",
      ],
    },
  },
  {
    id: "OPS-2562", title: "Best practices for monitoring Kinaxis forecast accuracy week-over-week",
    domain: "Demand", team: "Kinaxis", assignee: "Sofia Bennett", status: "Open", priority: "Low",
    issueType: "User Question", createdMonth: "May 26", ageDays: 4, etaDays: 1, lastUpdated: "2026-05-24",
    summary: "New team member requesting guidance on the recommended KPI review process for FC accuracy.",
    suggestedSolution: {
      pastRef: "OPS-2412", confidence: "High", resolvedInDays: 1,
      steps: [
        "Review the weekly Kinaxis FC Accuracy report every Monday morning before the consensus call.",
        "Focus on SKUs where MAPE > 20% for two consecutive weeks — these need root cause analysis.",
        "Check demand driver log for any promotions, seasonality, or supply constraints that explain spikes.",
        "Escalate persistent high-MAPE SKUs to the demand planning lead for re-baselining.",
      ],
    },
  },
];

export const ISSUE_TYPE_COLORS: Record<TicketType, string> = {
  Authorization:         "#7C3AED",
  "System Issue":        "#DC2626",
  "Data Issue":          "#F59E0B",
  Refinement:            "#0EA5E9",
  "Feature Development": "#10B981",
  "User Question":       "#64748B",
};

export function getPriorityRank(priority: TicketPriority) {
  return { Critical: 4, High: 3, Medium: 2, Low: 1 }[priority];
}

export function getStatusTone(status: TicketStatus) {
  if (status === "Closed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Escalated") return "bg-violet-50 text-violet-700 border-violet-200";
  if (status === "Blocked") return "bg-red-50 text-red-700 border-red-200";
  if (status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function getPriorityTone(priority: TicketPriority) {
  if (priority === "Critical") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "High") return "bg-amber-50 text-amber-700 border-amber-200";
  if (priority === "Medium") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

// ── Auto-categorisation ────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<TicketType, string[]> = {
  Authorization: [
    "access", "login", "role", "permission", "locked", "lock", "password", "account",
    "rights", "privilege", "auth", "sso", "unlock", "request", "user", "onboard",
  ],
  "System Issue": [
    "fail", "failure", "error", "hang", "timeout", "batch", "job", "restart",
    "broken", "slow", "scheduler", "processing", "integration", "crash", "stuck",
    "not working", "missing output", "not generated", "not refreshing", "mismatch",
  ],
  "Data Issue": [
    "mismatch", "incorrect", "wrong", "duplicate", "missing", "rounding", "rollover",
    "discrepancy", "variance", "difference", "inaccurate", "inconsistent", "data",
    "correction", "negative", "published", "export", "offset",
  ],
  Refinement: [
    "improve", "enhance", "update", "change", "modify", "display", "show",
    "label", "format", "column", "field", "add", "ui", "view", "separate",
    "dashboard", "card", "tile", "horizon", "missing field",
  ],
  "Feature Development": [
    "automate", "automation", "build", "develop", "integrate", "feature",
    "workflow", "trigger", "notification", "alert", "digest", "new", "create",
    "paralleliz", "automated", "report",
  ],
  "User Question": [
    "how", "what", "explain", "help", "guide", "practice", "impact",
    "when", "why", "difference", "question", "understand", "best",
  ],
};

export function categorizeTicket(title: string): {
  category: TicketType;
  confidence: "High" | "Medium" | "Low";
  matchedKeywords: string[];
} {
  const words = title.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  let best: TicketType = "User Question";
  let bestScore = 0;
  let bestMatched: string[] = [];

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TicketType, string[]][]) {
    const matched = keywords.filter((kw) =>
      words.some((w) => w === kw || w.startsWith(kw) || kw.startsWith(w))
    );
    if (matched.length > bestScore) {
      bestScore = matched.length;
      best = cat;
      bestMatched = matched;
    }
  }

  const confidence: "High" | "Medium" | "Low" =
    bestScore >= 3 ? "High" : bestScore >= 1 ? "Medium" : "Low";
  return { category: best, confidence, matchedKeywords: bestMatched };
}

export function findSimilarTickets(title: string, category: TicketType, n = 3): Ticket[] {
  const words = new Set(
    title.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );

  return OPERATIONS_TICKETS.filter((t) => t.suggestedSolution)
    .map((t) => {
      const haystack = new Set(`${t.title} ${t.summary}`.toLowerCase().split(/\W+/));
      let score = 0;
      words.forEach((w) => { if (haystack.has(w)) score++; });
      if (t.issueType === category) score += 2;
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.t);
}
