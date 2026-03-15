"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Warehouse, Truck, PackageSearch, Zap,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Bell,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import DrillDownModal from "@/components/DrillDownModal";
import AlertPanel from "@/components/AlertPanel";
import { getDrillDown, type DrillDown } from "@/lib/drillDownData";
import { ALERT_RULES, evaluateRule, type KpiSnapshot } from "@/lib/alertConfig";
import {
  getWmsKpis, getTmsKpis, getPlanningKpis, getCrossKpis,
  getMonthlyTrend, getCrossAlerts, ALL_MONTHS,
} from "@/lib/loadData";

const WAREHOUSES  = ["All", "DEL", "MUM", "BLR"];
const CATEGORIES  = ["All", "Personal Care", "Food & Beverages", "Household"];

const DASHBOARD_FILTERS: FilterDef[] = [
  { type: "select",  id: "warehouse", label: "Warehouse", options: WAREHOUSES },
  { type: "select",  id: "category",  label: "Category",  options: CATEGORIES },
  { type: "select",  id: "fromMonth", label: "From Month", options: ["All", ...ALL_MONTHS] },
  { type: "select",  id: "toMonth",   label: "To Month",   options: ["All", ...ALL_MONTHS] },
];

const DEFAULT_FILTERS = { warehouse: "All", category: "All", fromMonth: "All", toMonth: "All" };

function trend(val: number, target: number) {
  if (val >= target)      return { icon: TrendingUp,   cls: "text-emerald-500" };
  if (val >= target * 0.9) return { icon: Minus,        cls: "text-amber-500"   };
  return                         { icon: TrendingDown,  cls: "text-red-500"     };
}

function KpiCard({
  label, value, unit, target, source, delay = 0, drillKey, onDrill, isBreach,
}: {
  label: string; value: number; unit: string;
  target: number; source: string; delay?: number;
  drillKey?: string; onDrill?: (key: string) => void;
  isBreach?: boolean;
}) {
  const { icon: Icon, cls } = trend(value, target);
  const hasDrill = !!drillKey && !!onDrill;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      onClick={() => hasDrill && onDrill(drillKey!)}
      className={`kpi-card relative ${hasDrill ? "cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group" : ""} ${isBreach ? "border-red-200 bg-red-50/40" : ""}`}
    >
      {isBreach && (
        <span className="absolute top-2 right-2">
          <Bell size={12} className="text-red-400" />
        </span>
      )}
      <div className="flex items-start justify-between pr-4">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        {hasDrill && !isBreach && (
          <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium absolute top-3 right-3">
            Why? →
          </span>
        )}
      </div>
      <div className="flex items-end gap-2 mt-1">
        <span className={`text-2xl font-bold ${isBreach ? "text-red-600" : "text-slate-900"}`}>
          {value}{unit}
        </span>
        <Icon size={16} className={`mb-1 ${cls}`} />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">
        Target <span className="font-medium">{target}{unit}</span> ·{" "}
        <span className="font-semibold text-indigo-500">{source}</span>
      </p>
    </motion.div>
  );
}

function CrossKpiCard({
  label, value, unit, description, delay = 0,
}: {
  label: string; value: number | string; unit: string;
  description: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="card p-5 border-l-4 border-indigo-500"
    >
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}{unit}</p>
      <p className="text-[11px] text-slate-500 mt-1">{description}</p>
    </motion.div>
  );
}

const SEVERITY_STYLE = {
  critical: "border-l-4 border-red-500 bg-red-50",
  high:     "border-l-4 border-amber-500 bg-amber-50",
  medium:   "border-l-4 border-yellow-400 bg-yellow-50",
};
const SEVERITY_BADGE = {
  critical: "badge-red",
  high:     "bg-amber-100 text-amber-700 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
  medium:   "bg-yellow-100 text-yellow-700 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
};

export default function DashboardPage() {
  const [filters,        setFilters]        = useState(DEFAULT_FILTERS);
  const [drillDown,      setDrillDown]      = useState<DrillDown | null>(null);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [activeBreaches, setActiveBreaches] = useState<string[]>([]);

  const set = (id: string, val: string) => setFilters((f) => ({ ...f, [id]: val }));
  const reset = () => setFilters(DEFAULT_FILTERS);
  const openDrill = (key: string) => setDrillDown(getDrillDown(key));

  const { warehouse, fromMonth, toMonth } = filters;

  const wms      = getWmsKpis(warehouse);
  const tms      = getTmsKpis(warehouse);
  const planning = getPlanningKpis(warehouse);
  const cross    = getCrossKpis(wms, tms, planning);

  // Filter trend data by month range
  const allTrend = getMonthlyTrend();
  const fromIdx  = fromMonth === "All" ? 0               : Math.max(0, allTrend.findIndex((t) => t.month === fromMonth));
  const toIdx    = toMonth   === "All" ? allTrend.length  : allTrend.findIndex((t) => t.month === toMonth) + 1;
  const trend_   = allTrend.slice(fromIdx, toIdx < 1 ? undefined : toIdx);

  const alerts   = getCrossAlerts();

  // Compute active breaches for UI indicators
  const computeBreaches = useCallback((snap: KpiSnapshot) => {
    return ALERT_RULES
      .filter((r) => evaluateRule(r, snap[r.kpiKey as keyof KpiSnapshot] ?? 0))
      .map((r) => r.kpiKey);
  }, []);

  // Run alert check on mount and whenever warehouse filter changes
  useEffect(() => {
    const snap: KpiSnapshot = {
      "on-time-dispatch":      wms.onTimeDispatch,
      "on-time-dispatch-warn": wms.onTimeDispatch,
      "order-fill-rate":       wms.orderFillRate,
      "dock-to-stock":         wms.dockToStock,
      "receiving-accuracy":    wms.receivingAccuracy,
      "order-pendency":        wms.orderPendencyPct,
      "on-time-delivery":      tms.onTimeDelivery,
      "delay-rate":            tms.delayRate,
      "tender-acceptance":     tms.tenderAcceptance,
      "avg-transit-days":      tms.avgTransitDays,
      "stockout-risk":         planning.stockoutRiskHigh,
      "demand-variance":       planning.demandVariancePct,
    };

    const breaches = computeBreaches(snap);
    setActiveBreaches(breaches);

    fetch("/api/alerts/check", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ kpis: snap }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wms.onTimeDispatch, tms.onTimeDelivery, planning.stockoutRiskHigh]);

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Supply Chain Planning</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Executive Overview</h2>
          <p className="text-sm text-slate-400 mt-0.5">Cross-system KPIs · WMS + TMS + Planning</p>
        </div>
        <button
          onClick={() => setAlertPanelOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
        >
          <Bell size={15} className={activeBreaches.length > 0 ? "text-red-500" : "text-slate-400"} />
          <span className="text-sm font-medium text-slate-700">Alerts</span>
          {activeBreaches.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeBreaches.length}
            </span>
          )}
        </button>
      </div>
      <FilterBar filters={DASHBOARD_FILTERS} values={filters} onChange={set} onReset={reset} />

      {/* ── Cross-System KPIs ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3"
      >
        Cross-System KPIs
      </motion.p>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <CrossKpiCard label="Perfect Order Rate"        value={cross.perfectOrderRate}        unit="%" description="OTD × Fill Rate × On-Time Dispatch"  delay={0.05} />
        <CrossKpiCard label="Supply Chain Reliability"  value={cross.supplyChainReliability}  unit="%" description="Weighted composite across all systems" delay={0.10} />
        <CrossKpiCard label="Carrier-to-Shelf"          value={cross.carrierToShelfDays}       unit=" days" description="TMS transit + WMS dock-to-stock"  delay={0.15} />
        <CrossKpiCard label="SC Cycle Time"             value={cross.supplychainCycleTime}     unit="h" description="End-to-end: supplier to customer"     delay={0.20} />
        <CrossKpiCard label="Inbound Fulfillment Gap"   value={cross.inboundFulfillmentGap}    unit="%" description="SKUs at High stockout risk"           delay={0.25} />
      </div>

      {/* ── Per-System KPIs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* WMS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Warehouse size={15} className="text-teal-500" />
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">WMS · Warehouse</p>
          </div>
          <div className="space-y-3">
            <KpiCard label="On-Time Dispatch"    value={wms.onTimeDispatch}    unit="%" target={92} source="WMS" delay={0.1}  drillKey="on-time-dispatch"   onDrill={openDrill} isBreach={activeBreaches.includes("on-time-dispatch")} />
            <KpiCard label="Order Fill Rate"     value={wms.orderFillRate}     unit="%" target={95} source="WMS" delay={0.15} drillKey="order-fill-rate"    onDrill={openDrill} isBreach={activeBreaches.includes("order-fill-rate")} />
            <KpiCard label="Dock-to-Stock"       value={wms.dockToStock}       unit="h" target={3}  source="WMS" delay={0.2}  drillKey="dock-to-stock"      onDrill={openDrill} isBreach={activeBreaches.includes("dock-to-stock")} />
            <KpiCard label="Receiving Accuracy"  value={wms.receivingAccuracy} unit="%" target={97} source="WMS" delay={0.25} drillKey="receiving-accuracy"  onDrill={openDrill} isBreach={activeBreaches.includes("receiving-accuracy")} />
            <KpiCard label="Order Pendency"      value={wms.orderPendencyPct}  unit="%" target={5}  source="WMS" delay={0.30} isBreach={activeBreaches.includes("order-pendency")} />
          </div>
        </div>

        {/* TMS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={15} className="text-blue-500" />
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">TMS · Transport</p>
          </div>
          <div className="space-y-3">
            <KpiCard label="On-Time Delivery"    value={tms.onTimeDelivery}    unit="%" target={92}   source="TMS" delay={0.1}  drillKey="on-time-delivery" onDrill={openDrill} isBreach={activeBreaches.includes("on-time-delivery")} />
            <KpiCard label="Delay Rate"          value={tms.delayRate}         unit="%" target={5}    source="TMS" delay={0.15} drillKey="delay-rate"       onDrill={openDrill} isBreach={activeBreaches.includes("delay-rate")} />
            <KpiCard label="Avg Transit Time"    value={tms.avgTransitDays}    unit="d" target={2.5}  source="TMS" delay={0.2}  isBreach={activeBreaches.includes("avg-transit-days")} />
            <KpiCard label="Cost / Shipment"     value={tms.costPerShipment}   unit="₹" target={3000} source="TMS" delay={0.25} />
            <KpiCard label="Tender Acceptance"   value={tms.tenderAcceptance}  unit="%" target={90}   source="TMS" delay={0.30} isBreach={activeBreaches.includes("tender-acceptance")} />
          </div>
        </div>

        {/* Planning */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PackageSearch size={15} className="text-indigo-500" />
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Planning · Inventory</p>
          </div>
          <div className="space-y-3">
            <KpiCard label="Stockout Risk (High)" value={planning.stockoutRiskHigh} unit=" SKUs" target={0}   source="Planning" delay={0.1}  drillKey="stockout-risk"    onDrill={openDrill} isBreach={activeBreaches.includes("stockout-risk")} />
            <KpiCard label="Days of Cover"         value={planning.avgDaysOfCover}   unit=" days" target={21}  source="Planning" delay={0.15} />
            <KpiCard label="Demand Variance"       value={planning.demandVariancePct}unit="%"    target={5}   source="Planning" delay={0.2}  drillKey="demand-variance"  onDrill={openDrill} isBreach={activeBreaches.includes("demand-variance")} />
            <KpiCard label="Inventory Value"       value={planning.inventoryValueCr} unit=" Cr ₹" target={5}  source="Planning" delay={0.25} />
            <KpiCard label="Active POs"            value={planning.activePos}        unit=""     target={60}  source="Planning" delay={0.30} />
          </div>
        </div>
      </div>

      {/* ── Trend Chart ── */}
      <div className="card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={15} className="text-indigo-400" />
          <p className="text-sm font-semibold text-slate-800">Supply Chain Reliability Trend</p>
          <span className="ml-auto text-xs text-slate-400">On-Time % by system · Monthly</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend_}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="wms"      name="WMS"      stroke="#14B8A6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="tms"      name="TMS"      stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="planning" name="Planning" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Cross-System Alerts ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={15} className="text-amber-400" />
          <p className="text-sm font-semibold text-slate-800">Cross-System Alerts</p>
          <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
            {alerts.filter((a) => a.severity === "critical").length} Critical
          </span>
        </div>
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-lg p-4 ${SEVERITY_STYLE[alert.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={SEVERITY_BADGE[alert.severity]}>
                      {alert.severity.toUpperCase()}
                    </span>
                    {alert.source.map((s) => (
                      <span key={s} className="badge-blue">{s}</span>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">Impact: {alert.impact}</p>
                  <p className="text-xs text-indigo-600 font-medium mt-1">→ {alert.action}</p>
                </div>
                <CheckCircle2 size={16} className="text-slate-300 mt-0.5 flex-shrink-0 cursor-pointer hover:text-emerald-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <DrillDownModal data={drillDown} onClose={() => setDrillDown(null)} />
      <AlertPanel open={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} activeBreaches={activeBreaches} />
    </AppShell>
  );
}
