"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/wde/apiClient";

type Factor = { severity: string; text: string };
type Payload = { score: number; band: string; label: string; factors: Factor[]; signal_count?: number };

type BandKey = "normal" | "watch" | "high" | "critical";

const BAND: Record<BandKey, { color: string; ring: string; badge: string; text: string; glow: string }> = {
  normal:   { color: "#10b981", ring: "ring-emerald-500/30", badge: "bg-emerald-500",  text: "text-emerald-400",  glow: "" },
  watch:    { color: "#f59e0b", ring: "ring-amber-500/30",   badge: "bg-amber-500",    text: "text-amber-400",    glow: "" },
  high:     { color: "#f97316", ring: "ring-orange-500/30",  badge: "bg-orange-500",   text: "text-orange-400",   glow: "shadow-[0_0_40px_rgba(249,115,22,0.18)]" },
  critical: { color: "#ef4444", ring: "ring-red-500/30",     badge: "bg-red-500",      text: "text-red-400",      glow: "shadow-[0_0_50px_rgba(239,68,68,0.22)]" },
};

const SEV_DOT: Record<string, string> = {
  normal:   "bg-emerald-400",
  watch:    "bg-amber-400",
  high:     "bg-orange-400",
  critical: "bg-red-500",
};

const FALLBACK: Payload = {
  score: 64,
  band: "high",
  label: "High Disruption Risk",
  signal_count: 3,
  factors: [
    { severity: "high",  text: "On-Time Dispatch below SLA target — upload operational data to compute live score" },
    { severity: "watch", text: "Dock-to-Stock time elevated — upload inbound receipts for detailed breakdown" },
    { severity: "watch", text: "Connect backend to see real-time disruption signals across warehouse" },
  ],
};

function ArcGauge({ score, color }: { score: number; color: string }) {
  const R = 52;
  const cx = 68;
  const cy = 68;
  const arc = Math.PI * R;
  const offset = arc * (1 - score / 100);

  return (
    <svg width="136" height="74" viewBox="0 0 136 74" className="overflow-visible">
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={arc}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      />
    </svg>
  );
}

export default function DisruptionRiskBanner({
  params,
}: {
  params: Record<string, string | undefined>;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [display, setDisplay] = useState(0);

  const depKey = JSON.stringify(params);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await apiClient.get("/api/ai/disruption-risk-score", {
          params,
          timeout: 12000,
        });
        setData(res);
      } catch {
        setData(FALLBACK);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  // Animated score count-up
  useEffect(() => {
    if (!data) return;
    let current = 0;
    const target = data.score;
    const step = Math.max(target / 55, 1);
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplay(Math.round(current));
      if (current >= target) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [data?.score]);

  const band = BAND[(data?.band as BandKey) ?? "normal"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`mb-6 overflow-hidden rounded-2xl ring-1 ${band.ring} ${band.glow}`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] bg-slate-900 dark:bg-[#080f1e]">

        {/* ── Left: Score Panel ── */}
        <div className="relative flex flex-col items-center justify-center gap-1 px-6 py-6 border-b xl:border-b-0 xl:border-r border-white/[0.07]">

          {/* Subtle background glow behind gauge */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20 rounded-2xl"
            style={{ background: `radial-gradient(ellipse at 50% 80%, ${band.color}55 0%, transparent 70%)` }}
          />

          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 z-10">
            Disruption Risk Score
          </p>

          <div className="relative z-10 flex flex-col items-center">
            <ArcGauge score={data ? display : 0} color={band.color} />
            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pointer-events-none">
              <span className={`text-[3.25rem] font-bold leading-none tabular-nums ${band.text}`}>
                {display}
              </span>
              <span className="text-[11px] text-slate-600 mt-0.5">/ 100</span>
            </div>
          </div>

          <span className={`z-10 mt-2 rounded-full px-3.5 py-1 text-[11px] font-bold tracking-widest uppercase ${band.badge} text-white`}>
            {data?.band ?? "—"}
          </span>
          <p className="z-10 text-center text-xs text-slate-500 mt-0.5">{data?.label ?? "Calculating..."}</p>

          {data?.signal_count !== undefined && (
            <p className="z-10 text-[10px] text-slate-600 mt-1">
              {data.signal_count} signal{data.signal_count !== 1 ? "s" : ""} analysed
            </p>
          )}
        </div>

        {/* ── Right: Factors Panel ── */}
        <div className="px-6 py-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={13} className="text-slate-500" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              AI Risk Intelligence — Top Signals
            </p>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-600">
              <Activity size={10} /> Live
            </span>
          </div>

          {/* Skeleton while loading */}
          {!data && (
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-800 animate-pulse" />
                  <span className="h-3 w-full animate-pulse rounded bg-slate-800" style={{ animationDelay: `${i * 80}ms` }} />
                </li>
              ))}
            </ul>
          )}

          {data && (
            <ul className="space-y-3">
              {data.factors.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.09, duration: 0.3 }}
                  className="flex items-start gap-2.5"
                >
                  <span
                    className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${SEV_DOT[f.severity] ?? "bg-slate-500"}`}
                  />
                  <span className="text-sm leading-snug text-slate-300">{f.text}</span>
                </motion.li>
              ))}
            </ul>
          )}

          {data && data.factors.length === 0 && (
            <p className="text-sm text-emerald-400">No active risk signals — operations within all thresholds.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
