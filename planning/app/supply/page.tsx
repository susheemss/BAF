"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PackageSearch, Truck, AlertTriangle, CheckCircle2,
  Clock, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import DataDrilldownModal, { TableDrilldown } from "@/components/DataDrilldownModal";
import { ALL_MONTHS, SUPPLIERS_LIST } from "@/lib/loadData";

const WAREHOUSES = ["All", "DEL", "MUM", "BLR"];
const CATEGORIES = ["All", "Personal Care", "Food & Beverages", "Household"];

const SUPPLY_FILTERS: FilterDef[] = [
  { type: "select",  id: "warehouse", label: "Warehouse",  options: WAREHOUSES },
  { type: "select",  id: "category",  label: "Category",   options: CATEGORIES },
  { type: "select",  id: "supplier",  label: "Supplier",   options: SUPPLIERS_LIST },
  { type: "select",  id: "fromMonth", label: "From Month", options: ["All", ...ALL_MONTHS.map((m) => m.replace(" ", "-"))] },
  { type: "select",  id: "toMonth",   label: "To Month",   options: ["All", ...ALL_MONTHS.map((m) => m.replace(" ", "-"))] },
  { type: "toggle",  id: "status",    label: "PO Status",  options: ["All", "Delayed", "In Transit", "Pending", "Delivered"] },
  { type: "search",  id: "search",    label: "PO / SKU" },
];

const DEFAULT_FILTERS = { warehouse: "All", category: "All", supplier: "All", fromMonth: "All", toMonth: "All", status: "All", search: "" };

const STATUS_STYLE: Record<string, string> = {
  Delivered:    "bg-emerald-100 text-emerald-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending:      "bg-amber-100 text-amber-700",
  Delayed:      "bg-red-100 text-red-700",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  Delivered:    <CheckCircle2 size={11} />,
  "In Transit": <Truck size={11} />,
  Pending:      <Clock size={11} />,
  Delayed:      <AlertTriangle size={11} />,
};

type PoRow = {
  po: string; sku: string; supplier: string; warehouse: string;
  category: string; qty: number; poDate: string; expectedDate: string;
  status: string; daysDelay: number; value: number;
};
type CoverRow   = { category: string; avgCover: number; target: number };
type PieRow     = { name: string; value: number; color: string };
type SupplyData = {
  summary: { activePos: number; inventoryValueCr: number };
  poData: PoRow[];
  inventoryCover: CoverRow[];
  poStatusPie: PieRow[];
  latestMonth: string;
};

export default function SupplyPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data,    setData]    = useState<SupplyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [drilldown, setDrilldown] = useState<TableDrilldown | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const set   = (id: string, val: string) => { setFilters((f) => ({ ...f, [id]: val })); setVisibleCount(5); };
  const reset = () => { setFilters(DEFAULT_FILTERS); setVisibleCount(5); };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.warehouse !== "All") params.set("warehouse", filters.warehouse);
      if (filters.fromMonth !== "All") params.set("fromMonth", filters.fromMonth.replace("-", " "));
      if (filters.toMonth   !== "All") params.set("toMonth",   filters.toMonth.replace("-", " "));
      if (filters.category  !== "All") params.set("category",  filters.category);
      const res = await fetch(`/api/planning?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData({
        summary: { activePos: json.summary.activePos, inventoryValueCr: json.summary.inventoryValueCr },
        poData: json.poData,
        inventoryCover: json.inventoryCover,
        poStatusPie: json.poStatusPie,
        latestMonth: json.latestMonth,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filters.warehouse, filters.fromMonth, filters.toMonth, filters.category]);

  useEffect(() => { load(); }, [load]);

  // Client-side filters for PO table
  const filtered = (data?.poData ?? []).filter((p) =>
    (filters.supplier === "All" || p.supplier === filters.supplier) &&
    (filters.status   === "All" || p.status   === filters.status) &&
    (filters.search   === ""    ||
      p.po.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.sku.toLowerCase().includes(filters.search.toLowerCase()))
  );

  const delayed   = filtered.filter((p) => p.status === "Delayed");
  const inTransit = filtered.filter((p) => p.status === "In Transit");
  const totalValue = filtered.reduce((a, b) => a + b.value, 0);

  const openDrilldown = (kpiLabel: string) => {
    const top5 = <T,>(arr: T[]) => arr.slice(0, 5);
    if (kpiLabel === "Active POs") {
      const rows = top5([...filtered].filter((p) => ["In Transit","Pending"].includes(p.status)).sort((a, b) => b.value - a.value));
      setDrilldown({ kpi: "Active POs by Value", subtitle: "Top 5 In Transit + Pending POs — from your CSV data", columns: ["PO #", "SKU", "Supplier", "WH", "Status", "Value (₹)"], rows: rows.map((p) => [p.po, p.sku, p.supplier, p.warehouse, p.status, p.value]) });
    } else if (kpiLabel === "Delayed POs") {
      const rows = filtered.filter((p) => p.status === "Delayed").sort((a, b) => b.value - a.value);
      setDrilldown({ kpi: "Delayed POs", subtitle: "All delayed POs — require immediate action", columns: ["PO #", "SKU", "Supplier", "WH", "Expected Date", "Value (₹)"], rows: rows.map((p) => [p.po, p.sku, p.supplier, p.warehouse, p.expectedDate, p.value]) });
    } else if (kpiLabel === "In Transit") {
      const rows = filtered.filter((p) => p.status === "In Transit").sort((a, b) => b.value - a.value);
      setDrilldown({ kpi: "In-Transit POs", subtitle: "All in-transit POs with expected arrival", columns: ["PO #", "SKU", "Supplier", "WH", "Expected Date", "Value (₹)"], rows: rows.map((p) => [p.po, p.sku, p.supplier, p.warehouse, p.expectedDate, p.value]) });
    } else if (kpiLabel === "Total PO Value") {
      const rows = top5([...filtered].sort((a, b) => b.value - a.value));
      setDrilldown({ kpi: "Highest Value Open POs", subtitle: "Top 5 POs by value — from your CSV data", columns: ["PO #", "SKU", "Supplier", "WH", "Status", "Value (₹)"], rows: rows.map((p) => [p.po, p.sku, p.supplier, p.warehouse, p.status, p.value]) });
    }
  };

  return (
    <AppShell>
      {drilldown && <DataDrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Planning</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Supply Planning</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            PO tracker · Inventory coverage · Replenishment signals
            {data?.latestMonth && <span className="ml-2 text-indigo-400">· Latest: {data.latestMonth}</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <FilterBar filters={SUPPLY_FILTERS} values={filters} onChange={set} onReset={reset} />

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && !data && (
        <div className="mt-8 flex items-center justify-center py-20 text-sm text-slate-400">Loading supply data…</div>
      )}

      {data && (
        <>
          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-4">
            {[
              { label: "Active POs",       value: `${data.summary.activePos}`,                        sub: "In Transit + Pending",    color: "text-indigo-600" },
              { label: "Delayed POs",      value: `${delayed.length}`,                                sub: "require immediate action", color: "text-red-600"    },
              { label: "In Transit",       value: `${inTransit.length} POs`,                          sub: "expected soon",           color: "text-blue-600"   },
              { label: "Total PO Value",   value: `₹${(totalValue / 100000).toFixed(1)}L`,            sub: "filtered open orders",    color: "text-emerald-600" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="kpi-card cursor-pointer hover:shadow-md hover:border-indigo-300 transition-shadow relative"
                onClick={() => openDrilldown(item.label)}
                title={`Click to drill down into ${item.label}`}
              >
                <span className="absolute top-2 right-2 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">drill down ↗</span>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{item.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-800 mb-4">Inventory Days of Cover by Category</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.inventoryCover} barGap={8}>
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 35]} tick={{ fontSize: 11 }} unit="d" />
                  <Tooltip formatter={(v: number) => `${v} days`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="target"   name="Target (21d)"  fill="#6366F1" opacity={0.3} radius={[4,4,0,0]} />
                  <Bar dataKey="avgCover" name="Avg Cover" radius={[4,4,0,0]}>
                    {data.inventoryCover.map((entry) => (
                      <Cell key={entry.category} fill={entry.avgCover >= entry.target ? "#10B981" : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-800 mb-4">PO Status Mix</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.poStatusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" nameKey="name" paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {data.poStatusPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Delayed PO Alert ── */}
          {delayed.length > 0 && (
            <div className="card p-4 border-l-4 border-red-500 bg-red-50 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{delayed.length} POs are delayed — immediate action required</p>
                  <p className="text-xs text-red-600 mt-1">
                    {delayed.map((p) => p.po).join(" · ")}
                  </p>
                  <p className="text-xs text-red-700 font-medium mt-2">
                    → Contact {[...new Set(delayed.map((p) => p.supplier))].join(", ")} for expedited dispatch
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── PO Table ── */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <PackageSearch size={15} className="text-indigo-400" />
              <p className="text-sm font-semibold text-slate-800">Purchase Order Tracker</p>
              <span className="ml-auto text-xs text-slate-400">
                {Math.min(visibleCount, filtered.length)} of {filtered.length} POs
              </span>
            </div>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No POs match the current filters</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["PO #", "SKU", "Supplier", "WH", "Qty", "PO Date", "Expected", "Value (₹)", "Status"].map((h) => (
                          <th key={h} className="text-left text-[11px] uppercase tracking-wide text-slate-400 font-semibold pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, visibleCount).map((row, i) => (
                        <motion.tr key={`${row.po}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-4 text-xs font-mono text-slate-500">{row.po}</td>
                          <td className="py-3 pr-4 text-xs font-mono text-slate-400">{row.sku}</td>
                          <td className="py-3 pr-4 text-xs text-slate-500 max-w-[140px] truncate">{row.supplier}</td>
                          <td className="py-3 pr-4">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{row.warehouse}</span>
                          </td>
                          <td className="py-3 pr-4 text-slate-700">{row.qty.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-xs text-slate-500">{row.poDate}</td>
                          <td className="py-3 pr-4 text-xs text-slate-500">{row.expectedDate}</td>
                          <td className="py-3 pr-4 text-slate-700">₹{row.value.toLocaleString()}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[row.status] ?? "bg-slate-100 text-slate-600"}`}>
                              {STATUS_ICON[row.status]}
                              {row.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visibleCount < filtered.length && (
                  <div className="mt-4 flex items-center justify-center">
                    <button
                      onClick={() => setVisibleCount((c) => c + 5)}
                      className="text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      Load more ({filtered.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
