"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PackageSearch, Truck, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
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
  { type: "search",  id: "search",    label: "PO / SKU / Product" },
];

const DEFAULT_FILTERS = { warehouse: "All", category: "All", supplier: "All", fromMonth: "All", toMonth: "All", status: "All", search: "" };

// ── Demo PO data ──────────────────────────────────────────────────────────────
const PO_DATA = [
  { po: "PO-47821", sku: "SKU-006", name: "Cooking Oil 2L",     supplier: "ITC Limited",              warehouse: "DEL", category: "Food & Beverages", qty: 3600, poDate: "2025-01-18", expectedDate: "2025-02-02", status: "Delayed",    daysDelay: 5,  value: 172800 },
  { po: "PO-47834", sku: "SKU-004", name: "Atta 1kg",           supplier: "Hindustan Unilever Ltd",   warehouse: "DEL", category: "Food & Beverages", qty: 5000, poDate: "2025-01-20", expectedDate: "2025-02-04", status: "Delayed",    daysDelay: 3,  value: 105000 },
  { po: "PO-47902", sku: "SKU-016", name: "Floor Cleaner 4L",   supplier: "Godrej Consumer Products", warehouse: "MUM", category: "Household",        qty: 1200, poDate: "2025-01-22", expectedDate: "2025-02-05", status: "In Transit", daysDelay: 0,  value: 106800 },
  { po: "PO-47918", sku: "SKU-025", name: "Detergent 3.5kg",    supplier: "Procter & Gamble India",   warehouse: "BLR", category: "Household",        qty: 1800, poDate: "2025-01-24", expectedDate: "2025-02-07", status: "In Transit", daysDelay: 0,  value: 176400 },
  { po: "PO-47956", sku: "SKU-030", name: "Basmati Rice 2.5kg", supplier: "ITC Limited",              warehouse: "MUM", category: "Food & Beverages", qty: 2800, poDate: "2025-01-25", expectedDate: "2025-02-08", status: "In Transit", daysDelay: 0,  value: 182000 },
  { po: "PO-48012", sku: "SKU-009", name: "Dishwasher Bar",     supplier: "Godrej Consumer Products", warehouse: "BLR", category: "Household",        qty: 2400, poDate: "2025-01-28", expectedDate: "2025-02-10", status: "Pending",    daysDelay: 0,  value: 148800 },
  { po: "PO-48034", sku: "SKU-022", name: "Mop Set",            supplier: "Emami Limited",            warehouse: "DEL", category: "Household",        qty: 900,  poDate: "2025-01-30", expectedDate: "2025-02-12", status: "Pending",    daysDelay: 0,  value: 66600  },
  { po: "PO-48071", sku: "SKU-015", name: "Olive Oil 3L",       supplier: "Nestle India",             warehouse: "MUM", category: "Food & Beverages", qty: 1500, poDate: "2025-02-01", expectedDate: "2025-02-14", status: "Pending",    daysDelay: 0,  value: 81000  },
  { po: "PO-48102", sku: "SKU-002", name: "Shampoo 400ml",      supplier: "Hindustan Unilever Ltd",   warehouse: "BLR", category: "Personal Care",    qty: 3000, poDate: "2025-02-03", expectedDate: "2025-02-16", status: "Delivered",  daysDelay: 0,  value: 96000  },
  { po: "PO-48145", sku: "SKU-017", name: "Hair Conditioner",   supplier: "Dabur India",              warehouse: "DEL", category: "Personal Care",    qty: 2200, poDate: "2025-02-05", expectedDate: "2025-02-18", status: "Delivered",  daysDelay: 0,  value: 83600  },
  { po: "PO-48167", sku: "SKU-027", name: "Mustard Oil 1.4L",   supplier: "Marico Industries",        warehouse: "MUM", category: "Food & Beverages", qty: 1800, poDate: "2025-02-06", expectedDate: "2025-02-19", status: "Delivered",  daysDelay: 0,  value: 64800  },
  { po: "PO-48190", sku: "SKU-019", name: "Toilet Brush Set",   supplier: "Godrej Consumer Products", warehouse: "BLR", category: "Household",        qty: 1100, poDate: "2025-02-07", expectedDate: "2025-02-20", status: "Delivered",  daysDelay: 0,  value: 61600  },
];

const INVENTORY_COVER = [
  { category: "Personal Care",    avgCover: 22.4, target: 21 },
  { category: "Food & Beverages", avgCover: 14.8, target: 21 },
  { category: "Household",        avgCover: 16.2, target: 21 },
];

const PO_STATUS_PIE = [
  { name: "Delivered",   value: 4, color: "#10B981" },
  { name: "In Transit",  value: 3, color: "#3B82F6" },
  { name: "Pending",     value: 3, color: "#F59E0B" },
  { name: "Delayed",     value: 2, color: "#EF4444" },
];

const STATUS_STYLE: Record<string, string> = {
  Delivered:   "bg-emerald-100 text-emerald-700",
  "In Transit":"bg-blue-100 text-blue-700",
  Pending:     "bg-amber-100 text-amber-700",
  Delayed:     "bg-red-100 text-red-700",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  Delivered:    <CheckCircle2 size={11} />,
  "In Transit": <Truck        size={11} />,
  Pending:      <Clock        size={11} />,
  Delayed:      <AlertTriangle size={11} />,
};

// Map month labels to comparable date strings
const MONTH_TO_DATE: Record<string, string> = {
  "Sep-24": "2024-09", "Oct-24": "2024-10", "Nov-24": "2024-11",
  "Dec-24": "2024-12", "Jan-25": "2025-01", "Feb-25": "2025-02",
};

export default function SupplyPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const set = (id: string, val: string) => setFilters((f) => ({ ...f, [id]: val }));
  const reset = () => setFilters(DEFAULT_FILTERS);

  const { warehouse, category, supplier, fromMonth, toMonth, status, search } = filters;

  const filtered = PO_DATA.filter((p) => {
    const poYYYYMM = p.poDate.slice(0, 7);
    const from = fromMonth !== "All" ? MONTH_TO_DATE[fromMonth] : null;
    const to   = toMonth   !== "All" ? MONTH_TO_DATE[toMonth]   : null;
    return (
      (warehouse === "All" || p.warehouse === warehouse) &&
      (category  === "All" || p.category  === category) &&
      (supplier  === "All" || p.supplier  === supplier) &&
      (status    === "All" || p.status    === status) &&
      (!from || poYYYYMM >= from) &&
      (!to   || poYYYYMM <= to) &&
      (search === "" ||
        p.po.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const delayed    = PO_DATA.filter((p) => p.status === "Delayed");
  const inTransit  = PO_DATA.filter((p) => p.status === "In Transit");
  const totalValue = PO_DATA.reduce((a, b) => a + b.value, 0);

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Planning</p>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">Supply Planning</h2>
        <p className="text-sm text-slate-400 mt-0.5">PO tracker · Inventory coverage · Replenishment signals</p>
      </div>
      <FilterBar filters={SUPPLY_FILTERS} values={filters} onChange={set} onReset={reset} />

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active POs",         value: `${PO_DATA.length}`,                   sub: "across all warehouses",    color: "text-indigo-600" },
          { label: "Delayed POs",        value: `${delayed.length}`,                   sub: `${delayed.reduce((a,b)=>a+b.daysDelay,0)} total delay-days`, color: "text-red-600" },
          { label: "In Transit",         value: `${inTransit.length} POs`,             sub: "expected within 7 days",   color: "text-blue-600"   },
          { label: "Total PO Value",     value: `₹${(totalValue / 100000).toFixed(1)}L`, sub: "open order value",       color: "text-emerald-600" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="kpi-card">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inventory cover by category */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">Inventory Days of Cover by Category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={INVENTORY_COVER} barGap={8}>
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 30]} tick={{ fontSize: 11 }} unit="d" />
              <Tooltip formatter={(v: number) => `${v} days`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="target" name="Target (21d)" fill="#6366F1" opacity={0.3} radius={[4,4,0,0]} />
              <Bar dataKey="avgCover" name="Avg Cover" radius={[4,4,0,0]}>
                {INVENTORY_COVER.map((entry) => (
                  <Cell key={entry.category} fill={entry.avgCover >= entry.target ? "#10B981" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PO status mix */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">PO Status Mix</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={PO_STATUS_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" nameKey="name" paddingAngle={3}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}>
                {PO_STATUS_PIE.map((entry) => (
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
                {delayed.map((p) => `${p.po} (${p.sku}, +${p.daysDelay}d)`).join(" · ")}
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
          <span className="ml-auto text-xs text-slate-400">{filtered.length} POs shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["PO #", "SKU", "Product", "Supplier", "WH", "Qty", "PO Date", "Expected", "Value (₹)", "Status"].map((h) => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-wide text-slate-400 font-semibold pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <motion.tr
                  key={row.po}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 pr-4 text-xs font-mono text-slate-500">{row.po}</td>
                  <td className="py-3 pr-4 text-xs font-mono text-slate-400">{row.sku}</td>
                  <td className="py-3 pr-4 font-medium text-slate-800">{row.name}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500 max-w-[140px] truncate">{row.supplier}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{row.warehouse}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{row.qty.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500">{row.poDate}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500">
                    {row.daysDelay > 0
                      ? <span className="text-red-600 font-medium">{row.expectedDate} <span className="text-xs">(+{row.daysDelay}d)</span></span>
                      : row.expectedDate}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">₹{row.value.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[row.status]}`}>
                      {STATUS_ICON[row.status]}
                      {row.status}
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
