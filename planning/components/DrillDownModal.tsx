"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Target, Lightbulb, ArrowRight } from "lucide-react";
import type { DrillDown } from "@/lib/drillDownData";

const TREND_ICON = {
  improving: { icon: TrendingUp,   cls: "text-emerald-500", label: "Improving"  },
  stable:    { icon: Minus,        cls: "text-amber-500",   label: "Stable"     },
  worsening: { icon: TrendingDown, cls: "text-red-500",     label: "Worsening"  },
};

const SOURCE_COLOR: Record<string, string> = {
  WMS:      "bg-teal-100 text-teal-700",
  TMS:      "bg-blue-100 text-blue-700",
  Planning: "bg-indigo-100 text-indigo-700",
};

const DIM_COLOR: Record<string, string> = {
  Carrier:     "bg-purple-100 text-purple-700",
  Route:       "bg-sky-100 text-sky-700",
  Warehouse:   "bg-teal-100 text-teal-700",
  Supplier:    "bg-orange-100 text-orange-700",
  SKU:         "bg-pink-100 text-pink-700",
  Category:    "bg-indigo-100 text-indigo-700",
  Shift:       "bg-slate-100 text-slate-600",
  Month:       "bg-yellow-100 text-yellow-700",
  "Weight Band": "bg-rose-100 text-rose-700",
};

function ImpactBar({ impact, isPositiveBad }: { impact: number; isPositiveBad: boolean }) {
  const pct = Math.min(Math.abs(impact) * 10, 100);
  const bad = isPositiveBad ? impact > 0 : impact < 0;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${bad ? "bg-red-400" : "bg-emerald-400"}`}
        />
      </div>
      <span className={`text-[11px] font-semibold ${bad ? "text-red-600" : "text-emerald-600"}`}>
        {impact > 0 ? "+" : ""}{impact} {isPositiveBad ? "pp" : "pp"}
      </span>
    </div>
  );
}

interface Props {
  data: DrillDown | null;
  onClose: () => void;
}

export default function DrillDownModal({ data, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Positive impact = bad for time/count KPIs (dock-to-stock, delay-rate, stockout)
  const positiveBad = data
    ? ["h", " SKUs", "%"].includes(data.unit) && data.target < data.value
    : false;

  const gap = data ? Math.abs(data.value - data.target) : 0;
  const atTarget = data ? (data.value >= data.target) : false;

  return (
    <AnimatePresence>
      {data && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SOURCE_COLOR[data.source] ?? "bg-slate-100 text-slate-600"}`}>
                    {data.source}
                  </span>
                  <span className="text-xs text-slate-400">Drill-Down</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{data.kpiLabel}</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors mt-1">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* KPI Scorecard */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Current Value</p>
                    <p className="text-4xl font-bold text-slate-900">{data.value}<span className="text-xl font-medium text-slate-400 ml-1">{data.unit}</span></p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-0.5">
                      <Target size={12} className="text-slate-400" />
                      <p className="text-xs text-slate-400">Target</p>
                    </div>
                    <p className="text-xl font-semibold text-slate-600">{data.target}{data.unit}</p>
                  </div>
                </div>

                {/* Gap bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>0{data.unit}</span>
                    <span className={atTarget ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                      {atTarget ? "On target" : `${gap.toFixed(1)}${data.unit} gap`}
                    </span>
                    <span>{data.target}{data.unit}</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((data.value / data.target) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${atTarget ? "bg-emerald-400" : data.value >= data.target * 0.9 ? "bg-amber-400" : "bg-red-400"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">{data.insight}</p>
              </div>

              {/* Factors */}
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">
                  Top Contributing Factors
                </p>
                <div className="space-y-3">
                  {data.factors.map((f, i) => {
                    const { icon: TIcon, cls, label: tLabel } = TREND_ICON[f.trend];
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${DIM_COLOR[f.dimension] ?? "bg-slate-100 text-slate-600"}`}>
                                {f.dimension}
                              </span>
                              <span className="text-sm font-semibold text-slate-800">{f.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{f.detail}</p>
                            <ImpactBar impact={f.impact} isPositiveBad={positiveBad} />
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold text-slate-800">{f.value}{f.unit}</p>
                            <div className={`flex items-center gap-1 justify-end mt-0.5 ${cls}`}>
                              <TIcon size={11} />
                              <span className="text-[10px] font-medium">{tLabel}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendation */}
              <div className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <ArrowRight size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-indigo-400 font-semibold mb-1">Recommended Action</p>
                  <p className="text-sm text-indigo-900 font-medium leading-relaxed">{data.recommendation}</p>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
