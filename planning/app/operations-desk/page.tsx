"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Clock3, LayoutGrid, SearchCheck, Ticket, TimerReset, UserRound, ChevronDown, ChevronUp, Lightbulb, CheckCheck, ShieldCheck, AlertOctagon, Database, Wrench, Zap, HelpCircle, X, Plus, History } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import { getPriorityRank, getPriorityTone, getStatusTone, ISSUE_TYPE_COLORS, CATEGORY_META, OPERATIONS_TICKETS, categorizeTicket, findSimilarTickets, type Ticket as OpsTicket, type TicketType, type TicketPriority, type SuggestedSolution } from "@/lib/operationsTickets";

const FILTERS: FilterDef[] = [
  { type: "select", id: "status", label: "Status", options: ["All", "Open", "In Progress", "Blocked", "Escalated", "Closed"] },
  { type: "select", id: "team", label: "Team", options: ["All", "TMS", "Kinaxis", "Anaplan", "Blue Yonder"] },
  { type: "select", id: "domain", label: "Domain", options: ["All", "Demand", "Supply", "Control Tower"] },
  { type: "toggle", id: "priority", label: "Priority", options: ["All", "Critical", "High", "Medium", "Low"] },
  { type: "search", id: "search", label: "Ticket / Owner" },
];

const DEFAULT_FILTERS = { category: "All", status: "All", team: "All", domain: "All", priority: "All", search: "" };

const CATEGORY_ICONS: Record<TicketType, React.ElementType> = {
  Authorization:         ShieldCheck,
  "System Issue":        AlertOctagon,
  "Data Issue":          Database,
  Refinement:            Wrench,
  "Feature Development": Zap,
  "User Question":       HelpCircle,
};

const CATEGORY_STYLES: Record<TicketType, { bg: string; text: string; border: string; dot: string }> = {
  Authorization:         { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100", dot: "bg-purple-500" },
  "System Issue":        { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-100",    dot: "bg-red-500" },
  "Data Issue":          { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100",  dot: "bg-amber-500" },
  Refinement:            { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-100",    dot: "bg-sky-500" },
  "Feature Development": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100",dot: "bg-emerald-500" },
  "User Question":       { bg: "bg-slate-100",  text: "text-slate-700",   border: "border-slate-200",  dot: "bg-slate-500" },
};

function MetricCard({ title, value, subtitle, icon: Icon, accent }: { title: string; value: string; subtitle: string; icon: React.ElementType; accent: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function buildMonthlyTrend(tickets: OpsTicket[]) {
  const monthOrder = ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26"];
  let runningOpen = 0;
  return monthOrder.map((month) => {
    const opened = tickets.filter((ticket) => ticket.createdMonth === month).length;
    const closed = tickets.filter((ticket) => ticket.closedMonth === month).length;
    runningOpen += opened - closed;
    return { month, opened, closed, openBacklog: runningOpen };
  });
}

function buildAssigneeLoad(tickets: OpsTicket[]) {
  const active = tickets.filter((ticket) => ticket.status !== "Closed");
  const rows = [...new Set(active.map((ticket) => ticket.assignee))].map((assignee) => {
    const mine = active.filter((ticket) => ticket.assignee === assignee);
    return {
      assignee,
      openTickets: mine.length,
      averageAge: Number((mine.reduce((sum, ticket) => sum + ticket.ageDays, 0) / mine.length).toFixed(1)),
    };
  });
  return rows.sort((a, b) => b.openTickets - a.openTickets || b.averageAge - a.averageAge).slice(0, 8);
}

function buildIssueMix(tickets: OpsTicket[]) {
  const active = tickets.filter((ticket) => ticket.status !== "Closed");
  return Object.entries(
    active.reduce<Record<string, number>>((acc, ticket) => {
      acc[ticket.issueType] = (acc[ticket.issueType] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value, color: ISSUE_TYPE_COLORS[name as keyof typeof ISSUE_TYPE_COLORS] ?? "#94A3B8" }))
    .sort((a, b) => b.value - a.value);
}

function buildTeamBacklog(tickets: OpsTicket[]) {
  const active = tickets.filter((ticket) => ticket.status !== "Closed");
  return ["TMS", "Kinaxis", "Anaplan", "Blue Yonder"].map((team) => {
    const mine = active.filter((ticket) => ticket.team === team);
    return {
      team,
      openTickets: mine.length,
      maxAge: mine.length ? Math.max(...mine.map((ticket) => ticket.ageDays)) : 0,
      escalated: mine.filter((ticket) => ticket.status === "Escalated").length,
    };
  }).filter((row) => row.openTickets > 0);
}

function SolutionPanel({ ticket, onApprove }: { ticket: OpsTicket; onApprove: (id: string) => void }) {
  const s = ticket.suggestedSolution!;
  const confColor = s.confidence === "High" ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : s.confidence === "Medium" ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-slate-500 bg-slate-100 border-slate-200";
  return (
    <tr>
      <td colSpan={11} className="px-4 pb-4 pt-0">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-indigo-500" />
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Suggested Resolution</p>
            <span className="ml-1 text-[10px] text-slate-400">based on</span>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{s.pastRef}</span>
            <span className={`ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${confColor}`}>{s.confidence} confidence</span>
            <span className="ml-auto text-[10px] text-slate-400">Resolved in {s.resolvedInDays}d last time</span>
          </div>
          <ol className="space-y-1.5 mb-4">
            {s.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">{i + 1}</span>
                <p className="text-xs text-slate-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(ticket.id)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <CheckCheck size={13} /> Approve &amp; Apply Solution
            </button>
            <span className="text-[11px] text-slate-400">or close this panel to choose a different approach</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as TicketType[];

let _nextId = 2580;
function nextTicketId() { return `OPS-${_nextId++}`; }

function NewTicketPanel({ onClose, onSubmit }: { onClose: () => void; onSubmit: (t: OpsTicket) => void }) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam]             = useState<OpsTicket["team"]>("Blue Yonder");
  const [domain, setDomain]         = useState<OpsTicket["domain"]>("Supply");
  const [priority, setPriority]     = useState<TicketPriority>("Medium");
  const [catResult, setCatResult]   = useState<ReturnType<typeof categorizeTicket> | null>(null);
  const [similar, setSimilar]       = useState<OpsTicket[]>([]);
  const [picked, setPicked]         = useState<{ sol: SuggestedSolution; ref: string } | null>(null);

  useEffect(() => {
    if (title.trim().length < 5) { setCatResult(null); setSimilar([]); return; }
    const res = categorizeTicket(title);
    setCatResult(res);
    setSimilar(findSimilarTickets(title, res.category, 3));
    setPicked(null);
  }, [title]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const category = catResult?.category ?? "User Question";
    const ticket: OpsTicket = {
      id: nextTicketId(),
      title: title.trim(),
      summary: description.trim() || title.trim(),
      domain, team, priority,
      issueType: category,
      assignee: "Unassigned",
      status: "Open",
      createdMonth: "May 26",
      ageDays: 0,
      etaDays: CATEGORY_META[category].slaHours ? Math.ceil(CATEGORY_META[category].slaHours! / 24) : 5,
      lastUpdated: new Date().toISOString().split("T")[0],
      suggestedSolution: picked ? { ...picked.sol, pastRef: picked.ref } : undefined,
    };
    onSubmit(ticket);
    onClose();
  };

  const confBadge = (c?: "High" | "Medium" | "Low") =>
    c === "High"   ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : c === "Medium" ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-slate-600 bg-slate-100 border-slate-200";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-[520px] flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">Operations Desk</p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">New Ticket</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Issue Title <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the issue in one sentence…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
            />
          </div>

          {/* Live auto-categorisation */}
          {catResult && (
            <div className={`rounded-2xl border px-4 py-3 ${CATEGORY_STYLES[catResult.category].border} ${CATEGORY_STYLES[catResult.category].bg}`}>
              <div className="flex flex-wrap items-center gap-2">
                {(() => { const Icon = CATEGORY_ICONS[catResult.category]; return <Icon size={13} className={CATEGORY_STYLES[catResult.category].text} />; })()}
                <p className={`text-xs font-bold ${CATEGORY_STYLES[catResult.category].text}`}>
                  Auto-categorised: {catResult.category}
                </p>
                <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${confBadge(catResult.confidence)}`}>
                  {catResult.confidence} confidence
                </span>
              </div>
              {catResult.matchedKeywords.length > 0 && (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Matched: {catResult.matchedKeywords.slice(0, 5).join(", ")}
                </p>
              )}
              <p className="mt-1 text-[10px] text-slate-400">SLA: {CATEGORY_META[catResult.category].sla}</p>
            </div>
          )}

          {/* Team / Domain / Priority */}
          <div className="grid grid-cols-3 gap-3">
            {([
              ["Team", team, setTeam, ["TMS", "Kinaxis", "Anaplan", "Blue Yonder"]],
              ["Domain", domain, setDomain, ["Demand", "Supply", "Control Tower"]],
              ["Priority", priority, setPriority, ["Critical", "High", "Medium", "Low"]],
            ] as const).map(([label, val, setter, opts]) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
                <select
                  value={val}
                  onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
                >
                  {(opts as readonly string[]).map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Additional context, impact, steps to reproduce…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
            />
          </div>

          {/* Similar past tickets */}
          {similar.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History size={13} className="text-indigo-400" />
                <p className="text-xs font-semibold text-slate-700">Similar Past Tickets</p>
                <span className="ml-auto text-[10px] text-slate-400">Click to use a past solution</span>
              </div>
              <div className="space-y-3">
                {similar.map((t) => {
                  const s = t.suggestedSolution!;
                  const isPicked = picked?.ref === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`rounded-2xl border p-4 transition-all ${isPicked ? "border-indigo-300 bg-indigo-50/60 shadow-sm" : "border-slate-100 bg-slate-50 hover:border-indigo-200"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold text-indigo-600">{t.id}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${confBadge(s.confidence)}`}>{s.confidence} match</span>
                        <span className="text-[10px] text-slate-400 ml-auto">Resolved in {s.resolvedInDays}d</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 leading-snug mb-2">{t.title}</p>
                      <ol className="space-y-1 mb-3">
                        {s.steps.slice(0, 2).map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-600">{i + 1}</span>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{step}</p>
                          </li>
                        ))}
                        {s.steps.length > 2 && (
                          <p className="text-[11px] text-slate-400 pl-6">+{s.steps.length - 2} more steps</p>
                        )}
                      </ol>
                      <button
                        onClick={() => setPicked(isPicked ? null : { sol: s, ref: t.id })}
                        className={`w-full rounded-xl py-1.5 text-xs font-semibold transition-colors ${isPicked ? "bg-indigo-600 text-white" : "border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50"}`}
                      >
                        {isPicked ? "✓ Solution selected" : "Use this solution"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No similar tickets message */}
          {catResult && similar.length === 0 && title.trim().length >= 5 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <History size={16} className="mx-auto mb-1.5 text-slate-300" />
              <p className="text-xs text-slate-400">No similar past tickets found. This ticket will start a new resolution record.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
            Create Ticket{picked ? " with Solution" : ""}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

function CategoryStrip({ tickets, onFilter }: { tickets: OpsTicket[]; onFilter: (cat: string) => void }) {
  const active = tickets.filter((t) => t.status !== "Closed");
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {ALL_CATEGORIES.map((cat) => {
        const count = active.filter((t) => t.issueType === cat).length;
        const s = CATEGORY_STYLES[cat];
        const Icon = CATEGORY_ICONS[cat];
        const meta = CATEGORY_META[cat];
        return (
          <button
            key={cat}
            onClick={() => onFilter(cat)}
            className={`rounded-2xl border ${s.border} ${s.bg} px-4 py-3 text-left transition-all hover:shadow-md hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={s.text} />
              <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${s.text}`}>{cat}</span>
            </div>
            <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
            <p className="mt-1 text-[10px] text-slate-400">{meta.sla}</p>
          </button>
        );
      })}
    </div>
  );
}

export default function OperationsDeskPage() {
  const [allTickets, setAllTickets] = useState<OpsTicket[]>(() => OPERATIONS_TICKETS);
  const [panelOpen, setPanelOpen]   = useState(false);
  const [filters, setFilters]       = useState(DEFAULT_FILTERS);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [approvedTickets, setApprovedTickets] = useState<Set<string>>(new Set());
  const [newTicketIds, setNewTicketIds] = useState<Set<string>>(new Set());
  const set = (id: string, value: string) => setFilters((prev) => ({ ...prev, [id]: value }));
  const reset = () => setFilters(DEFAULT_FILTERS);
  const filterByCategory = (cat: string) => setFilters((prev) => ({ ...prev, category: cat }));

  const handleNewTicket = (ticket: OpsTicket) => {
    setAllTickets((prev) => [ticket, ...prev]);
    setNewTicketIds((prev) => new Set(prev).add(ticket.id));
  };

  const handleApprove = (id: string) => {
    setApprovedTickets((prev) => new Set(prev).add(id));
    setExpandedTicket(null);
  };

  const filtered = allTickets.filter((ticket) => {
    if (filters.category !== "All" && ticket.issueType !== filters.category) return false;
    if (filters.status !== "All" && ticket.status !== filters.status) return false;
    if (filters.team !== "All" && ticket.team !== filters.team) return false;
    if (filters.domain !== "All" && ticket.domain !== filters.domain) return false;
    if (filters.priority !== "All" && ticket.priority !== filters.priority) return false;
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return `${ticket.id} ${ticket.title} ${ticket.assignee} ${ticket.issueType}`.toLowerCase().includes(q);
  });

  const openTickets = filtered.filter((ticket) => ticket.status !== "Closed");
  const closedTickets = filtered.filter((ticket) => ticket.status === "Closed");
  const escalatedTickets = filtered.filter((ticket) => ticket.status === "Escalated");
  const avgOpenAge = openTickets.length ? Number((openTickets.reduce((sum, ticket) => sum + ticket.ageDays, 0) / openTickets.length).toFixed(1)) : 0;
  const avgEta = openTickets.length ? Number((openTickets.reduce((sum, ticket) => sum + ticket.etaDays, 0) / openTickets.length).toFixed(1)) : 0;
  const atRiskCount = openTickets.filter((ticket) => ticket.priority === "Critical" || ticket.ageDays > 120 || ticket.status === "Blocked").length;
  // counts for tabs — exclude category filter so each tab always shows its real count
  const openForCounts = allTickets.filter((t) => {
    if (t.status === "Closed") return false;
    if (filters.status !== "All" && t.status !== filters.status) return false;
    if (filters.team !== "All" && t.team !== filters.team) return false;
    if (filters.domain !== "All" && t.domain !== filters.domain) return false;
    if (filters.priority !== "All" && t.priority !== filters.priority) return false;
    if (!filters.search) return true;
    return `${t.id} ${t.title} ${t.assignee} ${t.issueType}`.toLowerCase().includes(filters.search.toLowerCase());
  });

  const trend = buildMonthlyTrend(allTickets);
  const topOwners = buildAssigneeLoad(filtered);
  const issueMix = buildIssueMix(filtered);
  const teamBacklog = buildTeamBacklog(filtered);
  const teamCount = new Set(openTickets.map((ticket) => ticket.team)).size;
  const queue = [...openTickets].sort((a, b) => {
    const priorityGap = getPriorityRank(b.priority) - getPriorityRank(a.priority);
    return priorityGap !== 0 ? priorityGap : b.ageDays - a.ageDays;
  });

  return (
    <AppShell>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Operations Desk</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Operational Ticket Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Open backlog, ownership, aging, and closure performance in one view.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <Plus size={15} /> New Ticket
          </button>
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">Queue Summary</p>
            <p className="mt-1 max-w-[18rem] text-sm text-slate-600">{openTickets.length} active tickets across {teamCount} teams.</p>
          </div>
        </div>
      </div>

      <FilterBar filters={FILTERS} values={filters} onChange={set} onReset={reset} />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MetricCard title="Open Tickets" value={String(openTickets.length)} subtitle="Current active backlog" icon={Ticket} accent="bg-amber-50 text-amber-600" />
        <MetricCard title="Escalations" value={String(escalatedTickets.length)} subtitle="Leadership attention required" icon={AlertTriangle} accent="bg-violet-50 text-violet-600" />
        <MetricCard title="Average Open Age" value={`${avgOpenAge}d`} subtitle="Mean aging across active items" icon={Clock3} accent="bg-blue-50 text-blue-600" />
        <MetricCard title="Average ETA" value={`${avgEta}d`} subtitle="Expected time to closure" icon={TimerReset} accent="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Closed Items" value={String(closedTickets.length)} subtitle="Resolved in current filtered view" icon={CheckCircle2} accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="card p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-900">Open and Closed Trend</p>
            <p className="text-xs text-slate-500">Monthly creation, closure, and open backlog.</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={trend} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="opened" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="closed" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="openBacklog" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-6">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <LayoutGrid size={16} className="text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Issue Type Mix</p>
                <p className="text-xs text-slate-500">Open incidents by category.</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={issueMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3}>
                  {issueMix.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-2">
              {issueMix.map((entry) => (
                <span key={entry.name} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name} - {entry.value}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <SearchCheck size={16} className="text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Risk Snapshot</p>
                <p className="text-xs text-slate-500">Items needing action now.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-red-50 px-3 py-3"><p className="text-[11px] uppercase tracking-wide text-red-500">At Risk</p><p className="mt-1 text-2xl font-bold text-red-700">{atRiskCount}</p></div>
              <div className="rounded-2xl bg-slate-100 px-3 py-3"><p className="text-[11px] uppercase tracking-wide text-slate-500">Owners</p><p className="mt-1 text-2xl font-bold text-slate-800">{new Set(openTickets.map((t) => t.assignee)).size}</p></div>
              <div className="rounded-2xl bg-emerald-50 px-3 py-3"><p className="text-[11px] uppercase tracking-wide text-emerald-600">Teams</p><p className="mt-1 text-2xl font-bold text-emerald-700">{teamCount}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={16} className="text-indigo-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Open Incidents by Assignee</p>
              <p className="text-xs text-slate-500">Ticket load and average aging for busiest owners.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topOwners} layout="vertical" barSize={16} margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="assignee" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="openTickets" fill="#4F46E5" radius={[0, 8, 8, 0]} />
              <Bar dataKey="averageAge" fill="#F59E0B" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <LayoutGrid size={16} className="text-indigo-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Backlog by Team</p>
              <p className="text-xs text-slate-500">Open load, max aging, and escalation pressure by team.</p>
            </div>
          </div>
          <div className="space-y-3">
            {teamBacklog.map((row) => (
              <div key={row.team} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.team}</p>
                    <p className="text-xs text-slate-500">{row.openTickets} open tickets - max aging {row.maxAge} days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {row.escalated > 0 && <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-700">{row.escalated} escalated</span>}
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">{row.openTickets} active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category tab bar */}
      <div className="flex items-end gap-0 overflow-x-auto border-b-2 border-slate-100 mb-0">
        {(["All", ...ALL_CATEGORIES] as (TicketType | "All")[]).map((cat) => {
          const isAll = cat === "All";
          const count = isAll
            ? openForCounts.length
            : openForCounts.filter((t) => t.issueType === cat).length;
          const s = !isAll ? CATEGORY_STYLES[cat as TicketType] : null;
          const Icon = !isAll ? CATEGORY_ICONS[cat as TicketType] : null;
          const isActive = (isAll && filters.category === "All") || filters.category === cat;
          return (
            <button
              key={cat}
              onClick={() => filterByCategory(isAll ? "All" : (cat as string))}
              className={`flex shrink-0 items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 -mb-0.5 transition-all whitespace-nowrap ${
                isActive
                  ? isAll
                    ? "border-indigo-500 text-indigo-700 bg-indigo-50/50 rounded-t-xl"
                    : `border-current ${s!.text} rounded-t-xl`
                  : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50/60 rounded-t-xl"
              }`}
            >
              {Icon && <Icon size={12} />}
              {cat}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive
                  ? isAll ? "bg-indigo-100 text-indigo-600" : `${s!.bg} ${s!.text}`
                  : "bg-slate-100 text-slate-500"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="card rounded-tl-none p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {filters.category === "All" ? "All Open Tickets" : filters.category}
            </p>
            <p className="text-xs text-slate-500">Priority-first · owner · age · ETA · status</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{queue.length} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                {["Ticket", "Issue", "Domain", "Team", "Assignee", "Status", "Priority", "Age", "ETA", "Last Update", "Solution"].map((label) => (
                  <th key={label} className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map((ticket) => {
                const isExpanded = expandedTicket === ticket.id;
                const isApproved = approvedTickets.has(ticket.id);
                return (
                  <>
                    <tr key={ticket.id} className={`border-b border-slate-50 align-top hover:bg-slate-50/70 ${isExpanded ? "bg-indigo-50/30" : ""}`}>
                      <td className="py-3 pr-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900">{ticket.id}</p>
                            {newTicketIds.has(ticket.id) && (
                              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600">New</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{ticket.issueType}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4"><div className="max-w-[320px]"><p className="font-medium text-slate-800">{ticket.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{ticket.summary}</p></div></td>
                      <td className="py-3 pr-4 text-slate-600">{ticket.domain}</td>
                      <td className="py-3 pr-4 text-slate-600">{ticket.team}</td>
                      <td className="py-3 pr-4 text-slate-700">{ticket.assignee}</td>
                      <td className="py-3 pr-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(ticket.status)}`}>{ticket.status}</span></td>
                      <td className="py-3 pr-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityTone(ticket.priority)}`}>{ticket.priority}</span></td>
                      <td className="py-3 pr-4"><span className={`font-semibold ${ticket.ageDays > 120 ? "text-red-600" : ticket.ageDays > 60 ? "text-amber-600" : "text-slate-700"}`}>{ticket.ageDays}d</span></td>
                      <td className="py-3 pr-4 text-slate-700">{ticket.etaDays}d</td>
                      <td className="py-3 pr-4 text-slate-500">{ticket.lastUpdated}</td>
                      <td className="py-3">
                        {ticket.suggestedSolution ? (
                          isApproved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                              <CheckCheck size={11} /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                              className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600 transition-colors"
                            >
                              <Lightbulb size={11} />
                              Solution
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && ticket.suggestedSolution && (
                      <SolutionPanel ticket={ticket} onApprove={handleApprove} />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {panelOpen && (
        <NewTicketPanel onClose={() => setPanelOpen(false)} onSubmit={handleNewTicket} />
      )}
    </AppShell>
  );
}
