"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse, Truck, PackageSearch, Factory,
  User, ArrowRight, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Activity, RefreshCw,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import FilterBar, { FilterDef } from "@/components/FilterBar";
import DataDrilldownModal, { TableDrilldown } from "@/components/DataDrilldownModal";
import { getWmsKpis, getTmsKpis, getPlanningKpis, getCrossKpis, getCrossAlerts, ALL_MONTHS, DATA_CONNECTED } from "@/lib/loadData";

const WAREHOUSES = ["All", "DEL", "MUM", "BLR"];
const CATEGORIES = ["All", "Personal Care", "Food & Beverages", "Household"];

const CT_FILTERS: FilterDef[] = [
  { type: "select",  id: "warehouse", label: "Warehouse", options: WAREHOUSES },
  { type: "select",  id: "category",  label: "Category",  options: CATEGORIES },
  { type: "select",  id: "fromMonth", label: "From Month", options: ["All", ...ALL_MONTHS] },
  { type: "select",  id: "toMonth",   label: "To Month",   options: ["All", ...ALL_MONTHS] },
];

const DEFAULT_FILTERS = { warehouse: "DEL", category: "All", fromMonth: "All", toMonth: "All" };

// ── Node health colour ────────────────────────────────────────────────────────
function healthColor(score: number) {
  if (score >= 90) return { ring: "ring-emerald-400", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400", label: "Healthy" };
  if (score >= 80) return { ring: "ring-amber-400",   bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400",   label: "Watch"   };
  return               { ring: "ring-red-400",     bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     label: "At Risk"  };
}

// ── Animated flow arrow ───────────────────────────────────────────────────────
function FlowArrow({ label, value, status }: { label: string; value: string; status: "ok" | "warn" | "risk" }) {
  const col = status === "ok" ? "text-emerald-500 border-emerald-300" : status === "warn" ? "text-amber-500 border-amber-300" : "text-red-500 border-red-300";
  return (
    <div className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <div className={`flex items-center gap-1 border rounded-full px-2 py-0.5 ${col}`}>
        <span className="text-[11px] font-semibold">{value}</span>
        <ArrowRight size={11} />
      </div>
    </div>
  );
}

// ── Supply chain node ─────────────────────────────────────────────────────────
function ChainNode({
  icon: Icon, title, subtitle, score, metrics, delay = 0,
}: {
  icon: React.ElementType; title: string; subtitle: string;
  score: number; metrics: { label: string; value: string }[];
  delay?: number;
}) {
  const h = healthColor(score);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      className={`card p-4 ring-2 ${h.ring} min-w-[160px] flex-1`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${h.bg}`}>
          <Icon size={14} className={h.text} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">{title}</p>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${h.dot} animate-pulse`} />
          <span className={`text-[10px] font-semibold ${h.text}`}>{score}%</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">{m.label}</span>
            <span className="text-[10px] font-semibold text-slate-700">{m.value}</span>
          </div>
        ))}
      </div>
      <div className={`mt-3 text-[10px] font-semibold ${h.text} ${h.bg} rounded px-2 py-1 text-center`}>
        {h.label}
      </div>
    </motion.div>
  );
}

// ── Signal row ────────────────────────────────────────────────────────────────
const SIGNAL_ICONS = {
  critical: <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />,
  high:     <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />,
  medium:   <Activity      size={13} className="text-yellow-500 flex-shrink-0 mt-0.5" />,
};
const SIGNAL_ROW = {
  critical: "bg-red-50 border-red-200",
  high:     "bg-amber-50 border-amber-200",
  medium:   "bg-yellow-50 border-yellow-200",
};

// ── Pulse metric card ─────────────────────────────────────────────────────────
function PulseCard({ label, value, unit, delta, positive }: {
  label: string; value: number; unit: string; delta: string; positive: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span></p>
      <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${positive ? "text-emerald-500" : "text-red-500"}`}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {delta} vs last month
      </div>
    </div>
  );
}

export default function ControlTowerPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastRefresh, setLastRefresh] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [drilldown, setDrilldown] = useState<TableDrilldown | null>(null);

  const set = (id: string, val: string) => setFilters((f) => ({ ...f, [id]: val }));
  const reset = () => setFilters(DEFAULT_FILTERS);

  useEffect(() => {
    setLastRefresh(new Date().toLocaleTimeString("en-IN", { hour12: false }));
  }, [filters]);

  const { warehouse } = filters;
  const wms      = getWmsKpis(warehouse);
  const tms      = getTmsKpis(warehouse);
  const planning = getPlanningKpis(warehouse);
  const cross    = getCrossKpis(wms, tms, planning);
  const alerts   = (DATA_CONNECTED ? getCrossAlerts(wms, tms, planning) : []).filter((a) => !dismissed.includes(a.id));

  // Node reliability scores
  const supplierScore  = Math.round(tms.tenderAcceptance);
  const tmsInScore     = Math.round(tms.onTimeDelivery);
  const wmsScore       = Math.round((wms.onTimeDispatch + wms.orderFillRate + wms.receivingAccuracy) / 3);
  const tmsOutScore    = Math.round(tms.onTimeDelivery - 1.5);
  const customerScore  = Math.round(cross.perfectOrderRate);

  const WHS = ["DEL", "MUM", "BLR"] as const;

  const openPlanningDrilldown = (label: string) => {
    const rows = WHS.map((wh) => {
      const k = getPlanningKpis(wh);
      const vals: Record<string, number> = {
        "Total SKUs Tracked": k.totalSkus,
        "High Stockout Risk":  k.stockoutRiskHigh,
        "Avg Days of Cover":   k.avgDaysOfCover,
        "Inventory Value":     k.inventoryValueCr,
      };
      return [wh, vals[label] ?? 0] as [string, number];
    }).sort((a, b) => (b[1] as number) - (a[1] as number));
    setDrilldown({
      kpi: label + " — by Warehouse",
      subtitle: "Per-warehouse breakdown from Planning data",
      columns: ["Warehouse", label],
      rows,
    });
  };

  return (
    <AppShell>
      {drilldown && <DataDrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />}
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Live View</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Resilient Control Tower</h2>
          <p className="text-sm text-slate-400 mt-0.5">End-to-end supply chain signal board</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLastRefresh(new Date().toLocaleTimeString("en-IN", { hour12: false }))}
            className="flex items-center gap-2 text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          {lastRefresh && <span className="text-xs text-slate-400">Updated {lastRefresh}</span>}
        </div>
      </div>
      <FilterBar filters={CT_FILTERS} values={filters} onChange={set} onReset={reset} />

      {/* ── Pulse metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {DATA_CONNECTED ? (
          <>
            <PulseCard label="Perfect Order Rate"   value={cross.perfectOrderRate}       unit="%" delta="vs target" positive={cross.perfectOrderRate >= 80} />
            <PulseCard label="SC Reliability"       value={cross.supplyChainReliability} unit="%" delta="weighted composite" positive={cross.supplyChainReliability >= 85} />
            <PulseCard label="Carrier-to-Shelf"     value={cross.carrierToShelfDays}     unit="d" delta="transit + put-away" positive={cross.carrierToShelfDays <= 3} />
            <PulseCard label="Active Alerts"        value={alerts.length}                unit=""  delta={`${alerts.filter(a=>a.severity==="critical").length} critical`} positive={alerts.length === 0} />
            <PulseCard label="Stockout Risk SKUs"   value={planning.stockoutRiskHigh}    unit=""  delta="high risk" positive={planning.stockoutRiskHigh === 0} />
          </>
        ) : (
          ["Perfect Order Rate", "SC Reliability", "Carrier-to-Shelf", "Active Alerts", "Stockout Risk SKUs"].map((label) => (
            <div key={label} className="card p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
              <p className="text-2xl font-bold text-slate-300 mt-1">—</p>
              <p className="text-xs text-slate-300 mt-1">No data</p>
            </div>
          ))
        )}
      </div>

      {/* ── Supply Chain Flow ── */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={15} className="text-indigo-400" />
          <p className="text-sm font-semibold text-slate-800">Supply Chain Flow — Live Health</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* Supplier */}
          <ChainNode
            icon={Factory}
            title="Suppliers"
            subtitle="Kinaxis · Anaplan"
            score={supplierScore}
            metrics={[
              { label: "Tender Acceptance", value: `${tms.tenderAcceptance}%` },
              { label: "Active POs",         value: `${planning.activePos}` },
              { label: "Demand Variance",    value: `${planning.demandVariancePct}%` },
              { label: "Avg Lead Time",      value: `${tms.avgTransitDays}d` },
            ]}
            delay={0.05}
          />

          <FlowArrow
            label="Inbound TMS"
            value={`${tms.onTimeDelivery}% OTD`}
            status={tms.onTimeDelivery >= 90 ? "ok" : tms.onTimeDelivery >= 82 ? "warn" : "risk"}
          />

          {/* WMS */}
          <ChainNode
            icon={Warehouse}
            title="Warehouse"
            subtitle={`Blue Yonder · ${warehouse === "All" ? "DEL · MUM · BLR" : warehouse}`}
            score={wmsScore}
            metrics={[
              { label: "Days of Cover",    value: `${planning.avgDaysOfCover}d`  },
              { label: "Stockout Risk",    value: `${planning.stockoutRiskHigh} SKUs` },
              { label: "Fill Rate",        value: `${wms.orderFillRate}%`        },
              { label: "Dock-to-Stock",    value: `${wms.dockToStock}h`          },
            ]}
            delay={0.15}
          />

          <FlowArrow
            label="Outbound TMS"
            value={`${wms.onTimeDispatch}% OT`}
            status={wms.onTimeDispatch >= 90 ? "ok" : wms.onTimeDispatch >= 82 ? "warn" : "risk"}
          />

          {/* TMS Outbound */}
          <ChainNode
            icon={Truck}
            title="Transport"
            subtitle="TMS · Blue Dart"
            score={tmsOutScore}
            metrics={[
              { label: "On-Time Delivery", value: `${tms.onTimeDelivery}%`     },
              { label: "Delay Rate",       value: `${tms.delayRate}%`           },
              { label: "Avg Transit",      value: `${tms.avgTransitDays}d`      },
              { label: "Cost / Shipment",  value: `₹${tms.costPerShipment}`    },
            ]}
            delay={0.25}
          />

          <FlowArrow
            label="Last Mile"
            value={`${cross.perfectOrderRate}% POR`}
            status={cross.perfectOrderRate >= 80 ? "ok" : cross.perfectOrderRate >= 70 ? "warn" : "risk"}
          />

          {/* Customer */}
          <ChainNode
            icon={User}
            title="Customer"
            subtitle="B2B · B2C · B2B2C"
            score={customerScore}
            metrics={[
              { label: "Perfect Order Rate", value: `${cross.perfectOrderRate}%`        },
              { label: "SC Cycle Time",       value: `${cross.supplychainCycleTime}h`   },
              { label: "Carrier-to-Shelf",    value: `${cross.carrierToShelfDays}d`     },
            ]}
            delay={0.35}
          />
        </div>
      </div>

      {/* ── Planning Signal ── */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <PackageSearch size={15} className="text-indigo-400" />
          <p className="text-sm font-semibold text-slate-800">Planning Signal</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total SKUs Tracked",    value: `${planning.totalSkus}`,              sub: "across 3 warehouses",         color: "text-slate-800" },
            { label: "High Stockout Risk",     value: `${planning.stockoutRiskHigh} SKUs`,  sub: "< 7 days cover",              color: "text-red-600"   },
            { label: "Avg Days of Cover",      value: `${planning.avgDaysOfCover}d`,        sub: "target ≥ 21 days",            color: planning.avgDaysOfCover >= 21 ? "text-emerald-600" : "text-amber-600" },
            { label: "Inventory Value",        value: `₹${planning.inventoryValueCr} Cr`,  sub: "current holding",             color: "text-indigo-600" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-4 relative cursor-pointer hover:shadow-md hover:bg-slate-100 transition-all"
              onClick={() => openPlanningDrilldown(item.label)}>
              <span className="absolute top-2 right-2 text-[9px] text-slate-400 bg-white px-1.5 py-0.5 rounded-full">drill down ↗</span>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cross-System Alerts ── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={15} className="text-amber-400" />
          <p className="text-sm font-semibold text-slate-800">Active Cross-System Signals</p>
          <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
            {alerts.filter((a) => a.severity === "critical").length} Critical
          </span>
          {dismissed.length > 0 && (
            <button
              onClick={() => setDismissed([])}
              className="ml-auto text-xs text-indigo-500 hover:underline"
            >
              Restore {dismissed.length} dismissed
            </button>
          )}
        </div>

        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg"
            >
              <CheckCircle2 size={18} className="text-emerald-500" />
              <p className="text-sm text-emerald-700 font-medium">All systems nominal — no active alerts</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-lg p-4 border ${SIGNAL_ROW[alert.severity]}`}
                >
                  <div className="flex items-start gap-3">
                    {SIGNAL_ICONS[alert.severity]}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          alert.severity === "critical" ? "bg-red-100 text-red-700" :
                          alert.severity === "high"     ? "bg-amber-100 text-amber-700" :
                                                          "bg-yellow-100 text-yellow-700"
                        }`}>{alert.severity}</span>
                        {alert.source.map((s) => (
                          <span key={s} className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{s}</span>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-600">Impact:</span> {alert.impact}
                      </p>
                      <p className="text-xs text-indigo-600 font-medium mt-1">→ {alert.action}</p>
                    </div>
                    <button
                      onClick={() => setDismissed((d) => [...d, alert.id])}
                      className="text-slate-300 hover:text-emerald-500 transition-colors flex-shrink-0"
                      title="Dismiss"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
