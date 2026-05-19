export type TicketStatus = "Open" | "In Progress" | "Blocked" | "Escalated" | "Closed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type TicketType = "Issue" | "Data Issue" | "Support Request" | "Question" | "System Defect" | "Refinement";

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

export const OPERATIONS_TICKETS: Ticket[] = [
  {
    id: "OPS-2419", title: "Published final FC not rounded to smallest SKU for Trica Spain",
    domain: "Demand", team: "TMS", assignee: "Aarav Mehta", status: "Open", priority: "Critical",
    issueType: "Issue", createdMonth: "Nov 25", ageDays: 166, etaDays: 4, lastUpdated: "2026-05-14",
    summary: "Demand planning output mismatch for Spain FC publication.",
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
    summary: "Mismatch between Germany consensus and downstream published values.",
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
    id: "OPS-2434", title: "Filtering stays in waiting mode when ENK and BIOS selected together",
    domain: "Supply", team: "Kinaxis", assignee: "Luca Martin", status: "Blocked", priority: "High",
    issueType: "System Defect", createdMonth: "Dec 25", ageDays: 140, etaDays: 8, lastUpdated: "2026-05-12",
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
    issueType: "Issue", createdMonth: "Jan 26", ageDays: 125, etaDays: 3, lastUpdated: "2026-05-14",
    summary: "Replenishment lines not generated for launch portfolio scenario.",
    suggestedSolution: {
      pastRef: "OPS-2298", confidence: "High", resolvedInDays: 2,
      steps: [
        "Check if the France launch portfolio scenario is locked — replenishment does not run on locked scenarios.",
        "Unlock the scenario, trigger a manual replenishment generation run.",
        "Verify that all launch SKUs are included in the active planning horizon.",
        "Escalation note: if scenario remains locked by a user, obtain approval before unlocking.",
      ],
    },
  },
  {
    id: "OPS-2448", title: "Multiple replenishment lines generated for same material and week",
    domain: "Supply", team: "Blue Yonder", assignee: "Priya Nair", status: "In Progress", priority: "High",
    issueType: "Issue", createdMonth: "Jan 26", ageDays: 121, etaDays: 7, lastUpdated: "2026-05-10",
    summary: "Duplicate supply recommendations need rule de-duplication.",
    suggestedSolution: {
      pastRef: "OPS-2311", confidence: "High", resolvedInDays: 6,
      steps: [
        "Run a duplicate-detection query on the active replenishment queue for the affected material-week pairs.",
        "Identify which run produced duplicates (batch job re-trigger vs. manual re-run).",
        "Apply the de-duplication rule: keep the latest generated line, archive earlier duplicates.",
        "Add a uniqueness constraint on material + week in the Blue Yonder supply recommendation table to prevent recurrence.",
      ],
    },
  },
  {
    id: "OPS-2455", title: "Orders count mismatch between production overview and plan analysis",
    domain: "Control Tower", team: "Kinaxis", assignee: "Daniel Hughes", status: "Open", priority: "Medium",
    issueType: "Data Issue", createdMonth: "Jan 26", ageDays: 114, etaDays: 10, lastUpdated: "2026-05-08",
    summary: "Dashboard tile is reading a stale aggregation snapshot.",
    suggestedSolution: {
      pastRef: "OPS-2333", confidence: "High", resolvedInDays: 4,
      steps: [
        "Force a manual refresh of the aggregation snapshot for the Control Tower orders tile.",
        "Compare snapshot timestamp vs. plan analysis run timestamp — confirm staleness.",
        "Shorten the aggregation cache interval from 24h to 6h in the scheduler config.",
        "Validate that production overview and plan analysis counts match after next scheduled refresh.",
      ],
    },
  },
  {
    id: "OPS-2470", title: "Production program quantity card not refreshing after scenario publish",
    domain: "Control Tower", team: "Blue Yonder", assignee: "Owen Carter", status: "Open", priority: "High",
    issueType: "System Defect", createdMonth: "Feb 26", ageDays: 91, etaDays: 6, lastUpdated: "2026-05-12",
    summary: "Refresh signal is not propagated after publish.",
    suggestedSolution: {
      pastRef: "OPS-2352", confidence: "Medium", resolvedInDays: 5,
      steps: [
        "Trace the publish event through the Blue Yonder event bus to confirm the refresh signal is being emitted.",
        "Check if the Control Tower subscriber is registered and active for the publish event type.",
        "Patch the event listener to re-subscribe and propagate the refresh signal to the quantity card component.",
        "Test end-to-end: publish a scenario and confirm the card updates within 60 seconds.",
      ],
    },
  },
  {
    id: "OPS-2475", title: "Separate support requests from functional issues in queue",
    domain: "Control Tower", team: "TMS", assignee: "Meera Kapoor", status: "Open", priority: "Low",
    issueType: "Refinement", createdMonth: "Feb 26", ageDays: 86, etaDays: 12, lastUpdated: "2026-05-06",
    summary: "Queue refinement requested by governance.",
    suggestedSolution: {
      pastRef: "OPS-2180", confidence: "Medium", resolvedInDays: 8,
      steps: [
        "Add a dedicated 'Support Request' filter view in the Operations Desk queue.",
        "Update ticket intake form to enforce category selection before submission.",
        "Define a triage SLA: Support Requests to be acknowledged within 1 business day, Issues within 4 hours.",
        "Share updated governance documentation with all team leads.",
      ],
    },
  },
  {
    id: "OPS-2481", title: "Stock seed analysis card should show last run source",
    domain: "Control Tower", team: "Anaplan", assignee: "Luca Martin", status: "In Progress", priority: "Low",
    issueType: "Support Request", createdMonth: "Feb 26", ageDays: 80, etaDays: 9, lastUpdated: "2026-05-11",
    summary: "UI enhancement for auditability of latest stock checks.",
    suggestedSolution: {
      pastRef: "OPS-2271", confidence: "High", resolvedInDays: 6,
      steps: [
        "Add a 'last run source' metadata field to the Anaplan stock seed output payload.",
        "Update the Control Tower UI card template to display source name and timestamp.",
        "Deploy card template update and validate in staging before production push.",
      ],
    },
  },
  {
    id: "OPS-2491", title: "Rounding and cutting <0.01 TP FC data for reporting export",
    domain: "Demand", team: "Blue Yonder", assignee: "Priya Nair", status: "Open", priority: "Medium",
    issueType: "Data Issue", createdMonth: "Mar 26", ageDays: 70, etaDays: 11, lastUpdated: "2026-05-13",
    summary: "Reporting export needs pre-rounding to avoid mismatch.",
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
    id: "OPS-2500", title: "Value measure descriptions mismatch between backend and frontend",
    domain: "Control Tower", team: "Kinaxis", assignee: "Aarav Mehta", status: "Closed", priority: "High",
    issueType: "System Defect", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 67, etaDays: 0,
    lastUpdated: "2026-04-09", summary: "Description map aligned across API payload and UI.",
  },
  {
    id: "OPS-2504", title: "Source file and column information for Kinaxis report files",
    domain: "Supply", team: "TMS", assignee: "Meera Kapoor", status: "Closed", priority: "Medium",
    issueType: "Support Request", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 64, etaDays: 0,
    lastUpdated: "2026-04-13", summary: "Support note completed and handed over.",
  },
  {
    id: "OPS-2507", title: "Solver plan on multiple non-existing sowing slots for ENSA F1",
    domain: "Supply", team: "Anaplan", assignee: "Priya Nair", status: "In Progress", priority: "High",
    issueType: "Issue", createdMonth: "Mar 26", ageDays: 61, etaDays: 5, lastUpdated: "2026-05-14",
    summary: "Solver recommendation refers to invalid sowing slots.",
    suggestedSolution: {
      pastRef: "OPS-2401", confidence: "Medium", resolvedInDays: 7,
      steps: [
        "Export the active sowing slot master data and cross-check against solver plan output for ENSA F1.",
        "Identify and deactivate the non-existing slot references in the Anaplan master data table.",
        "Re-run the solver with updated slot master; confirm no invalid references remain.",
        "Notify the planning team to review ENSA F1 output before next scheduling cycle.",
      ],
    },
  },
  {
    id: "OPS-2512", title: "Actuals rollover treatment for negative actuals in orders",
    domain: "Demand", team: "Blue Yonder", assignee: "Sofia Bennett", status: "Closed", priority: "High",
    issueType: "Data Issue", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 58, etaDays: 0,
    lastUpdated: "2026-04-25", summary: "Negative actuals handling updated in transformation logic.",
  },
  {
    id: "OPS-2518", title: "PRD operational horizon missing on dashboard summary",
    domain: "Control Tower", team: "Kinaxis", assignee: "Daniel Hughes", status: "Open", priority: "Medium",
    issueType: "Refinement", createdMonth: "Mar 26", ageDays: 51, etaDays: 9, lastUpdated: "2026-05-07",
    summary: "Dashboard summary needs operational horizon value.",
    suggestedSolution: {
      pastRef: "OPS-2390", confidence: "High", resolvedInDays: 3,
      steps: [
        "Confirm the PRD operational horizon field is present in the Kinaxis API response payload.",
        "Map the field to the dashboard summary tile configuration.",
        "Deploy the updated tile mapping and validate display in both summary and drill-down views.",
      ],
    },
  },
  {
    id: "OPS-2540", title: "Open demand queue spike after forecast publication cutover",
    domain: "Demand", team: "TMS", assignee: "Meera Kapoor", status: "Escalated", priority: "Critical",
    issueType: "Issue", createdMonth: "Apr 26", ageDays: 37, etaDays: 2, lastUpdated: "2026-05-15",
    summary: "Spike tied to publication cutover and validation backlog.",
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
];

export const ISSUE_TYPE_COLORS: Record<TicketType, string> = {
  Issue: "#0F766E",
  "Data Issue": "#14B8A6",
  "Support Request": "#38BDF8",
  Question: "#64748B",
  "System Defect": "#7C3AED",
  Refinement: "#F59E0B",
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
