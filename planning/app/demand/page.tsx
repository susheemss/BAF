"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, PackageSearch, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import DataDrilldownModal, { TableDrilldown } from "@/components/DataDrilldownModal";
import { ALL_MONTHS } from "@/lib/loadData";

const WAREHOUSES  = ["All", "DEL", "MUM", "BLR"];
const CATEGORIES  = ["All", "Personal Care", "Food & Beverages", "Household"];

const DEMAND_FILTERS: FilterDef[] = [
  { type: "select",  id: "warehouse", label: "Warehouse",  options: WAREHOUSES },
  { type: "select",  id: "category",  label: "Category",   options: CATEGORIES },
  { type: "select",  id: "fromMonth", label: "From Month", options: ["All", ...ALL_MONTHS] },
  { type: "select",  id: "toMonth",   label: "To Month",   options: ["All", ...ALL_MONTHS] },
  { type: "toggle",  id: "risk",      label: "Risk Level", options: ["All", "High", "Medium", "Low"] },
  { type: "search",  id: "search",    label: "SKU / Product" },
];

const DEFAULT_FILTERS = { warehouse: "All", category: "All", fromMonth: "All", toMonth: "All", risk: "All", search: "" };

const RISK_COLORS: Record<string, string> = {
  High:   "#EF4444",
  Medium: "#F59E0B",
  Low:    "#10B981",
};

type SkuRow = {
  sku: string; warehouse: string; category: string;
  daysOfCover: number; risk: string; stockOnHand: number;
  demandPlan: number; variance: number;
};
type TrendRow   = { month: string; plan: number; actual: number; variance: number };
type CategoryRow = { category: string; plan: number; actual: number; variance: number };
type PlanningData = {
  summary: { totalSkus: number; stockoutRiskHigh: number; stockoutRiskMed: number; avgDaysOfCover: number; demandVariancePct: number };
  monthlyTrend: TrendRow[];
  categoryMix: CategoryRow[];
  skuRisks: SkuRow[];
  latestMonth: string;
};

export default function DemandPage() {
  const [filters,  setFilters]  = useState(DEFAULT_FILTERS);
  const [data,     setData]     = useState<PlanningData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
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
      if (filters.fromMonth !== "All") params.set("fromMonth", filters.fromMonth);
      if (filters.toMonth   !== "All") params.set("toMonth",   filters.toMonth);
      if (filters.category  !== "All") params.set("category",  filters.category);
      const res = await fetch(`/api/planning?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filters.warehouse, filters.fromMonth, filters.toMonth, filters.category]);

  useEffect(() => { load(); }, [load]);

  // Client-side risk + search filter on SKU table
  const skuRisks = (data?.skuRisks ?? []).filter((s) =>
    (filters.risk   === "All" || s.risk      === filters.risk) &&
    (filters.search === ""    || s.sku.toLowerCase().includes(filters.search.toLowerCase()))
  );

  const highCount   = skuRisks.filter((s) => s.risk === "High").length;
  const mediumCount = skuRisks.filter((s) => s.risk === "Medium").length;

  const openDrilldown = (kpiLabel: string) => {
    if (!data) return;
    const top5 = <T,>(arr: T[]) => arr.slice(0, 5);

    if (kpiLabel === "High Stockout Risk") {
      const rows = top5([...data.skuRisks].filter((s) => s.risk === "High").sort((a, b) => a.daysOfCover - b.daysOfCover));
      setDrilldown({ kpi: "High Stockout Risk SKUs", subtitle: "Top 5 SKUs with fewest days of cover — from your CSV data", columns: ["SKU", "WH", "Category", "Stock on Hand", "Days of Cover"], rows: rows.map((s) => [s.sku, s.warehouse, s.category, s.stockOnHand, s.daysOfCover]) });
    } else if (kpiLabel === "Medium Risk SKUs") {
      const rows = top5([...data.skuRisks].filter((s) => s.risk === "Medium").sort((a, b) => a.daysOfCover - b.daysOfCover));
      setDrilldown({ kpi: "Medium Risk SKUs", subtitle: "Top 5 approaching stockout threshold — from your CSV data", columns: ["SKU", "WH", "Category", "Stock on Hand", "Days of Cover"], rows: rows.map((s) => [s.sku, s.warehouse, s.category, s.stockOnHand, s.daysOfCover]) });
    } else if (kpiLabel === "Demand vs Plan") {
      const rows = top5([...data.monthlyTrend].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)));
      setDrilldown({ kpi: "Months with Highest Demand Variance", subtitle: "Top 5 months where actual deviated most from plan", columns: ["Month", "Plan", "Actual", "Variance %"], rows: rows.map((r) => [r.month, r.plan, r.actual, r.variance]) });
    } else if (kpiLabel === "Total SKUs Tracked") {
      const rows = top5([...data.skuRisks].sort((a, b) => b.demandPlan - a.demandPlan));
      setDrilldown({ kpi: "Top SKUs by Demand Plan Volume", subtitle: "5 highest-demand SKUs in the latest month", columns: ["SKU", "WH", "Category", "Demand Plan", "Risk"], rows: rows.map((s) => [s.sku, s.warehouse, s.category, s.demandPlan, s.risk]) });
    }
  };

  return (
    <AppShell>
      {drilldown && <DataDrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Planning</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Demand Planning</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Demand vs plan · Stockout risk · SKU-level view
            {data?.latestMonth && <span className="ml-2 text-indigo-400">· Latest: {data.latestMonth}</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <FilterBar filters={DEMAND_FILTERS} values={filters} onChange={set} onReset={reset} />

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && !data && (
        <div className="mt-8 flex items-center justify-center py-20 text-sm text-slate-400">Loading demand data…</div>
      )}

      {data && (
        <>
          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-4">
            {[
              { label: "Total SKUs Tracked",  value: `${data.summary.totalSkus}`,             sub: "in latest month",       icon: PackageSearch, color: "text-indigo-600" },
              { label: "Demand vs Plan",       value: data.monthlyTrend.length ? `${data.monthlyTrend[data.monthlyTrend.length - 1].variance > 0 ? "+" : ""}${data.monthlyTrend[data.monthlyTrend.length - 1].variance}%` : "—", sub: "latest month", icon: TrendingUp, color: data.monthlyTrend.length && data.monthlyTrend[data.monthlyTrend.length - 1].variance > 0 ? "text-amber-600" : "text-emerald-600" },
              { label: "High Stockout Risk",   value: `${data.summary.stockoutRiskHigh} SKUs`, sub: "< safety stock threshold", icon: AlertTriangle, color: "text-red-600" },
              { label: "Medium Risk SKUs",     value: `${data.summary.stockoutRiskMed} SKUs`,  sub: "approaching threshold",   icon: AlertTriangle, color: "text-amber-600" },
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
              <p className="text-sm font-semibold text-slate-800 mb-4">Monthly Demand — Plan vs Actual</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${(v / 1000).toFixed(1)}K units`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="plan"   name="Plan"   stroke="#6366F1" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-800 mb-4">Demand by Category — Plan vs Actual</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.categoryMix} barGap={4}>
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${(v / 1000).toFixed(1)}K units`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="plan"   name="Plan"   fill="#6366F1" radius={[4, 4, 0, 0]} opacity={0.7} />
                  <Bar dataKey="actual" name="Actual" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── SKU Stockout Risk Table ── */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <PackageSearch size={15} className="text-indigo-400" />
              <p className="text-sm font-semibold text-slate-800">SKU Stockout Risk Tracker</p>
              <span className="ml-auto text-xs text-slate-400">
                {Math.min(visibleCount, skuRisks.length)} of {skuRisks.length} SKUs
              </span>
            </div>
            {skuRisks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No SKUs match the current filters</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["SKU", "Category", "WH", "Stock on Hand", "Demand Plan", "Days of Cover", "Variance", "Risk"].map((h) => (
                          <th key={h} className="text-left text-[11px] uppercase tracking-wide text-slate-400 font-semibold pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {skuRisks.slice(0, visibleCount).map((row, i) => (
                        <motion.tr key={`${row.sku}-${row.warehouse}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-4 text-xs font-mono text-slate-500">{row.sku}</td>
                          <td className="py-3 pr-4 text-xs text-slate-500">{row.category}</td>
                          <td className="py-3 pr-4">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{row.warehouse}</span>
                          </td>
                          <td className="py-3 pr-4 text-slate-700">{row.stockOnHand.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-slate-700">{row.demandPlan.toLocaleString()}</td>
                          <td className="py-3 pr-4">
                            <span className={`font-bold ${row.daysOfCover < 7 ? "text-red-600" : row.daysOfCover < 14 ? "text-amber-600" : "text-emerald-600"}`}>
                              {row.daysOfCover}d
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs font-medium ${row.variance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                              {row.variance > 0 ? "+" : ""}{row.variance}%
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: RISK_COLORS[row.risk] + "20", color: RISK_COLORS[row.risk] }}>
                              {row.risk === "Low" ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                              {row.risk}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visibleCount < skuRisks.length && (
                  <div className="mt-4 flex items-center justify-center">
                    <button
                      onClick={() => setVisibleCount((c) => c + 5)}
                      className="text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      Load more ({skuRisks.length - visibleCount} remaining)
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
