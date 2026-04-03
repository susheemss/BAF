"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Warehouse, Truck, PackageSearch, Zap,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Bell, ArrowRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import AlertPanel from "@/components/AlertPanel";
import DataDrilldownModal, { TableDrilldown } from "@/components/DataDrilldownModal";
import { ALERT_RULES, evaluateRule, type KpiSnapshot } from "@/lib/alertConfig";
import {
  getWmsKpis, getTmsKpis, getPlanningKpis, getCrossKpis,
  getMonthlyTrend, getCrossAlerts, ALL_MONTHS, DATA_CONNECTED,
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
  label, value, unit, target, source, delay = 0, isBreach, onClick,
}: {
  label: string; value: number; unit: string;
  target: number; source: string; delay?: number;
  isBreach?: boolean; onClick?: () => void;
}) {
  const { icon: Icon, cls } = trend(value, target);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      onClick={onClick}
      className={`kpi-card relative ${isBreach ? "border-red-200 bg-red-50/40" : ""} ${onClick ? "cursor-pointer hover:shadow-md hover:border-indigo-300 transition-shadow" : ""}`}
    >
      {isBreach && (
        <span className="absolute top-2 right-2">
          <Bell size={12} className="text-red-400" />
        </span>
      )}
      {onClick && !isBreach && (
        <span className="absolute top-2 right-2 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">drill down ↗</span>
      )}
      <div className="flex items-start justify-between pr-4">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
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

export default function DashboardPage() {
  const [filters,        setFilters]        = useState(DEFAULT_FILTERS);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [activeBreaches, setActiveBreaches] = useState<string[]>([]);
  const [drilldown,      setDrilldown]      = useState<TableDrilldown | null>(null);

  const set = (id: string, val: string) => setFilters((f) => ({ ...f, [id]: val }));
  const reset = () => setFilters(DEFAULT_FILTERS);

  const { warehouse, fromMonth, toMonth } = filters;

  const wms      = getWmsKpis(warehouse);
  const tms      = getTmsKpis(warehouse);
  const [planningLive, setPlanningLive] = useState(getPlanningKpis(warehouse));

  useEffect(() => {
    const params = new URLSearchParams();
    if (warehouse !== "All") params.set("warehouse", warehouse);
    if (fromMonth !== "All") params.set("fromMonth", fromMonth);
    if (toMonth   !== "All") params.set("toMonth",   toMonth);
    fetch(`/api/planning?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.summary) {
          setPlanningLive({
            totalSkus:        json.summary.totalSkus,
            stockoutRiskHigh: json.summary.stockoutRiskHigh,
            avgDaysOfCover:   json.summary.avgDaysOfCover,
            demandVariancePct: json.summary.demandVariancePct,
            inventoryValueCr: json.summary.inventoryValueCr,
            activePos:        json.summary.activePos,
          });
        }
      })
      .catch(() => {});
  }, [warehouse, fromMonth, toMonth]);

  const planning = planningLive;
  const cross    = getCrossKpis(wms, tms, planning);

  // Filter trend data by month range
  const allTrend = getMonthlyTrend();
  const fromIdx  = fromMonth === "All" ? 0               : Math.max(0, allTrend.findIndex((t) => t.month === fromMonth));
  const toIdx    = toMonth   === "All" ? allTrend.length  : allTrend.findIndex((t) => t.month === toMonth) + 1;
  const trend_   = allTrend.slice(fromIdx, toIdx < 1 ? undefined : toIdx);

  const alerts   = DATA_CONNECTED ? getCrossAlerts(wms, tms, planning) : [];

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

  const WHS = ["DEL", "MUM", "BLR"] as const;

  const openDrilldown = (label: string) => {
    const wmsRows = WHS.map((wh) => {
      const k = getWmsKpis(wh);
      const vals: Record<string, number> = {
        "On-Time Dispatch":   k.onTimeDispatch,
        "Order Fill Rate":    k.orderFillRate,
        "Dock-to-Stock":      k.dockToStock,
        "Receiving Accuracy": k.receivingAccuracy,
        "Order Pendency":     k.orderPendencyPct,
      };
      return [wh, vals[label] ?? 0] as [string, number];
    });

    const tmsRows = WHS.map((wh) => {
      const k = getTmsKpis(wh);
      const vals: Record<string, number> = {
        "On-Time Delivery":  k.onTimeDelivery,
        "Delay Rate":        k.delayRate,
        "Avg Transit Time":  k.avgTransitDays,
        "Cost / Shipment":   k.costPerShipment,
        "Tender Acceptance": k.tenderAcceptance,
      };
      return [wh, vals[label] ?? 0] as [string, number];
    });

    const planRows = WHS.map((wh) => {
      const k = getPlanningKpis(wh);
      const vals: Record<string, number> = {
        "Stockout Risk (High)": k.stockoutRiskHigh,
        "Days of Cover":        k.avgDaysOfCover,
        "Demand Variance":      k.demandVariancePct,
        "Inventory Value":      k.inventoryValueCr,
        "Active POs":           k.activePos,
      };
      return [wh, vals[label] ?? 0] as [string, number];
    });

    const wmsLabels = ["On-Time Dispatch","Order Fill Rate","Dock-to-Stock","Receiving Accuracy","Order Pendency"];
    const tmsLabels = ["On-Time Delivery","Delay Rate","Avg Transit Time","Cost / Shipment","Tender Acceptance"];
    const planLabels = ["Stockout Risk (High)","Days of Cover","Demand Variance","Inventory Value","Active POs"];

    const lowerIsBetter = new Set(["Dock-to-Stock","Order Pendency","Delay Rate","Avg Transit Time","Cost / Shipment","Stockout Risk (High)","Demand Variance"]);

    let rows: (string | number)[][];
    let subtitle: string;

    if (wmsLabels.includes(label)) {
      rows = [...wmsRows].sort((a, b) => lowerIsBetter.has(label) ? (b[1] as number) - (a[1] as number) : (b[1] as number) - (a[1] as number));
      subtitle = "Per-warehouse breakdown — from WMS data";
    } else if (tmsLabels.includes(label)) {
      rows = [...tmsRows].sort((a, b) => (b[1] as number) - (a[1] as number));
      subtitle = "Per-warehouse breakdown — from TMS data";
    } else if (planLabels.includes(label)) {
      rows = [...planRows].sort((a, b) => (b[1] as number) - (a[1] as number));
      subtitle = "Per-warehouse breakdown — from Planning data";
    } else {
      return;
    }

    setDrilldown({
      kpi: label + " — by Warehouse",
      subtitle,
      columns: ["Warehouse", label],
      rows,
    });
  };

  return (
    <AppShell>
      {drilldown && <DataDrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />}
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

      {/* ── No Data Banner ── */}
      {!DATA_CONNECTED && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No data connected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Connect your WMS, TMS, and Planning data sources to see live KPIs, trends, and signals.
            </p>
          </div>
        </div>
      )}

      {/* ── Cross-System KPIs ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3"
      >
        Cross-System KPIs
      </motion.p>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {DATA_CONNECTED ? (
          <>
            <CrossKpiCard label="Perfect Order Rate"       value={cross.perfectOrderRate}       unit="%" description="OTD × Fill Rate × On-Time Dispatch"  delay={0.05} />
            <CrossKpiCard label="Supply Chain Reliability" value={cross.supplyChainReliability} unit="%" description="Weighted composite across all systems" delay={0.10} />
            <CrossKpiCard label="Carrier-to-Shelf"         value={cross.carrierToShelfDays}     unit=" days" description="TMS transit + WMS dock-to-stock"  delay={0.15} />
            <CrossKpiCard label="SC Cycle Time"            value={cross.supplychainCycleTime}   unit="h" description="End-to-end: supplier to customer"     delay={0.20} />
            <CrossKpiCard label="Inbound Fulfillment Gap"  value={cross.inboundFulfillmentGap}  unit="%" description="SKUs at High stockout risk"           delay={0.25} />
          </>
        ) : (
          ["Perfect Order Rate", "Supply Chain Reliability", "Carrier-to-Shelf", "SC Cycle Time", "Inbound Fulfillment Gap"].map((label) => (
            <div key={label} className="card p-5 border-l-4 border-slate-200">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-2xl font-bold text-slate-300 mt-1">—</p>
              <p className="text-[11px] text-slate-300 mt-1">No data</p>
            </div>
          ))
        )}
      </div>

      {/* ── Per-System KPIs ── */}
      {DATA_CONNECTED ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Warehouse size={15} className="text-teal-500" />
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">WMS · Warehouse</p>
            </div>
            <div className="space-y-3">
              <KpiCard label="On-Time Dispatch"   value={wms.onTimeDispatch}    unit="%" target={92} source="WMS" delay={0.1}  isBreach={activeBreaches.includes("on-time-dispatch")}   onClick={() => openDrilldown("On-Time Dispatch")} />
              <KpiCard label="Order Fill Rate"    value={wms.orderFillRate}     unit="%" target={95} source="WMS" delay={0.15} isBreach={activeBreaches.includes("order-fill-rate")}     onClick={() => openDrilldown("Order Fill Rate")} />
              <KpiCard label="Dock-to-Stock"      value={wms.dockToStock}       unit="h" target={3}  source="WMS" delay={0.2}  isBreach={activeBreaches.includes("dock-to-stock")}       onClick={() => openDrilldown("Dock-to-Stock")} />
              <KpiCard label="Receiving Accuracy" value={wms.receivingAccuracy} unit="%" target={97} source="WMS" delay={0.25} isBreach={activeBreaches.includes("receiving-accuracy")}  onClick={() => openDrilldown("Receiving Accuracy")} />
              <KpiCard label="Order Pendency"     value={wms.orderPendencyPct}  unit="%" target={5}  source="WMS" delay={0.30} isBreach={activeBreaches.includes("order-pendency")}      onClick={() => openDrilldown("Order Pendency")} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck size={15} className="text-blue-500" />
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">TMS · Transport</p>
            </div>
            <div className="space-y-3">
              <KpiCard label="On-Time Delivery"  value={tms.onTimeDelivery}   unit="%" target={92}   source="TMS" delay={0.1}  isBreach={activeBreaches.includes("on-time-delivery")}  onClick={() => openDrilldown("On-Time Delivery")} />
              <KpiCard label="Delay Rate"        value={tms.delayRate}        unit="%" target={5}    source="TMS" delay={0.15} isBreach={activeBreaches.includes("delay-rate")}         onClick={() => openDrilldown("Delay Rate")} />
              <KpiCard label="Avg Transit Time"  value={tms.avgTransitDays}   unit="d" target={2.5}  source="TMS" delay={0.2}  isBreach={activeBreaches.includes("avg-transit-days")}   onClick={() => openDrilldown("Avg Transit Time")} />
              <KpiCard label="Cost / Shipment"   value={tms.costPerShipment}  unit="₹" target={3000} source="TMS" delay={0.25}                                                          onClick={() => openDrilldown("Cost / Shipment")} />
              <KpiCard label="Tender Acceptance" value={tms.tenderAcceptance} unit="%" target={90}   source="TMS" delay={0.30} isBreach={activeBreaches.includes("tender-acceptance")}  onClick={() => openDrilldown("Tender Acceptance")} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PackageSearch size={15} className="text-indigo-500" />
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Planning · Inventory</p>
            </div>
            <div className="space-y-3">
              <KpiCard label="Stockout Risk (High)" value={planning.stockoutRiskHigh}  unit=" SKUs" target={0}  source="Planning" delay={0.1}  isBreach={activeBreaches.includes("stockout-risk")}    onClick={() => openDrilldown("Stockout Risk (High)")} />
              <KpiCard label="Days of Cover"        value={planning.avgDaysOfCover}    unit=" days" target={21} source="Planning" delay={0.15}                                                                 onClick={() => openDrilldown("Days of Cover")} />
              <KpiCard label="Demand Variance"      value={planning.demandVariancePct} unit="%"    target={5}  source="Planning" delay={0.2}  isBreach={activeBreaches.includes("demand-variance")}           onClick={() => openDrilldown("Demand Variance")} />
              <KpiCard label="Inventory Value"      value={planning.inventoryValueCr}  unit=" Cr ₹" target={5} source="Planning" delay={0.25}                                                                 onClick={() => openDrilldown("Inventory Value")} />
              <KpiCard label="Active POs"           value={planning.activePos}         unit=""     target={60} source="Planning" delay={0.30}                                                                 onClick={() => openDrilldown("Active POs")} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
          Connect WMS, TMS, and Planning data to see per-system KPIs
        </div>
      )}

      {/* ── Trend Chart ── */}
      <div className="card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={15} className="text-indigo-400" />
          <p className="text-sm font-semibold text-slate-800">Supply Chain Reliability Trend</p>
          <span className="ml-auto text-xs text-slate-400">On-Time % by system · Monthly</span>
        </div>
        {DATA_CONNECTED ? (
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
        ) : (
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
            Upload monthly data to see reliability trend
          </div>
        )}
      </div>

      {/* ── Cross-System Signals Summary ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={15} className="text-amber-400" />
          <p className="text-sm font-semibold text-slate-800">Cross-System Signals</p>
        </div>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">All systems nominal — no active alerts</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              {(["critical", "high", "medium"] as const).map((sev) => {
                const count = alerts.filter((a) => a.severity === sev).length;
                if (!count) return null;
                const styles = {
                  critical: "bg-red-100 text-red-700 border-red-200",
                  high:     "bg-amber-100 text-amber-700 border-amber-200",
                  medium:   "bg-yellow-100 text-yellow-700 border-yellow-200",
                } as const;
                return (
                  <span key={sev} className={`text-xs font-semibold px-3 py-1 rounded-full border ${styles[sev]}`}>
                    {count} {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </span>
                );
              })}
            </div>
            <Link
              href="/control-tower"
              className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline flex-shrink-0"
            >
              View details in Control Tower <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
      <AlertPanel open={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} activeBreaches={activeBreaches} />
    </AppShell>
  );
}
