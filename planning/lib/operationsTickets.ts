export type TicketStatus = "Open" | "In Progress" | "Blocked" | "Escalated" | "Closed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type TicketType = "Issue" | "Data Issue" | "Support Request" | "Question" | "System Defect" | "Refinement";

export type Ticket = {
  id: string;
  title: string;
  domain: "Demand" | "Supply" | "Control Tower";
  team: "NTT" | "o9" | "Anaplan" | "Relex";
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
};

export const OPERATIONS_TICKETS: Ticket[] = [
  { id: "OPS-2419", title: "Published final FC not rounded to smallest SKU for Trica Spain", domain: "Demand", team: "NTT", assignee: "Aarav Mehta", status: "Open", priority: "Critical", issueType: "Issue", createdMonth: "Nov 25", ageDays: 166, etaDays: 4, lastUpdated: "2026-05-14", summary: "Demand planning output mismatch for Spain FC publication." },
  { id: "OPS-2425", title: "Ustica difference Germany in published final FC", domain: "Demand", team: "NTT", assignee: "Meera Kapoor", status: "In Progress", priority: "High", issueType: "Data Issue", createdMonth: "Dec 25", ageDays: 152, etaDays: 6, lastUpdated: "2026-05-13", summary: "Mismatch between Germany consensus and downstream published values." },
  { id: "OPS-2434", title: "Filtering stays in waiting mode when ENK and BIOS selected together", domain: "Supply", team: "o9", assignee: "Luca Martin", status: "Blocked", priority: "High", issueType: "System Defect", createdMonth: "Dec 25", ageDays: 140, etaDays: 8, lastUpdated: "2026-05-12", summary: "Multi-filter query hangs for a specific product group combination." },
  { id: "OPS-2444", title: "Missing replenishment output for France launch portfolio", domain: "Supply", team: "Anaplan", assignee: "Sofia Bennett", status: "Escalated", priority: "Critical", issueType: "Issue", createdMonth: "Jan 26", ageDays: 125, etaDays: 3, lastUpdated: "2026-05-14", summary: "Replenishment lines not generated for launch portfolio scenario." },
  { id: "OPS-2448", title: "Multiple replenishment lines generated for same material and week", domain: "Supply", team: "Relex", assignee: "Priya Nair", status: "In Progress", priority: "High", issueType: "Issue", createdMonth: "Jan 26", ageDays: 121, etaDays: 7, lastUpdated: "2026-05-10", summary: "Duplicate supply recommendations need rule de-duplication." },
  { id: "OPS-2455", title: "Orders count mismatch between production overview and plan analysis", domain: "Control Tower", team: "o9", assignee: "Daniel Hughes", status: "Open", priority: "Medium", issueType: "Data Issue", createdMonth: "Jan 26", ageDays: 114, etaDays: 10, lastUpdated: "2026-05-08", summary: "Dashboard tile is reading a stale aggregation snapshot." },
  { id: "OPS-2470", title: "Production program quantity card not refreshing after scenario publish", domain: "Control Tower", team: "Relex", assignee: "Owen Carter", status: "Open", priority: "High", issueType: "System Defect", createdMonth: "Feb 26", ageDays: 91, etaDays: 6, lastUpdated: "2026-05-12", summary: "Refresh signal is not propagated after publish." },
  { id: "OPS-2475", title: "Separate support requests from functional issues in queue", domain: "Control Tower", team: "NTT", assignee: "Meera Kapoor", status: "Open", priority: "Low", issueType: "Refinement", createdMonth: "Feb 26", ageDays: 86, etaDays: 12, lastUpdated: "2026-05-06", summary: "Queue refinement requested by governance." },
  { id: "OPS-2481", title: "Stock seed analysis card should show last run source", domain: "Control Tower", team: "Anaplan", assignee: "Luca Martin", status: "In Progress", priority: "Low", issueType: "Support Request", createdMonth: "Feb 26", ageDays: 80, etaDays: 9, lastUpdated: "2026-05-11", summary: "UI enhancement for auditability of latest stock checks." },
  { id: "OPS-2491", title: "Rounding and cutting <0.01 TP FC data for reporting export", domain: "Demand", team: "Relex", assignee: "Priya Nair", status: "Open", priority: "Medium", issueType: "Data Issue", createdMonth: "Mar 26", ageDays: 70, etaDays: 11, lastUpdated: "2026-05-13", summary: "Reporting export needs pre-rounding to avoid mismatch." },
  { id: "OPS-2500", title: "Value measure descriptions mismatch between backend and frontend", domain: "Control Tower", team: "o9", assignee: "Aarav Mehta", status: "Closed", priority: "High", issueType: "System Defect", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 67, etaDays: 0, lastUpdated: "2026-04-09", summary: "Description map aligned across API payload and UI." },
  { id: "OPS-2504", title: "Source file and column information for o9 report files", domain: "Supply", team: "NTT", assignee: "Meera Kapoor", status: "Closed", priority: "Medium", issueType: "Support Request", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 64, etaDays: 0, lastUpdated: "2026-04-13", summary: "Support note completed and handed over." },
  { id: "OPS-2507", title: "Solver plan on multiple non-existing sowing slots for ENSA F1", domain: "Supply", team: "Anaplan", assignee: "Priya Nair", status: "In Progress", priority: "High", issueType: "Issue", createdMonth: "Mar 26", ageDays: 61, etaDays: 5, lastUpdated: "2026-05-14", summary: "Solver recommendation refers to invalid sowing slots." },
  { id: "OPS-2512", title: "Actuals rollover treatment for negative actuals in orders", domain: "Demand", team: "Relex", assignee: "Sofia Bennett", status: "Closed", priority: "High", issueType: "Data Issue", createdMonth: "Mar 26", closedMonth: "Apr 26", ageDays: 58, etaDays: 0, lastUpdated: "2026-04-25", summary: "Negative actuals handling updated in transformation logic." },
  { id: "OPS-2518", title: "PRD operational horizon missing on dashboard summary", domain: "Control Tower", team: "o9", assignee: "Daniel Hughes", status: "Open", priority: "Medium", issueType: "Refinement", createdMonth: "Mar 26", ageDays: 51, etaDays: 9, lastUpdated: "2026-05-07", summary: "Dashboard summary needs operational horizon value." },
  { id: "OPS-2540", title: "Open demand queue spike after forecast publication cutover", domain: "Demand", team: "NTT", assignee: "Meera Kapoor", status: "Escalated", priority: "Critical", issueType: "Issue", createdMonth: "Apr 26", ageDays: 37, etaDays: 2, lastUpdated: "2026-05-15", summary: "Spike tied to publication cutover and validation backlog." }
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
