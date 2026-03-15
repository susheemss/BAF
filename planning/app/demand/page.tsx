"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, PackageSearch,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
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

// ── Demo data ─────────────────────────────────────────────────────────────────
const MONTHLY_DEMAND = [
  { month: "Sep 24", plan: 142000, actual: 138600, variance: -2.4 },
  { month: "Oct 24", plan: 185000, actual: 201200, variance: +8.8 },
  { month: "Nov 24", plan: 192000, actual: 207400, variance: +8.0 },
  { month: "Dec 24", plan: 210000, actual: 224800, variance: +7.0 },
  { month: "Jan 25", plan: 155000, actual: 149300, variance: -3.7 },
  { month: "Feb 25", plan: 148000, actual: 151600, variance: +2.4 },
];

const CATEGORY_MIX = [
  { category: "Personal Care",    plan: 312000, actual: 328400, variance: +5.3 },
  { category: "Food & Beverages", plan: 418000, actual: 441200, variance: +5.5 },
  { category: "Household",        plan: 302000, actual: 303300, variance: +0.4 },
];

const SKU_RISKS = [
  { sku: "SKU-006", name: "Cooking Oil 2L",     category: "Food & Beverages", warehouse: "DEL", daysOfCover: 4,  risk: "High",   variance: +12.4, stockOnHand: 820,  demandPlan: 1800 },
  { sku: "SKU-016", name: "Floor Cleaner 4L",   category: "Household",        warehouse: "MUM", daysOfCover: 5,  risk: "High",   variance: +9.8,  stockOnHand: 340,  demandPlan: 980  },
  { sku: "SKU-025", name: "Detergent 3.5kg",    category: "Household",        warehouse: "BLR", daysOfCover: 6,  risk: "High",   variance: +8.1,  stockOnHand: 510,  demandPlan: 1400 },
  { sku: "SKU-004", name: "Atta 1kg",           category: "Food & Beverages", warehouse: "DEL", daysOfCover: 7,  risk: "High",   variance: +14.2, stockOnHand: 1200, demandPlan: 3200 },
  { sku: "SKU-030", name: "Basmati Rice 2.5kg", category: "Food & Beverages", warehouse: "MUM", daysOfCover: 6,  risk: "High",   variance: +11.0, stockOnHand: 680,  demandPlan: 2100 },
  { sku: "SKU-009", name: "Dishwasher Bar",     category: "Household",        warehouse: "BLR", daysOfCover: 8,  risk: "Medium", variance: +4.2,  stockOnHand: 920,  demandPlan: 2100 },
  { sku: "SKU-022", name: "Mop Set",            category: "Household",        warehouse: "DEL", daysOfCover: 9,  risk: "Medium", variance: +3.1,  stockOnHand: 410,  demandPlan: 870  },
  { sku: "SKU-015", name: "Olive Oil 3L",       category: "Food & Beverages", warehouse: "MUM", daysOfCover: 10, risk: "Medium", variance: -1.8,  stockOnHand: 580,  demandPlan: 1050 },
  { sku: "SKU-002", name: "Shampoo 400ml",      category: "Personal Care",    warehouse: "BLR", daysOfCover: 22, risk: "Low",    variance: +2.4,  stockOnHand: 2100, demandPlan: 1800 },
  { sku: "SKU-011", name: "Face Wash 100ml",    category: "Personal Care",    warehouse: "DEL", daysOfCover: 25, risk: "Low",    variance: -3.2,  stockOnHand: 1800, demandPlan: 1300 },
  { sku: "SKU-018", name: "Instant Noodles",    category: "Food & Beverages", warehouse: "MUM", daysOfCover: 19, risk: "Low",    variance: +1.1,  stockOnHand: 3200, demandPlan: 3100 },
  { sku: "SKU-028", name: "Toilet Cleaner",     category: "Household",        warehouse: "BLR", daysOfCover: 21, risk: "Low",    variance: -0.6,  stockOnHand: 1400, demandPlan: 1210 },
];

const RISK_COLORS: Record<string, string> = {
  High:   "#EF4444",
  Medium: "#F59E0B",
  Low:    "#10B981",
};

export default function DemandPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const set = (id: string, val: string) => setFilters((f) => ({ ...f, [id]: val }));
  const reset = () => setFilters(DEFAULT_FILTERS);

  const { warehouse, category, fromMonth, toMonth, risk, search } = filters;

  // Filter SKU table
  const filtered = SKU_RISKS.filter((s) =>
    (warehouse === "All" || s.warehouse === warehouse) &&
    (category  === "All" || s.category  === category) &&
    (risk      === "All" || s.risk      === risk) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // Filter monthly chart by month range
  const fromIdx  = fromMonth === "All" ? 0                    : Math.max(0, MONTHLY_DEMAND.findIndex((m) => m.month === fromMonth));
  const toIdx    = toMonth   === "All" ? MONTHLY_DEMAND.length : MONTHLY_DEMAND.findIndex((m) => m.month === toMonth) + 1;
  const chartData = MONTHLY_DEMAND.slice(fromIdx, toIdx < 1 ? undefined : toIdx);

  const highCount   = filtered.filter((s) => s.risk === "High").length;
  const mediumCount = filtered.filter((s) => s.risk === "Medium").length;
  const totalDemand = MONTHLY_DEMAND.reduce((a, b) => a + b.actual, 0);
  const totalPlan   = MONTHLY_DEMAND.reduce((a, b) => a + b.plan,   0);
  const overallVar  = (((totalDemand - totalPlan) / totalPlan) * 100).toFixed(1);

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Planning</p>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">Demand Planning</h2>
        <p className="text-sm text-slate-400 mt-0.5">Demand vs plan · Stockout risk · SKU-level view</p>
      </div>
      <FilterBar filters={DEMAND_FILTERS} values={filters} onChange={set} onReset={reset} />

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Actual Demand",  value: `${(totalDemand / 1000).toFixed(0)}K units`, sub: "Sep 24 – Feb 25",            icon: TrendingUp,    color: "text-indigo-600" },
          { label: "Demand vs Plan",       value: `+${overallVar}%`,                           sub: "actual vs forecast",         icon: TrendingUp,    color: "text-emerald-600" },
          { label: "High Stockout Risk",   value: `${highCount} SKUs`,                         sub: "< 7 days cover",             icon: AlertTriangle, color: "text-red-600" },
          { label: "Medium Risk SKUs",     value: `${mediumCount} SKUs`,                       sub: "7–14 days cover",            icon: AlertTriangle, color: "text-amber-600" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="kpi-card"
          >
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly demand trend */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">Monthly Demand — Plan vs Actual</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${(v / 1000).toFixed(1)}K units`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="plan"   name="Plan"   stroke="#6366F1" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category mix */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">Demand by Category — Plan vs Actual</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CATEGORY_MIX} barGap={4}>
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
          <span className="ml-auto text-xs text-slate-400">{filtered.length} SKUs shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["SKU", "Product", "Category", "WH", "Stock on Hand", "Demand Plan", "Days of Cover", "Variance", "Risk"].map((h) => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-wide text-slate-400 font-semibold pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <motion.tr
                  key={row.sku}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 pr-4 text-xs font-mono text-slate-500">{row.sku}</td>
                  <td className="py-3 pr-4 font-medium text-slate-800">{row.name}</td>
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold`}
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
      </div>
    </AppShell>
  );
}
