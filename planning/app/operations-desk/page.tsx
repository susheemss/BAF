"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, LayoutGrid, SearchCheck, Ticket, TimerReset, UserRound, ChevronDown, ChevronUp, Lightbulb, CheckCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import { getPriorityRank, getPriorityTone, getStatusTone, ISSUE_TYPE_COLORS, OPERATIONS_TICKETS, type Ticket as OpsTicket } from "@/lib/operationsTickets";

const FILTERS: FilterDef[] = [
  { type: "select", id: "status", label: "Status", options: ["All", "Open", "In Progress", "Blocked", "Escalated", "Closed"] },
  { type: "select", id: "team", label: "Team", options: ["All", "TMS", "Kinaxis", "Anaplan", "Blue Yonder"] },
  { type: "select", id: "domain", label: "Domain", options: ["All", "Demand", "Supply", "Control Tower"] },
  { type: "toggle", id: "priority", label: "Priority", options: ["All", "Critical", "High", "Medium", "Low"] },
  { type: "search", id: "search", label: "Ticket / Owner" },
];

const DEFAULT_FILTERS = { status: "All", team: "All", domain: "All", priority: "All", search: "" };

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

export default function OperationsDeskPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [approvedTickets, setApprovedTickets] = useState<Set<string>>(new Set());
  const set = (id: string, value: string) => setFilters((prev) => ({ ...prev, [id]: value }));
  const reset = () => setFilters(DEFAULT_FILTERS);

  const handleApprove = (id: string) => {
    setApprovedTickets((prev) => new Set(prev).add(id));
    setExpandedTicket(null);
  };

  const filtered = OPERATIONS_TICKETS.filter((ticket) => {
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
  const trend = buildMonthlyTrend(OPERATIONS_TICKETS);
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
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">Queue Summary</p>
          <p className="mt-1 max-w-[18rem] text-sm text-slate-600">{openTickets.length} active tickets across {teamCount} teams.</p>
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

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Open Ticket Queue</p>
            <p className="text-xs text-slate-500">Priority-first working table with owner, age, ETA, and current status.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{queue.length} active tickets</span>
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
                      <td className="py-3 pr-4"><div><p className="font-semibold text-slate-900">{ticket.id}</p><p className="text-xs text-slate-400">{ticket.issueType}</p></div></td>
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
    </AppShell>
  );
}
