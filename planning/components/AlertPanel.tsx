"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bell, BellRing, CheckCircle2, AlertTriangle,
  Mail, RefreshCw, Shield, Clock, ChevronRight, Settings,
} from "lucide-react";
import type { AlertHistoryEntry } from "@/app/api/alerts/check/route";
import { ALERT_RULES } from "@/lib/alertConfig";

type Tab = "history" | "rules" | "settings";

const SEV_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning:  "bg-amber-100 text-amber-700 border-amber-200",
};
const SEV_DOT: Record<string, string> = {
  critical: "bg-red-500",
  warning:  "bg-amber-400",
};
const SOURCE_STYLE: Record<string, string> = {
  WMS:      "bg-teal-100 text-teal-700",
  TMS:      "bg-blue-100 text-blue-700",
  Planning: "bg-indigo-100 text-indigo-700",
};

interface Props {
  open:    boolean;
  onClose: () => void;
  activeBreaches: string[];   // list of kpiKeys currently breaching
}

export default function AlertPanel({ open, onClose, activeBreaches }: Props) {
  const [tab,         setTab]         = useState<Tab>("history");
  const [history,     setHistory]     = useState<AlertHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/alerts/check");
      const data = await res.json();
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* ── Panel Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <BellRing size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Alert Centre</h3>
                  <p className="text-xs text-slate-400">KPI threshold monitoring · 12 rules active</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeBreaches.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full border border-red-200">
                    {activeBreaches.length} breach{activeBreaches.length > 1 ? "es" : ""} active
                  </span>
                )}
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-slate-100 px-6 bg-white">
              {([
                { id: "history",  label: "Alert History", icon: Clock   },
                { id: "rules",    label: "Alert Rules",   icon: Shield  },
                { id: "settings", label: "Settings",      icon: Settings},
              ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === id
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            <div className="flex-1 overflow-y-auto">

              {/* History Tab */}
              {tab === "history" && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Recent Alerts</p>
                    <button
                      onClick={fetchHistory}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                  </div>

                  {(!Array.isArray(history) || history.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <CheckCircle2 size={28} className="text-emerald-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">All KPIs within thresholds</p>
                      <p className="text-xs text-slate-400 mt-1">No alerts have fired yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(history) ? history : []).map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[entry.severity]}`} />
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_STYLE[entry.severity]}`}>
                                  {entry.severity.toUpperCase()}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_STYLE[entry.source]}`}>
                                  {entry.source}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-slate-800">{entry.kpiLabel}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Value: <span className="font-medium text-red-600">{entry.value}{entry.unit}</span>
                                {" · "}Threshold: <span className="font-medium">{entry.threshold}{entry.unit}</span>
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {entry.emailSent ? (
                                <div className="flex items-center gap-1 text-emerald-500 text-[11px] font-medium">
                                  <Mail size={11} /> Sent
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                                  <Mail size={11} /> Not sent
                                </div>
                              )}
                              {entry.emailError && (
                                <p className="text-[10px] text-amber-500 mt-0.5 max-w-[140px] text-right leading-tight">{entry.emailError}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-50">
                            <Clock size={10} className="text-slate-300" />
                            <span className="text-[10px] text-slate-400">{entry.firedAt}</span>
                            <span className="text-slate-200 mx-1">·</span>
                            <span className="text-[10px] text-slate-400">
                              {entry.recipients.length} recipient{entry.recipients.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rules Tab */}
              {tab === "rules" && (
                <div className="p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">
                    Active Alert Rules ({ALERT_RULES.length})
                  </p>
                  <div className="space-y-2">
                    {ALERT_RULES.map((rule, i) => {
                      const isBreaching = activeBreaches.includes(rule.kpiKey);
                      return (
                        <motion.div
                          key={rule.kpiKey}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`border rounded-xl p-4 ${isBreaching ? "border-red-200 bg-red-50" : "border-slate-100 bg-white"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_STYLE[rule.severity]}`}>
                                  {rule.severity.toUpperCase()}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_STYLE[rule.source]}`}>
                                  {rule.source}
                                </span>
                                {isBreaching && (
                                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                                    <AlertTriangle size={10} /> ACTIVE BREACH
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-slate-800">{rule.kpiLabel}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Alert if{" "}
                                <span className="font-medium">
                                  {rule.condition === "below" ? "falls below" : "rises above"} {rule.threshold}{rule.unit}
                                </span>
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-end">
                                <Clock size={10} /> {rule.cooldownHours}h cooldown
                              </div>
                              <ChevronRight size={14} className="text-slate-300 mt-1 ml-auto" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {tab === "settings" && (
                <div className="p-5 space-y-6">

                  {/* Notification Status */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Notification Status</p>
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Alert emails are active</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Notifications fire automatically when any KPI breaches its threshold.</p>
                      </div>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Notification Preferences</p>
                    <div className="space-y-2">
                      {([
                        { sev: "critical", label: "Critical Alerts",  desc: "KPI severely below threshold — immediate action needed", col: SEV_STYLE["critical"] },
                        { sev: "warning",  label: "Warning Alerts",   desc: "KPI approaching breach — monitoring advised",           col: SEV_STYLE["warning"]  },
                      ] as const).map(({ sev, label, desc, col }) => (
                        <div key={sev} className={`border rounded-xl p-4 flex items-center justify-between gap-4 ${col}`}>
                          <div>
                            <p className="text-sm font-semibold capitalize">{label}</p>
                            <p className="text-xs mt-0.5 opacity-80">{desc}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-xs font-bold bg-white/60 px-2 py-1 rounded-lg">ON</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cooldown Info */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Alert Frequency</p>
                    <div className="border border-slate-100 rounded-xl bg-white divide-y divide-slate-50">
                      {[
                        { label: "Critical alerts",  value: "Once every 24 hours per KPI" },
                        { label: "Warning alerts",   value: "Once every 12 hours per KPI" },
                        { label: "Delivery method",  value: "Email (instant)"             },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm text-slate-500">{label}</span>
                          <span className="text-sm font-medium text-slate-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Placeholder recipients section — kept for structure */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Alert Recipients</p>
                    <div className="space-y-2">
                      {(["critical", "warning"] as const).map((sev) => (
                        <div key={sev} className={`border rounded-xl p-4 ${SEV_STYLE[sev]}`}>
                          <p className="text-xs font-bold uppercase tracking-wide mb-2 capitalize">{sev} Alerts</p>
                          <div className="space-y-1">
                            <p className="text-xs flex items-center gap-1.5">
                              <Mail size={10} /> Logistics Manager
                            </p>
                            <p className="text-xs flex items-center gap-1.5">
                              <Mail size={10} /> Warehouse Operations Lead
                            </p>
                            {sev === "critical" && (
                              <p className="text-xs flex items-center gap-1.5">
                                <Mail size={10} /> Supply Chain Director
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Bell size={12} />
                <span>24h cooldown · Gmail SMTP</span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">SCIP Alert Engine v2.0</span>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
