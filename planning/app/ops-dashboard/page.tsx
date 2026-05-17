"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  CartesianGrid, ReferenceLine,
} from "recharts";
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  Warehouse, Truck, PackageSearch, Activity,
  ChevronRight, AlertTriangle, CheckCircle2,
  BarChart2, LayoutGrid,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import {
  getWmsKpis, getTmsKpis, getPlanningKpis, getCrossKpis,
  getMonthlyTrend, getCrossAlerts, ALL_MONTHS,
} from "@/lib/loadData";
import {
  getCarrierPerformance, getCarrierMonthly,
  getDelayByMode, getModeRoutes,
  getDemandSupplyByCategory, getCategorySkus,
  getInventoryRisk, getWarehouseHighRiskSkus,
  getCostByRoute, getRouteCarriers,
  getMonthBreakdown,
} from "@/lib/opsData";

// ── Constants ─────────────────────────────────────────────────────────────────

const WAREHOUSES = ["All", "DEL", "MUM", "BLR"];
const FILTERS: FilterDef[] = [
  { type: "select", id: "warehouse",  label: "Warehouse",  options: WAREHOUSES },
  { type: "select", id: "fromMonth",  label: "From Month", options: ["All", ...ALL_MONTHS] },
  { type: "select", id: "toMonth",    label: "To Month",   options: ["All", ...ALL_MONTHS] },
];
const DEFAULT = { warehouse: "All", fromMonth: "All", toMonth: "All" };

const C = {
  wms:      "#14B8A6",
  tms:      "#3B82F6",
  planning: "#6366F1",
  green:    "#10B981",
  amber:    "#F59E0B",
  red:      "#EF4444",
  violet:   "#8B5CF6",
  cyan:     "#06B6D4",
  high:     "#EF4444",
  medium:   "#F59E0B",
  low:      "#10B981",
};

const MODE_COLORS: Record<string, string> = {
  Truck:  "#3B82F6",
  Air:    "#8B5CF6",
  Rail:   "#14B8A6",
  Sea:    "#F59E0B",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function kpiStatus(val: number, target: number, lower = false) {
  const r = lower ? target / val : val / target;
  if (r >= 0.97) return "green";
  if (r >= 0.90) return "amber";
  return "red";
}

function barFill(val: number, target: number, lower = false) {
  const s = kpiStatus(val, target, lower);
  return s === "green" ? C.green : s === "amber" ? C.amber : C.red;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active, payload, label, unit = "",
}: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[120px]">
      {label && <p className="font-semibold text-slate-700 mb-1.5">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}</span>
          </span>
          <span className="font-bold text-slate-800">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, unit, target, source, lower = false, delay = 0,
}: {
  label: string; value: number; unit: string; target: number;
  source: string; lower?: boolean; delay?: number;
}) {
  const st  = kpiStatus(value, target, lower);
  const pct = lower
    ? Math.min((target / value) * 100, 100)
    : Math.min((value / target) * 100, 100);
  const Icon = st === "green" ? TrendingUp : st === "amber" ? Minus : TrendingDown;
  const dotCls  = st === "green" ? "bg-emerald-400" : st === "amber" ? "bg-amber-400" : "bg-red-400";
  const valCls  = st === "green" ? "text-slate-900" : st === "amber" ? "text-amber-700" : "text-red-700";
  const barCls  = st === "green" ? "bg-emerald-400" : st === "amber" ? "bg-amber-400" : "bg-red-400";
  const iconCls = st === "green" ? "text-emerald-500" : st === "amber" ? "text-amber-500" : "text-red-500";
  const pctCls  = st === "green" ? "text-emerald-600" : st === "amber" ? "text-amber-600" : "text-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate leading-none">
          {label}
        </span>
        <span className="ml-auto text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded flex-shrink-0">
          {source}
        </span>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-bold leading-none ${valCls}`}>{value}</span>
        <span className="text-xs text-slate-400 mb-0.5">{unit}</span>
        <Icon size={13} className={`mb-0.5 ml-auto ${iconCls}`} />
      </div>
      <div className="mt-2.5">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Target {target}{unit}</span>
          <span className={`font-bold ${pctCls}`}>{Math.round(pct)}%</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barCls}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────

function ChartCard({
  title, subtitle, iconColor, children,
  drill, onBack,
}: {
  title: string; subtitle: string; iconColor: string;
  children: React.ReactNode;
  drill?: { label: string; content: React.ReactNode } | null;
  onBack?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-start gap-2 mb-4">
        <div className={`w-2 h-full min-h-[32px] rounded-full flex-shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-tight">{title}</p>
          {!drill ? (
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <button
                onClick={onBack}
                className="text-indigo-500 hover:underline font-medium"
              >
                All
              </button>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-slate-600 font-semibold">{drill.label}</span>
            </div>
          )}
        </div>
        {drill ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={11} /> Back
          </button>
        ) : (
          <span className="text-[10px] text-slate-300 border border-slate-100 px-2 py-1 rounded-lg flex-shrink-0 hidden sm:block">
            click bars to drill ↓
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={drill ? `drill-${drill.label}` : "main"}
          initial={{ opacity: 0, x: drill ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {drill ? drill.content : children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Drill Table ───────────────────────────────────────────────────────────────

function DrillTable({
  columns, rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((c) => (
              <th key={c} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-slate-700 font-medium whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Risk Badge ────────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: "High" | "Medium" | "Low" }) {
  const cls = risk === "High"
    ? "bg-red-100 text-red-700"
    : risk === "Medium"
    ? "bg-amber-100 text-amber-700"
    : "bg-emerald-100 text-emerald-700";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{risk}</span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OpsDashboard() {
  const [filters, setFilters] = useState(DEFAULT);
  const set   = (id: string, val: string) => setFilters((f) => ({ ...f, [id]: val }));
  const reset = () => setFilters(DEFAULT);

  // Drill states — one per chart
  const [trendDrill,    setTrendDrill]    = useState<string | null>(null);
  const [carrierDrill,  setCarrierDrill]  = useState<string | null>(null);
  const [modeDrill,     setModeDrill]     = useState<string | null>(null);
  const [demandDrill,   setDemandDrill]   = useState<string | null>(null);
  const [invDrill,      setInvDrill]      = useState<string | null>(null);
  const [routeDrill,    setRouteDrill]    = useState<string | null>(null);

  const { warehouse } = filters;
  const wms      = getWmsKpis(warehouse);
  const tms      = getTmsKpis(warehouse);
  const planning = getPlanningKpis(warehouse);
  const cross    = getCrossKpis(wms, tms, planning);
  const alerts   = getCrossAlerts(wms, tms, planning);

  // Chart data
  const trendData    = getMonthlyTrend();
  const carriers     = getCarrierPerformance();
  const delayModes   = getDelayByMode();
  const demandSupply = getDemandSupplyByCategory(warehouse);
  const invRisk      = getInventoryRisk();
  const routes       = getCostByRoute();

  // ── Trend chart ──────────────────────────────────────────────────────────────
  const trendChart = (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} />
        <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} unit="%" />
        <Tooltip content={<ChartTooltip unit="%" />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={92} stroke={C.amber} strokeDasharray="4 2" strokeWidth={1} label={{ value: "Target 92%", fontSize: 9, fill: C.amber }} />
        <Line
          type="monotone" dataKey="wms" name="WMS" stroke={C.wms}
          strokeWidth={2.5} dot={{ r: 4, fill: C.wms, strokeWidth: 0 }}
          activeDot={{ r: 6, onClick: (_: unknown, payload: unknown) => {
            const p = payload as { payload?: { month?: string } };
            if (p?.payload?.month) setTrendDrill(p.payload.month);
          }}}
        />
        <Line
          type="monotone" dataKey="tms" name="TMS" stroke={C.tms}
          strokeWidth={2.5} dot={{ r: 4, fill: C.tms, strokeWidth: 0 }}
          activeDot={{ r: 6, onClick: (_: unknown, payload: unknown) => {
            const p = payload as { payload?: { month?: string } };
            if (p?.payload?.month) setTrendDrill(p.payload.month);
          }}}
        />
        <Line
          type="monotone" dataKey="planning" name="Planning" stroke={C.planning}
          strokeWidth={2.5} dot={{ r: 4, fill: C.planning, strokeWidth: 0 }}
          activeDot={{ r: 6, onClick: (_: unknown, payload: unknown) => {
            const p = payload as { payload?: { month?: string } };
            if (p?.payload?.month) setTrendDrill(p.payload.month);
          }}}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const trendDrillContent = trendDrill ? (() => {
    const rows = getMonthBreakdown(trendDrill);
    return (
      <div>
        <p className="text-[11px] text-slate-400 mb-3">On-time % by system for <span className="font-semibold text-slate-600">{trendDrill}</span></p>
        <DrillTable
          columns={["Warehouse", "WMS %", "TMS %", "Planning %"]}
          rows={rows.map(r => [r.warehouse, `${r.wms}%`, `${r.tms}%`, `${r.planning}%`])}
        />
        <p className="text-[10px] text-slate-300 mt-3">Click another data point on the chart to compare months</p>
      </div>
    );
  })() : null;

  // ── Carrier chart ─────────────────────────────────────────────────────────────
  const carrierChart = (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={carriers}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 60, bottom: 0 }}
        barSize={14}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
        <XAxis type="number" domain={[75, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} unit="%" />
        <YAxis dataKey="carrier" type="category" tick={{ fontSize: 10, fill: "#475569" }} width={60} />
        <Tooltip content={<ChartTooltip unit="%" />} />
        <ReferenceLine x={92} stroke={C.amber} strokeDasharray="4 2" strokeWidth={1} />
        <Bar
          dataKey="onTime"
          name="On-Time %"
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={(data: { carrier?: string }) => {
            if (data?.carrier) setCarrierDrill(data.carrier);
          }}
        >
          {carriers.map((c) => (
            <Cell key={c.carrier} fill={barFill(c.onTime, 92)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const carrierDrillContent = carrierDrill ? (() => {
    const monthly = getCarrierMonthly(carrierDrill);
    return (
      <div>
        <p className="text-[11px] text-slate-400 mb-3">Monthly on-time trend for <span className="font-semibold text-slate-600">{carrierDrill}</span></p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={monthly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} />
            <YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} unit="%" />
            <Tooltip content={<ChartTooltip unit="%" />} />
            <ReferenceLine y={92} stroke={C.amber} strokeDasharray="4 2" strokeWidth={1} />
            <Line type="monotone" dataKey="onTime" name="On-Time %" stroke={C.tms} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <DrillTable
          columns={["Month", "On-Time %", "Shipments"]}
          rows={monthly.map(m => [m.month, `${m.onTime}%`, m.shipments])}
        />
      </div>
    );
  })() : null;

  // ── Mode delay donut ──────────────────────────────────────────────────────────
  const pieData = delayModes.map(d => ({
    name: d.mode,
    value: d.delayed,
    total: d.delayed + d.onTime + d.inTransit,
  }));

  const modeChart = (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            cursor="pointer"
            onClick={(data: { name?: string }) => {
              if (data?.name) setModeDrill(data.name);
            }}
          >
            {pieData.map((entry) => (
              <Cell
                key={entry.name}
                fill={MODE_COLORS[entry.name] ?? C.tms}
                opacity={modeDrill && modeDrill !== entry.name ? 0.35 : 1}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number, name: string) => [`${val} delayed`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 flex-1">
        {delayModes.map(d => {
          const pct = ((d.delayed / (d.delayed + d.onTime + d.inTransit)) * 100).toFixed(1);
          return (
            <button
              key={d.mode}
              onClick={() => setModeDrill(d.mode)}
              className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors text-left w-full"
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: MODE_COLORS[d.mode] }} />
              <span className="text-xs text-slate-600 font-medium flex-1">{d.mode}</span>
              <span className="text-xs font-bold text-slate-700">{pct}%</span>
              <span className="text-[10px] text-slate-400">{d.delayed} delays</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const modeDrillContent = modeDrill ? (() => {
    const routes_ = getModeRoutes(modeDrill);
    return (
      <div>
        <p className="text-[11px] text-slate-400 mb-3">Delay breakdown for <span className="font-semibold text-slate-600">{modeDrill}</span> shipments</p>
        <DrillTable
          columns={["Route", "Delays", "Avg Transit (d)", "Avg Cost ($)"]}
          rows={routes_.map(r => [r.route, r.delays, r.avgTransit, `$${r.cost.toLocaleString()}`])}
        />
      </div>
    );
  })() : null;

  // ── Demand vs Supply chart ────────────────────────────────────────────────────
  const demandChart = (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={demandSupply} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 10, fill: "#475569" }}
          tickFormatter={(v: string) => v.split(" ")[0]}
        />
        <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(v: number, name: string) => [`${v.toLocaleString()} units`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar
          dataKey="actualDemand" name="Actual Demand" fill={C.violet}
          radius={[4, 4, 0, 0]} cursor="pointer"
          onClick={(data: { category?: string }) => {
            if (data?.category) setDemandDrill(data.category);
          }}
        />
        <Bar
          dataKey="supplyAvail" name="Supply Available" fill={C.cyan}
          radius={[4, 4, 0, 0]} cursor="pointer"
          onClick={(data: { category?: string }) => {
            if (data?.category) setDemandDrill(data.category);
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const demandDrillContent = demandDrill ? (() => {
    const skus = getCategorySkus(demandDrill);
    return (
      <div>
        <p className="text-[11px] text-slate-400 mb-3">SKU breakdown for <span className="font-semibold text-slate-600">{demandDrill}</span></p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {["SKU", "Demand", "Stock", "Days Cover", "Risk"].map(c => (
                <th key={c} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skus.map((s, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 pr-3 text-slate-700 font-medium">{s.sku}</td>
                <td className="py-2 pr-3 text-slate-600">{s.demand.toLocaleString()}</td>
                <td className="py-2 pr-3 text-slate-600">{s.stock.toLocaleString()}</td>
                <td className="py-2 pr-3 text-slate-600">{s.daysOfCover}d</td>
                <td className="py-2 pr-3"><RiskBadge risk={s.risk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  })() : null;

  // ── Inventory risk chart ──────────────────────────────────────────────────────
  const invChart = (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={invRisk} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="warehouse" tick={{ fontSize: 11, fill: "#475569" }} />
        <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar
          dataKey="high" name="High Risk" stackId="a" fill={C.high}
          cursor="pointer"
          onClick={(data: { warehouse?: string }) => {
            if (data?.warehouse) setInvDrill(data.warehouse);
          }}
        />
        <Bar
          dataKey="medium" name="Medium Risk" stackId="a" fill={C.medium}
          cursor="pointer"
          onClick={(data: { warehouse?: string }) => {
            if (data?.warehouse) setInvDrill(data.warehouse);
          }}
        />
        <Bar
          dataKey="low" name="Low Risk" stackId="a" fill={C.low}
          radius={[4, 4, 0, 0]} cursor="pointer"
          onClick={(data: { warehouse?: string }) => {
            if (data?.warehouse) setInvDrill(data.warehouse);
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const invDrillContent = invDrill ? (() => {
    const skus = getWarehouseHighRiskSkus(invDrill);
    return (
      <div>
        <p className="text-[11px] text-slate-400 mb-3">At-risk SKUs for <span className="font-semibold text-slate-600">{invDrill}</span></p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {["SKU", "Category", "Days Cover", "Risk"].map(c => (
                <th key={c} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skus.map((s, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 pr-3 text-slate-700 font-medium">{s.sku}</td>
                <td className="py-2 pr-3 text-slate-500">{s.category}</td>
                <td className="py-2 pr-3 text-slate-600">{s.daysOfCover}d</td>
                <td className="py-2 pr-3"><RiskBadge risk={s.risk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  })() : null;

  // ── Route cost chart ──────────────────────────────────────────────────────────
  const routeChart = (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={routes} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="route" tick={{ fontSize: 9, fill: "#475569" }} />
        <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
        <Tooltip
          formatter={(v: number) => [`$${v.toLocaleString()}`, "Avg Cost"]}
        />
        <Bar
          dataKey="avgCost"
          name="Avg Cost"
          radius={[4, 4, 0, 0]}
          cursor="pointer"
          onClick={(data: { route?: string }) => {
            if (data?.route) setRouteDrill(data.route);
          }}
        >
          {routes.map((r) => (
            <Cell
              key={r.route}
              fill={r.delayRate > 15 ? C.red : r.delayRate > 12 ? C.amber : C.tms}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const routeDrillContent = routeDrill ? (() => {
    const carriers_ = getRouteCarriers(routeDrill);
    return (
      <div>
        <p className="text-[11px] text-slate-400 mb-3">Carrier breakdown for route <span className="font-semibold text-slate-600">{routeDrill}</span></p>
        <DrillTable
          columns={["Carrier", "Shipments", "On-Time %", "Avg Cost"]}
          rows={carriers_.map(c => [c.carrier, c.shipments, `${c.onTime}%`, `$${c.avgCost.toLocaleString()}`])}
        />
      </div>
    );
  })() : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <LayoutGrid size={14} className="text-white" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Operational Dashboard</p>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Supply Chain Command Centre</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Cross-system KPIs · WMS + TMS + Planning · Interactive drill-downs
            </p>
          </div>
          {/* Alert badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium shadow-sm ${
            alerts.length === 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : alerts.filter(a => a.severity === "critical").length > 0
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            {alerts.length === 0
              ? <><CheckCircle2 size={14} /> All systems nominal</>
              : <><AlertTriangle size={14} /> {alerts.length} active alert{alerts.length > 1 ? "s" : ""}</>
            }
          </div>
        </div>
      </div>

      <FilterBar filters={FILTERS} values={filters} onChange={set} onReset={reset} />

      {/* ── Summary KPI Strip ── */}
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3 mt-6">
        Performance Snapshot
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <SummaryCard label="On-Time Dispatch"   value={wms.onTimeDispatch}    unit="%" target={92}   source="WMS"      delay={0.00} />
        <SummaryCard label="Order Fill Rate"    value={wms.orderFillRate}     unit="%" target={95}   source="WMS"      delay={0.05} />
        <SummaryCard label="On-Time Delivery"  value={tms.onTimeDelivery}    unit="%" target={92}   source="TMS"      delay={0.10} />
        <SummaryCard label="Delay Rate"        value={tms.delayRate}         unit="%" target={5}    source="TMS"      lower delay={0.15} />
        <SummaryCard label="Perfect Order"     value={cross.perfectOrderRate} unit="%" target={80}  source="Cross"    delay={0.20} />
        <SummaryCard label="SC Reliability"    value={cross.supplyChainReliability} unit="%" target={92} source="Cross" delay={0.25} />
        <SummaryCard label="Stockout Risk"     value={planning.stockoutRiskHigh} unit=" SKUs" target={0} source="Planning" lower delay={0.30} />
        <SummaryCard label="Demand Variance"   value={planning.demandVariancePct} unit="%" target={5} source="Planning" lower delay={0.35} />
      </div>

      {/* ── Row 1: Trend + Carrier ── */}
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
        Reliability & Carrier Performance
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-3">
          <ChartCard
            title="Supply Chain Reliability Trend"
            subtitle="Monthly on-time % · WMS · TMS · Planning — click a data point to drill by warehouse"
            iconColor="bg-indigo-600"
            drill={trendDrill ? { label: trendDrill, content: trendDrillContent! } : null}
            onBack={() => setTrendDrill(null)}
          >
            {trendChart}
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard
            title="On-Time Delivery by Carrier"
            subtitle="Click a carrier bar to see monthly trend"
            iconColor="bg-blue-500"
            drill={carrierDrill ? { label: carrierDrill, content: carrierDrillContent! } : null}
            onBack={() => setCarrierDrill(null)}
          >
            {carrierChart}
          </ChartCard>
        </div>
      </div>

      {/* ── Row 2: Delay Mode + Demand Supply ── */}
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3 mt-6">
        Delay Analysis & Demand-Supply
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-2">
          <ChartCard
            title="Shipment Delays by Mode"
            subtitle="Click a segment or row to see impacted routes"
            iconColor="bg-violet-500"
            drill={modeDrill ? { label: modeDrill, content: modeDrillContent! } : null}
            onBack={() => setModeDrill(null)}
          >
            {modeChart}
          </ChartCard>
        </div>
        <div className="lg:col-span-3">
          <ChartCard
            title="Demand vs Supply Gap by Category"
            subtitle="Click a category bar to see SKU-level breakdown"
            iconColor="bg-cyan-500"
            drill={demandDrill ? { label: demandDrill, content: demandDrillContent! } : null}
            onBack={() => setDemandDrill(null)}
          >
            {demandChart}
          </ChartCard>
        </div>
      </div>

      {/* ── Row 3: Inventory + Route Cost ── */}
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3 mt-6">
        Inventory Health & Transport Cost
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <ChartCard
          title="Inventory Risk by Warehouse"
          subtitle="Stacked by risk level · click a bar to see at-risk SKUs"
          iconColor="bg-amber-500"
          drill={invDrill ? { label: invDrill, content: invDrillContent! } : null}
          onBack={() => setInvDrill(null)}
        >
          {invChart}
        </ChartCard>
        <ChartCard
          title="Avg Shipment Cost by Route"
          subtitle="Colour = delay rate (green < 12% · amber 12–15% · red > 15%) · click to see carrier split"
          iconColor="bg-teal-500"
          drill={routeDrill ? { label: routeDrill, content: routeDrillContent! } : null}
          onBack={() => setRouteDrill(null)}
        >
          {routeChart}
        </ChartCard>
      </div>

      {/* ── Alerts Strip ── */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
            Active Cross-System Alerts
          </p>
          <div className="space-y-2">
            {alerts.map((a) => {
              const sev = {
                critical: "border-red-200 bg-red-50",
                high:     "border-amber-200 bg-amber-50",
                medium:   "border-yellow-200 bg-yellow-50",
              }[a.severity];
              const txt = {
                critical: "text-red-700",
                high:     "text-amber-700",
                medium:   "text-yellow-700",
              }[a.severity];
              const badge = {
                critical: "bg-red-100 text-red-700",
                high:     "bg-amber-100 text-amber-700",
                medium:   "bg-yellow-100 text-yellow-700",
              }[a.severity];
              return (
                <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${sev}`}>
                  <AlertTriangle size={14} className={`${txt} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge}`}>
                        {a.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">{a.source.join(" · ")}</span>
                    </div>
                    <p className={`text-xs font-semibold ${txt}`}>{a.message}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{a.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
